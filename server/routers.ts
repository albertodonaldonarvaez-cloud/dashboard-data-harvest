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

        // Create session token using the openId from database
        if (!user.openId) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Usuario no tiene openId configurado',
          });
        }
        
        const token = await sdk.createSessionToken(user.openId, {
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

  // ============= DATA IMPORT =============
  import: router({
    // Import harvests from JSON file
    importJSON: adminProcedure
      .input(z.object({
        data: z.array(z.object({
          escanea_la_parcela: z.string(),
          peso_de_la_caja: z.number(),
          numero_de_cortadora: z.string(),
          numero_de_caja: z.string(),
          tipo_de_higo: z.string(),
          start: z.string().optional(),
          foto_de_la_caja: z.string().optional(),
          _attachments: z.array(z.any()).optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        for (const item of input.data) {
          try {
            // Parse parcela (format: "367 -EL CHATO" or "232 -")
            const parcela = item.escanea_la_parcela.split('-')[0].trim();
            
            // Parse fecha from start field or use current date
            const submissionTime = item.start ? new Date(item.start) : new Date();
            
            // Determine tipo de higo based on numero_de_cortadora
            let tipoHigo = item.tipo_de_higo;
            if (item.numero_de_cortadora === '97') {
              tipoHigo = 'primera_calidad';
            } else if (item.numero_de_cortadora === '98') {
              tipoHigo = 'segunda_calidad';
            } else if (item.numero_de_cortadora === '99') {
              tipoHigo = 'desperdicio';
            }

            // Create harvest record
            await db.createHarvest({
              parcela,
              pesoCaja: item.peso_de_la_caja,
              numeroCortadora: item.numero_de_cortadora,
              numeroCaja: item.numero_de_caja,
              tipoHigo,
              submissionTime,
              status: 'submitted_via_web',
            });

            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Error en registro ${item.numero_de_caja}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        }

        await db.logActivity({
          userId: ctx.user.id,
          action: 'import_json',
          details: JSON.stringify({
            total: input.data.length,
            success: results.success,
            failed: results.failed,
          }),
        });

        return results;
      }),

    // Validate JSON structure before import
    validateJSON: adminProcedure
      .input(z.object({
        data: z.array(z.any()),
      }))
      .query(({ input }) => {
        const validation = {
          valid: 0,
          invalid: 0,
          errors: [] as string[],
          preview: [] as any[],
        };

        input.data.slice(0, 10).forEach((item, index) => {
          try {
            // Check required fields
            if (!item.escanea_la_parcela || !item.peso_de_la_caja || !item.numero_de_cortadora || !item.numero_de_caja) {
              throw new Error('Faltan campos requeridos');
            }

            // Parse parcela
            const parcela = item.escanea_la_parcela.split('-')[0].trim();
            
            validation.valid++;
            validation.preview.push({
              parcela,
              peso: item.peso_de_la_caja,
              cortadora: item.numero_de_cortadora,
              caja: item.numero_de_caja,
              tipo: item.tipo_de_higo,
            });
          } catch (error) {
            validation.invalid++;
            validation.errors.push(`Registro ${index + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        });

        return validation;
      }),
  }),

  // KoboToolbox Synchronization
  kobo: router({
    // Sync submissions from KoboToolbox API
    sync: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        sinceDate: z.string().optional(), // ISO date string
      }))
      .mutation(async ({ input }) => {
        const { fetchKoboSubmissions, processKoboSubmission, getDefaultKoboConfig } = await import('./kobo-client');
        const db = await import('./db');
        
        const config = getDefaultKoboConfig();
        
        if (!config.token) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'KoboToolbox API token no configurado. Agrega KOBO_API_TOKEN en las variables de entorno.',
          });
        }

        const results = {
          success: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[],
        };

        try {
          // Fetch submissions from KoboToolbox
          const options: any = {};
          if (input.limit) {
            options.limit = input.limit;
          }
          if (input.sinceDate) {
            options.since = new Date(input.sinceDate);
          }

          const submissions = await fetchKoboSubmissions(config, options);

          // Process and import each submission
          for (const submission of submissions) {
            try {
              const processed = processKoboSubmission(submission);
              
              if (!processed) {
                results.skipped++;
                results.errors.push(`Submission ${submission._id}: Datos inválidos o incompletos`);
                continue;
              }

              // Create harvest record
              await db.createHarvest({
                parcela: processed.parcela,
                pesoCaja: processed.pesoCaja,
                numeroCortadora: processed.numeroCortadora,
                numeroCaja: processed.numeroCaja,
                tipoHigo: processed.tipoHigo,
                submissionTime: processed.submissionTime,
                latitud: processed.latitud,
                longitud: processed.longitud,
                status: processed.status,
                submittedBy: processed.submittedBy,
              });

              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push(`Submission ${submission._id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
          }

          return results;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error al sincronizar con KoboToolbox: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          });
        }
      }),

    // Test connection to KoboToolbox API
    testConnection: adminProcedure.query(async () => {
      const { fetchKoboSubmissions, getDefaultKoboConfig } = await import('./kobo-client');
      
      const config = getDefaultKoboConfig();
      
      if (!config.token) {
        return {
          success: false,
          message: 'KoboToolbox API token no configurado',
        };
      }

      try {
        // Try to fetch just 1 submission to test connection
        await fetchKoboSubmissions(config, { limit: 1 });
        return {
          success: true,
          message: 'Conexión exitosa con KoboToolbox API',
        };
      } catch (error) {
        return {
          success: false,
          message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
