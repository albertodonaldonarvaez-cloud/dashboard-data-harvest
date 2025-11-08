import { eq, desc, and, gte, lte, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  harvests, 
  InsertHarvest, 
  Harvest,
  harvestAttachments,
  InsertHarvestAttachment,
  HarvestAttachment,
  userPermissions,
  InsertUserPermission,
  UserPermission,
  activityLogs,
  InsertActivityLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "admin" | "editor" | "viewer" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============= HARVEST OPERATIONS =============

export async function createHarvest(harvest: InsertHarvest): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(harvests).values(harvest);
  return Number(result[0].insertId);
}

export async function getAllHarvests(filters?: {
  startDate?: Date;
  endDate?: Date;
  parcela?: string;
  tipoHigo?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(harvests);
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(harvests.submissionTime, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(harvests.submissionTime, filters.endDate));
  }
  if (filters?.parcela) {
    conditions.push(like(harvests.parcela, `%${filters.parcela}%`));
  }
  if (filters?.tipoHigo) {
    conditions.push(eq(harvests.tipoHigo, filters.tipoHigo));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const results = await query.orderBy(desc(harvests.submissionTime));
  
  // Add first thumbnail image to each harvest for mosaic view
  const harvestsWithThumbs = await Promise.all(
    results.map(async (harvest) => {
      const attachments = await db.select()
        .from(harvestAttachments)
        .where(eq(harvestAttachments.harvestId, harvest.id))
        .limit(1);
      
      return {
        ...harvest,
        thumbnailUrl: attachments[0]?.smallUrl || null,
      };
    })
  );
  
  return harvestsWithThumbs;
}

export async function getHarvestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateHarvest(id: number, data: Partial<InsertHarvest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(harvests).set(data).where(eq(harvests.id, id));
}

export async function deleteHarvest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(harvests).where(eq(harvests.id, id));
}

export async function getHarvestStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(harvests.submissionTime, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(harvests.submissionTime, filters.endDate));
  }
  
  let query = db.select({
    totalCajas: sql<number>`COUNT(*)`,
    pesoTotal: sql<number>`SUM(${harvests.pesoCaja})`,
    promedioPeso: sql<number>`AVG(${harvests.pesoCaja})`,
  }).from(harvests);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query;
  return result[0];
}

export async function getHarvestsByTipo(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(harvests.submissionTime, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(harvests.submissionTime, filters.endDate));
  }
  
  let query = db.select({
    tipoHigo: harvests.tipoHigo,
    count: sql<number>`COUNT(*)`,
    pesoTotal: sql<number>`SUM(${harvests.pesoCaja})`,
  }).from(harvests).groupBy(harvests.tipoHigo);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query;
}

export async function getHarvestsByParcela(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(harvests.submissionTime, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(harvests.submissionTime, filters.endDate));
  }
  
  let query = db.select({
    parcela: harvests.parcela,
    count: sql<number>`COUNT(*)`,
    pesoTotal: sql<number>`SUM(${harvests.pesoCaja})`,
  }).from(harvests).groupBy(harvests.parcela);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(sql`COUNT(*)`));
}

// ============= ATTACHMENT OPERATIONS =============

export async function createAttachment(attachment: InsertHarvestAttachment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(harvestAttachments).values(attachment);
  return Number(result[0].insertId);
}

export async function getAttachmentsByHarvestId(harvestId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(harvestAttachments)
    .where(and(
      eq(harvestAttachments.harvestId, harvestId),
      eq(harvestAttachments.isDeleted, false)
    ));
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(harvestAttachments).set({ isDeleted: true }).where(eq(harvestAttachments.id, id));
}

// ============= PERMISSION OPERATIONS =============

export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
}

export async function createPermission(permission: InsertUserPermission): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userPermissions).values(permission);
  return Number(result[0].insertId);
}

export async function deleteUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
}

// ============= ACTIVITY LOG OPERATIONS =============

export async function logActivity(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(activityLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to log activity:", error);
  }
}

export async function getActivityLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}


// ============= CORTADORA CONFIGURATION OPERATIONS =============

import { cortadoraConfig, InsertCortadoraConfig, CortadoraConfig } from "../drizzle/schema";

export async function getAllCortadoras(): Promise<CortadoraConfig[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cortadoras: database not available");
    return [];
  }

  try {
    const result = await db.select().from(cortadoraConfig).orderBy(cortadoraConfig.numeroCortadora);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get cortadoras:", error);
    return [];
  }
}

export async function getCortadoraByNumber(numero: string): Promise<CortadoraConfig | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cortadora: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(cortadoraConfig)
      .where(eq(cortadoraConfig.numeroCortadora, numero))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get cortadora:", error);
    return undefined;
  }
}

export async function upsertCortadora(data: InsertCortadoraConfig): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert cortadora: database not available");
    return;
  }

  try {
    await db.insert(cortadoraConfig)
      .values(data)
      .onDuplicateKeyUpdate({
        set: {
          customName: data.customName,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert cortadora:", error);
    throw error;
  }
}

export async function deleteCortadora(numero: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete cortadora: database not available");
    return;
  }

  try {
    await db.delete(cortadoraConfig)
      .where(eq(cortadoraConfig.numeroCortadora, numero));
  } catch (error) {
    console.error("[Database] Failed to delete cortadora:", error);
    throw error;
  }
}

// Get top cortadoras with stats (excluding 97, 98, 99)
export async function getTopCortadoras(limit: number = 5): Promise<Array<{
  numeroCortadora: string;
  customName: string | null;
  count: number;
  pesoTotal: number;
  pesoPromedio: number;
}>> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get top cortadoras: database not available");
    return [];
  }

  try {
    // Get all harvests excluding 97, 98, 99
    const allHarvests = await db.select().from(harvests);
    
    const cortadoraStats: Record<string, { count: number; pesoTotal: number }> = {};
    
    allHarvests.forEach(h => {
      const numero = h.numeroCortadora;
      if (!numero || numero === '97' || numero === '98' || numero === '99') return;
      
      if (!cortadoraStats[numero]) {
        cortadoraStats[numero] = { count: 0, pesoTotal: 0 };
      }
      
      cortadoraStats[numero].count += 1;
      cortadoraStats[numero].pesoTotal += parseFloat(h.pesoCaja as string) || 0;
    });
    
    // Get custom names
    const configs = await getAllCortadoras();
    const configMap = new Map(configs.map(c => [c.numeroCortadora, c.customName]));
    
    // Convert to array and sort by peso total
    const results = Object.entries(cortadoraStats)
      .map(([numero, stats]) => ({
        numeroCortadora: numero,
        customName: configMap.get(numero) || null,
        count: stats.count,
        pesoTotal: stats.pesoTotal,
        pesoPromedio: stats.count > 0 ? stats.pesoTotal / stats.count : 0,
      }))
      .sort((a, b) => b.pesoTotal - a.pesoTotal)
      .slice(0, limit);
    
    return results;
  } catch (error) {
    console.error("[Database] Failed to get top cortadoras:", error);
    return [];
  }
}


// ========== KoboToolbox Configuration ==========

export async function getKoboConfig() {
  const db = await getDb();
  if (!db) return null;

  const { koboConfig } = await import('../drizzle/schema');
  const results = await db.select().from(koboConfig).limit(1);
  return results.length > 0 ? results[0] : null;
}

export async function saveKoboConfig(config: {
  apiUrl: string;
  assetId: string;
  apiToken: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { koboConfig } = await import('../drizzle/schema');
  
  // Check if config exists
  const existing = await getKoboConfig();
  
  if (existing) {
    // Update existing config
    await db.update(koboConfig)
      .set({
        apiUrl: config.apiUrl,
        assetId: config.assetId,
        apiToken: config.apiToken,
        updatedAt: new Date(),
      })
      .where(eq(koboConfig.id, existing.id));
  } else {
    // Insert new config
    await db.insert(koboConfig).values({
      apiUrl: config.apiUrl,
      assetId: config.assetId,
      apiToken: config.apiToken,
    });
  }
}

export async function updateLastSyncTime() {
  const db = await getDb();
  if (!db) return;

  const { koboConfig } = await import('../drizzle/schema');
  const existing = await getKoboConfig();
  
  if (existing) {
    await db.update(koboConfig)
      .set({ lastSyncTime: new Date() })
      .where(eq(koboConfig.id, existing.id));
  }
}
