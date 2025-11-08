import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import * as auth from "./auth";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";

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

    // Password-based login
    loginWithPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await auth.authenticateWithPassword(input.email, input.password);
        
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Email o contrase\u00f1a incorrectos',
          });
        }

        // Create session token
        const openId = user.openId || `local-${user.id}`;
        const token = await sdk.createSessionToken(openId, {
          name: user.name || '',
          expiresInMs: ONE_YEAR_MS,
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return { success: true, user };
      }),

    // Change own password
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify current password
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Usuario no tiene contrase\u00f1a configurada',
          });
        }

        const isValid = await auth.verifyPassword(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Contrase\u00f1a actual incorrecta',
          });
        }

        // Update password
        await auth.updateUserPassword(ctx.user.id, input.newPassword);

        await db.logActivity({
          userId: ctx.user.id,
          action: 'change_password',
          resourceType: 'user',
          resourceId: ctx.user.id,
        });

        return { success: true };
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

    // Create user with password
    createWithPassword: adminProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
        role: z.enum(['admin', 'editor', 'viewer', 'user']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await auth.createUserWithPassword({
          email: input.email,
          password: input.password,
          name: input.name,
          role: input.role,
        });

        await db.logActivity({
          userId: ctx.user.id,
          action: 'create_user',
          resourceType: 'user',
          details: JSON.stringify({ email: input.email, role: input.role }),
        });

        return { success: true };
      }),

    // Reset user password (admin only)
    resetPassword: adminProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        await auth.updateUserPassword(input.userId, input.newPassword);

        await db.logActivity({
          userId: ctx.user.id,
          action: 'reset_user_password',
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

  // ============= CORTADORA CONFIGURATION =============
  cortadoras: router({
    list: protectedProcedure
      .query(async () => {
        return await db.getAllCortadoras();
      }),

    topCortadoras: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getTopCortadoras(input?.limit || 5);
      }),

    upsert: adminProcedure
      .input(z.object({
        numeroCortadora: z.string(),
        customName: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertCortadora({
          numeroCortadora: input.numeroCortadora,
          customName: input.customName,
          isActive: input.isActive,
        });

        await db.logActivity({
          userId: ctx.user.id,
          action: 'upsert_cortadora',
          resourceType: 'cortadora',
          details: JSON.stringify(input),
        });

        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ numeroCortadora: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteCortadora(input.numeroCortadora);

        await db.logActivity({
          userId: ctx.user.id,
          action: 'delete_cortadora',
          resourceType: 'cortadora',
          details: JSON.stringify(input),
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
