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
  
  return await query.orderBy(desc(harvests.submissionTime));
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
