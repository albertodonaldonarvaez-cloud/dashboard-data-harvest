import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Solo los administradores pueden realizar esta acción' 
    });
  }
  return next({ ctx });
});

// Editor or admin procedure
const editorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'editor') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Necesitas permisos de editor o administrador' 
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= HARVEST ROUTES =============
  harvests: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        parcela: z.string().optional(),
        tipoHigo: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          parcela: input.parcela,
          tipoHigo: input.tipoHigo,
        } : undefined;
        
        return await db.getAllHarvests(filters);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const harvest = await db.getHarvestById(input.id);
        if (!harvest) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cosecha no encontrada' });
        }
        
        // Get attachments
        const attachments = await db.getAttachmentsByHarvestId(input.id);
        
        return { ...harvest, attachments };
      }),

    create: editorProcedure
      .input(z.object({
        parcela: z.string(),
        pesoCaja: z.number(),
        numeroCortadora: z.string(),
        numeroCaja: z.string(),
        tipoHigo: z.string(),
        latitud: z.string().optional(),
        longitud: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const harvestId = await db.createHarvest({
          ...input,
          submissionTime: new Date(),
          submittedBy: ctx.user.name || ctx.user.email || 'unknown',
          status: 'submitted_via_web',
        });
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'create_harvest',
          resourceType: 'harvest',
          resourceId: harvestId,
        });
        
        return { id: harvestId };
      }),

    update: editorProcedure
      .input(z.object({
        id: z.number(),
        parcela: z.string().optional(),
        pesoCaja: z.number().optional(),
        numeroCortadora: z.string().optional(),
        numeroCaja: z.string().optional(),
        tipoHigo: z.string().optional(),
        latitud: z.string().optional(),
        longitud: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateHarvest(id, data);
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'update_harvest',
          resourceType: 'harvest',
          resourceId: id,
        });
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteHarvest(input.id);
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'delete_harvest',
          resourceType: 'harvest',
          resourceId: input.id,
        });
        
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        } : undefined;
        
        const stats = await db.getHarvestStats(filters);
        const byTipo = await db.getHarvestsByTipo(filters);
        const byParcela = await db.getHarvestsByParcela(filters);
        
        return {
          general: stats,
          byTipo,
          byParcela,
        };
      }),
  }),

  // ============= USER MANAGEMENT ROUTES =============
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.id);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario no encontrado' });
        }
        
        const permissions = await db.getUserPermissions(input.id);
        return { ...user, permissions };
      }),

    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['admin', 'editor', 'viewer', 'user']),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'update_user_role',
          resourceType: 'user',
          resourceId: input.userId,
          details: JSON.stringify({ newRole: input.role }),
        });
        
        return { success: true };
      }),

    updatePermissions: adminProcedure
      .input(z.object({
        userId: z.number(),
        permissions: z.array(z.object({
          permissionType: z.string(),
          resourceFilter: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        // Delete existing permissions
        await db.deleteUserPermissions(input.userId);
        
        // Create new permissions
        for (const perm of input.permissions) {
          await db.createPermission({
            userId: input.userId,
            permissionType: perm.permissionType,
            resourceFilter: perm.resourceFilter,
          });
        }
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'update_user_permissions',
          resourceType: 'user',
          resourceId: input.userId,
        });
        
        return { success: true };
      }),
  }),

  // ============= ATTACHMENT/IMAGE ROUTES =============
  attachments: router({
    upload: editorProcedure
      .input(z.object({
        harvestId: z.number(),
        filename: z.string(),
        data: z.string(), // base64
        mimetype: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64
        const buffer = Buffer.from(input.data, 'base64');
        
        // Upload to S3 - large version
        const largeKey = `harvests/${input.harvestId}/large/${Date.now()}-${input.filename}`;
        const largeResult = await storagePut(largeKey, buffer, input.mimetype);
        
        // For now, use same image for small (in production, you'd resize it)
        const smallKey = `harvests/${input.harvestId}/small/${Date.now()}-${input.filename}`;
        const smallResult = await storagePut(smallKey, buffer, input.mimetype);
        
        // Save to database
        const attachmentId = await db.createAttachment({
          harvestId: input.harvestId,
          filename: input.filename,
          mimetype: input.mimetype,
          largeUrl: largeResult.url,
          smallUrl: smallResult.url,
          localLargePath: largeKey,
          localSmallPath: smallKey,
        });
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'upload_attachment',
          resourceType: 'attachment',
          resourceId: attachmentId,
        });
        
        return { 
          id: attachmentId,
          largeUrl: largeResult.url,
          smallUrl: smallResult.url,
        };
      }),

    listByHarvest: protectedProcedure
      .input(z.object({ harvestId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAttachmentsByHarvestId(input.harvestId);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteAttachment(input.id);
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'delete_attachment',
          resourceType: 'attachment',
          resourceId: input.id,
        });
        
        return { success: true };
      }),
  }),

  // ============= ACTIVITY LOGS =============
  logs: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getActivityLogs(input?.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
