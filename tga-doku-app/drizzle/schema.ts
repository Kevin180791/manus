import { mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, int, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "project_manager", "site_manager", "planner"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  client: varchar("client", { length: 255 }),
  status: mysqlEnum("status", ["preparation", "in_progress", "review", "completed"]).default("preparation").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Floor plans table
 */
export const floorPlans = mysqlTable("floorPlans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  filePath: varchar("filePath", { length: 512 }).notNull(),
  fileType: varchar("fileType", { length: 50 }),
  analyzed: boolean("analyzed").default(false),
  analysisData: json("analysisData"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type FloorPlan = typeof floorPlans.$inferSelect;
export type InsertFloorPlan = typeof floorPlans.$inferInsert;

/**
 * Rooms table
 */
export const rooms = mysqlTable("rooms", {
  id: varchar("id", { length: 64 }).primaryKey(),
  floorPlanId: varchar("floorPlanId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  coordinates: json("coordinates"),
  area: decimal("area", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Inspections table
 */
export const inspections = mysqlTable("inspections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  floorPlanId: varchar("floorPlanId", { length: 64 }),
  inspectorId: varchar("inspectorId", { length: 64 }).notNull(),
  inspectionDate: timestamp("inspectionDate"),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "reviewed"]).default("draft").notNull(),
  mode: mysqlEnum("mode", ["guided", "quick_capture"]).default("guided").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

/**
 * Findings table
 */
export const findings = mysqlTable("findings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  inspectionId: varchar("inspectionId", { length: 64 }),
  roomId: varchar("roomId", { length: 64 }),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  recommendation: text("recommendation"),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  positionX: decimal("positionX", { precision: 10, scale: 4 }),
  positionY: decimal("positionY", { precision: 10, scale: 4 }),
  viewDirection: decimal("viewDirection", { precision: 5, scale: 2 }),
  responsibility: varchar("responsibility", { length: 255 }),
  deadline: varchar("deadline", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Finding = typeof findings.$inferSelect;
export type InsertFinding = typeof findings.$inferInsert;

/**
 * Photos table
 */
export const photos = mysqlTable("photos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  findingId: varchar("findingId", { length: 64 }).notNull(),
  filePath: varchar("filePath", { length: 512 }).notNull(),
  thumbnailPath: varchar("thumbnailPath", { length: 512 }),
  caption: text("caption"),
  takenAt: timestamp("takenAt"),
  metadata: json("metadata"),
  aiAnalysis: json("aiAnalysis"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

/**
 * Recommendations table
 */
export const recommendations = mysqlTable("recommendations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  findingId: varchar("findingId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["measure", "responsibility", "deadline", "cost_estimate"]).notNull(),
  content: text("content").notNull(),
  aiGenerated: boolean("aiGenerated").default(false),
  approved: boolean("approved").default(false),
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

/**
 * Templates table
 */
export const templates = mysqlTable("templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  type: mysqlEnum("type", ["finding", "checklist", "report"]).notNull(),
  content: json("content").notNull(),
  isDefault: boolean("isDefault").default(false),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Reports table
 */
export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  inspectionId: varchar("inspectionId", { length: 64 }),
  type: mysqlEnum("type", ["word", "pdf", "presentation", "web"]).notNull(),
  filePath: varchar("filePath", { length: 512 }),
  generatedAt: timestamp("generatedAt").defaultNow(),
  generatedBy: varchar("generatedBy", { length: 64 }).notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Comments table
 */
export const comments = mysqlTable("comments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  findingId: varchar("findingId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Offline queue table
 */
export const offlineQueue = mysqlTable("offlineQueue", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  actionType: varchar("actionType", { length: 100 }).notNull(),
  payload: json("payload").notNull(),
  synced: boolean("synced").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  syncedAt: timestamp("syncedAt"),
});

export type OfflineQueue = typeof offlineQueue.$inferSelect;
export type InsertOfflineQueue = typeof offlineQueue.$inferInsert;

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  floorPlans: many(floorPlans),
  inspections: many(inspections),
  reports: many(reports),
}));

export const floorPlansRelations = relations(floorPlans, ({ one, many }) => ({
  project: one(projects, {
    fields: [floorPlans.projectId],
    references: [projects.id],
  }),
  rooms: many(rooms),
  inspections: many(inspections),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  floorPlan: one(floorPlans, {
    fields: [rooms.floorPlanId],
    references: [floorPlans.id],
  }),
  findings: many(findings),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  project: one(projects, {
    fields: [inspections.projectId],
    references: [projects.id],
  }),
  floorPlan: one(floorPlans, {
    fields: [inspections.floorPlanId],
    references: [floorPlans.id],
  }),
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
  }),
  findings: many(findings),
  reports: many(reports),
}));

export const findingsRelations = relations(findings, ({ one, many }) => ({
  inspection: one(inspections, {
    fields: [findings.inspectionId],
    references: [inspections.id],
  }),
  room: one(rooms, {
    fields: [findings.roomId],
    references: [rooms.id],
  }),
  photos: many(photos),
  recommendations: many(recommendations),
  comments: many(comments),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  finding: one(findings, {
    fields: [photos.findingId],
    references: [findings.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  finding: one(findings, {
    fields: [recommendations.findingId],
    references: [findings.id],
  }),
  creator: one(users, {
    fields: [recommendations.createdBy],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  finding: one(findings, {
    fields: [comments.findingId],
    references: [findings.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
