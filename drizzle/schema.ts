import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Made nullable for password-based auth
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(), // Made unique for login
  passwordHash: text("passwordHash"), // For password-based authentication
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "editor", "viewer"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User permissions table for granular access control
 */
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permissionType: varchar("permissionType", { length: 50 }).notNull(), // view_dashboard, edit_data, manage_users, etc.
  resourceFilter: text("resourceFilter"), // JSON string for filters (by parcela, tipo, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

/**
 * Main harvests table - stores harvest/cosecha data
 */
export const harvests = mysqlTable("harvests", {
  id: int("id").autoincrement().primaryKey(),
  externalId: int("externalId"), // _id from original system
  formhubUuid: varchar("formhubUuid", { length: 100 }),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  parcela: varchar("parcela", { length: 100 }), // escanea_la_parcela
  pesoCaja: int("pesoCaja"), // peso_de_la_caja in grams (multiply kg by 1000)
  fotoCaja: varchar("fotoCaja", { length: 255 }), // filename
  numeroCortadora: varchar("numeroCortadora", { length: 50 }),
  numeroCaja: varchar("numeroCaja", { length: 50 }),
  tipoHigo: varchar("tipoHigo", { length: 50 }), // primera calidad, desperdicio, etc.
  latitud: varchar("latitud", { length: 20 }),
  longitud: varchar("longitud", { length: 20 }),
  status: varchar("status", { length: 50 }), // submitted_via_web, etc.
  submissionTime: timestamp("submissionTime"),
  submittedBy: varchar("submittedBy", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Harvest = typeof harvests.$inferSelect;
export type InsertHarvest = typeof harvests.$inferInsert;

/**
 * Harvest attachments/images table
 */
export const harvestAttachments = mysqlTable("harvest_attachments", {
  id: int("id").autoincrement().primaryKey(),
  harvestId: int("harvestId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimetype: varchar("mimetype", { length: 100 }),
  originalUrl: text("originalUrl"),
  largeUrl: text("largeUrl"),
  mediumUrl: text("mediumUrl"),
  smallUrl: text("smallUrl"),
  localLargePath: varchar("localLargePath", { length: 500 }), // S3 path for large image
  localSmallPath: varchar("localSmallPath", { length: 500 }), // S3 path for small/thumbnail
  uid: varchar("uid", { length: 100 }),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HarvestAttachment = typeof harvestAttachments.$inferSelect;
export type InsertHarvestAttachment = typeof harvestAttachments.$inferInsert;

/**
 * Activity logs for audit trail
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(), // login, create_harvest, update_user, etc.
  resourceType: varchar("resourceType", { length: 50 }), // harvest, user, etc.
  resourceId: int("resourceId"),
  details: text("details"), // JSON string
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Cortadora configuration table - custom names for cortadoras
 * Numbers 97, 98, 99 are NOT cortadoras (they represent harvest types)
 */
export const cortadoraConfig = mysqlTable("cortadora_config", {
  id: int("id").autoincrement().primaryKey(),
  numeroCortadora: varchar("numeroCortadora", { length: 50 }).notNull().unique(),
  customName: varchar("customName", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CortadoraConfig = typeof cortadoraConfig.$inferSelect;
export type InsertCortadoraConfig = typeof cortadoraConfig.$inferInsert;

/**
 * KoboToolbox API configuration table
 * Stores API credentials and settings for synchronization
 */
export const koboConfig = mysqlTable("kobo_config", {
  id: int("id").autoincrement().primaryKey(),
  apiUrl: varchar("apiUrl", { length: 255 }).notNull().default('https://kf.smart-harvest.tecti-cloud.com'),
  assetId: varchar("assetId", { length: 100 }).notNull(),
  apiToken: text("apiToken").notNull(),
  lastSyncTime: timestamp("lastSyncTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KoboConfig = typeof koboConfig.$inferSelect;
export type InsertKoboConfig = typeof koboConfig.$inferInsert;
