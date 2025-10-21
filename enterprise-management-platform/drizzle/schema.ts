import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Employees table - Mitarbeiterverwaltung
 */
export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  employeeNumber: varchar("employeeNumber", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"]).default("active").notNull(),
  hireDate: timestamp("hireDate"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  employeeNumberIdx: index("employee_number_idx").on(table.employeeNumber),
}));

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Inventory items - Werkzeuge und IT-Geräte
 */
export const inventoryItems = mysqlTable("inventoryItems", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["tool", "it_equipment", "vehicle", "other"]).notNull(),
  serialNumber: varchar("serialNumber", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  model: varchar("model", { length: 100 }),
  purchaseDate: timestamp("purchaseDate"),
  purchasePrice: int("purchasePrice"), // in cents
  status: mysqlEnum("status", ["available", "assigned", "maintenance", "retired"]).default("available").notNull(),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor"]).default("good").notNull(),
  location: varchar("location", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  statusIdx: index("status_idx").on(table.status),
  serialNumberIdx: index("serial_number_idx").on(table.serialNumber),
}));

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

/**
 * Inventory assignments - Zuordnung von Inventar zu Mitarbeitern
 */
export const inventoryAssignments = mysqlTable("inventoryAssignments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  employeeId: varchar("employeeId", { length: 64 }).notNull(),
  assignedDate: timestamp("assignedDate").defaultNow().notNull(),
  returnedDate: timestamp("returnedDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  itemIdx: index("item_idx").on(table.itemId),
  employeeIdx: index("employee_idx").on(table.employeeId),
}));

export type InventoryAssignment = typeof inventoryAssignments.$inferSelect;
export type InsertInventoryAssignment = typeof inventoryAssignments.$inferInsert;

/**
 * Projects table - Projektmanagement
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  projectNumber: varchar("projectNumber", { length: 50 }),
  client: varchar("client", { length: 200 }),
  status: mysqlEnum("status", ["planning", "active", "on_hold", "completed", "cancelled"]).default("planning").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: int("budget"), // in cents
  location: varchar("location", { length: 300 }),
  projectManagerId: varchar("projectManagerId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  projectNumberIdx: index("project_number_idx").on(table.projectNumber),
  projectManagerIdx: index("project_manager_idx").on(table.projectManagerId),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project team members - Zuordnung von Mitarbeitern zu Projekten
 */
export const projectTeamMembers = mysqlTable("projectTeamMembers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  employeeId: varchar("employeeId", { length: 64 }).notNull(),
  role: varchar("role", { length: 100 }),
  assignedDate: timestamp("assignedDate").defaultNow().notNull(),
  removedDate: timestamp("removedDate"),
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  employeeIdx: index("employee_idx").on(table.employeeId),
}));

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type InsertProjectTeamMember = typeof projectTeamMembers.$inferInsert;

/**
 * Project tasks - Aufgaben und Terminplanung
 */
export const projectTasks = mysqlTable("projectTasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  taskType: mysqlEnum("taskType", ["task", "rfi", "defect", "question"]).default("task").notNull(),
  taskNumber: varchar("taskNumber", { length: 50 }),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "blocked", "answered", "closed"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assignedTo: varchar("assignedTo", { length: 64 }),
  requestedBy: varchar("requestedBy", { length: 64 }),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  responseDate: timestamp("responseDate"),
  response: text("response"),
  estimatedHours: int("estimatedHours"),
  actualHours: int("actualHours"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  statusIdx: index("status_idx").on(table.status),
  assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
  taskTypeIdx: index("task_type_idx").on(table.taskType),
}));

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;

/**
 * Project documents - Dokumentenverwaltung
 */
export const projectDocuments = mysqlTable("projectDocuments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["plan", "contract", "rfi", "measurement", "progress_report", "other"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  version: varchar("version", { length: 50 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  uploadedBy: varchar("uploadedBy", { length: 64 }),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  categoryIdx: index("category_idx").on(table.category),
}));

export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type InsertProjectDocument = typeof projectDocuments.$inferInsert;

/**
 * RFI (Request for Information) - Anfragen und Klärungen
 */
export const rfis = mysqlTable("rfis", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  rfiNumber: varchar("rfiNumber", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "in_review", "answered", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  requestedBy: varchar("requestedBy", { length: 64 }),
  assignedTo: varchar("assignedTo", { length: 64 }),
  requestDate: timestamp("requestDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  responseDate: timestamp("responseDate"),
  response: text("response"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  statusIdx: index("status_idx").on(table.status),
  rfiNumberIdx: index("rfi_number_idx").on(table.rfiNumber),
}));

export type RFI = typeof rfis.$inferSelect;
export type InsertRFI = typeof rfis.$inferInsert;

/**
 * Measurements - Aufmaße
 */
export const measurements = mysqlTable("measurements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 300 }),
  measurementDate: timestamp("measurementDate").notNull(),
  measuredBy: varchar("measuredBy", { length: 64 }),
  quantity: int("quantity"),
  unit: varchar("unit", { length: 50 }),
  unitPrice: int("unitPrice"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
}));

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = typeof measurements.$inferInsert;

/**
 * Progress reports - Fortschrittsberichte
 */
export const progressReports = mysqlTable("progressReports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  reportDate: timestamp("reportDate").notNull(),
  overallProgress: int("overallProgress").notNull(), // percentage 0-100
  summary: text("summary"),
  achievements: text("achievements"),
  issues: text("issues"),
  nextSteps: text("nextSteps"),
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
}));

export type ProgressReport = typeof progressReports.$inferSelect;
export type InsertProgressReport = typeof progressReports.$inferInsert;

/**
 * Notifications - Benachrichtigungen
 */
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["employee_added", "inventory_assigned", "project_created", "task_assigned", "rfi_created", "document_uploaded", "progress_report", "system"]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message"),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: varchar("relatedEntityId", { length: 64 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  isReadIdx: index("is_read_idx").on(table.isRead),
  typeIdx: index("type_idx").on(table.type),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Capacity planning - Kapazitätenplanung
 */
export const capacityPlanning = mysqlTable("capacityPlanning", {
  id: varchar("id", { length: 64 }).primaryKey(),
  employeeId: varchar("employeeId", { length: 64 }).notNull(),
  projectId: varchar("projectId", { length: 64 }),
  weekStartDate: timestamp("weekStartDate").notNull(),
  allocatedHours: int("allocatedHours").notNull(),
  availableHours: int("availableHours").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  createdBy: varchar("createdBy", { length: 64 }),
}, (table) => ({
  employeeIdx: index("employee_idx").on(table.employeeId),
  projectIdx: index("project_idx").on(table.projectId),
  weekIdx: index("week_idx").on(table.weekStartDate),
}));

export type CapacityPlanning = typeof capacityPlanning.$inferSelect;
export type InsertCapacityPlanning = typeof capacityPlanning.$inferInsert;

