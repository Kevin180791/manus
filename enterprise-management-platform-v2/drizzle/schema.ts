import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, index, decimal } from "drizzle-orm/mysql-core";

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
  category: mysqlEnum("category", ["plan", "contract", "rfi", "measurement", "progress_report", "export", "other"]).notNull(),
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
 * Measurement Positions - Aufmaß-Positionen (mehrere Positionen pro Aufmaß)
 */
export const measurementPositions = mysqlTable("measurementPositions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  measurementId: varchar("measurementId", { length: 64 }).notNull(),
  position: int("position").notNull(), // Position number (1, 2, 3, ...)
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  measurementIdx: index("measurement_idx").on(table.measurementId),
}));

export type MeasurementPosition = typeof measurementPositions.$inferSelect;
export type InsertMeasurementPosition = typeof measurementPositions.$inferInsert;

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
  type: mysqlEnum("type", ["employee_added", "inventory_assigned", "project_created", "task_assigned", "rfi_created", "document_uploaded", "progress_report", "system", "defect_assigned"]).notNull(),
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

/**
 * Daily Reports - Bautagebuch
 */
export const dailyReports = mysqlTable("dailyReports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  reportDate: timestamp("reportDate").notNull(),
  weather: varchar("weather", { length: 100 }),
  temperature: varchar("temperature", { length: 50 }),
  workDescription: text("workDescription"),
  specialOccurrences: text("specialOccurrences"),
  attendees: text("attendees"), // JSON array
  workHours: int("workHours"),
  equipmentUsed: text("equipmentUsed"),
  materialsDelivered: text("materialsDelivered"),
  visitorsContractors: text("visitorsContractors"),
  safetyIncidents: text("safetyIncidents"),
  photos: text("photos"), // JSON array
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  dateIdx: index("date_idx").on(table.reportDate),
}));

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

/**
 * Inspection Protocols - Begehungsprotokolle
 */
export const inspectionProtocols = mysqlTable("inspectionProtocols", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  inspectionDate: timestamp("inspectionDate").notNull(),
  inspectionType: mysqlEnum("inspectionType", ["regular", "special", "final", "acceptance"]).notNull(),
  participants: text("participants"), // JSON array
  areas: text("areas"), // JSON array
  findings: text("findings"), // JSON array
  generalNotes: text("generalNotes"),
  nextSteps: text("nextSteps"),
  status: mysqlEnum("status", ["draft", "completed", "approved"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  dateIdx: index("date_idx").on(table.inspectionDate),
  statusIdx: index("status_idx").on(table.status),
}));

export type InspectionProtocol = typeof inspectionProtocols.$inferSelect;
export type InsertInspectionProtocol = typeof inspectionProtocols.$inferInsert;

/**
 * Defect Protocols - Mängelprotokolle
 */
export const defectProtocols = mysqlTable("defectProtocols", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  defectNumber: varchar("defectNumber", { length: 50 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 200 }),
  trade: varchar("trade", { length: 100 }),
  category: varchar("category", { length: 100 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "verified", "closed"]).default("open").notNull(),
  responsibleParty: varchar("responsibleParty", { length: 200 }),
  responsibleContact: varchar("responsibleContact", { length: 200 }),
  detectedDate: timestamp("detectedDate").notNull(),
  dueDate: timestamp("dueDate"),
  resolvedDate: timestamp("resolvedDate"),
  verifiedDate: timestamp("verifiedDate"),
  detectionPhotos: text("detectionPhotos"), // JSON array
  resolutionPhotos: text("resolutionPhotos"), // JSON array
  detectedBy: varchar("detectedBy", { length: 64 }),
  assignedTo: varchar("assignedTo", { length: 64 }),
  resolutionNotes: text("resolutionNotes"),
  verificationNotes: text("verificationNotes"),
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  statusIdx: index("status_idx").on(table.status),
  severityIdx: index("severity_idx").on(table.severity),
  defectNumberIdx: index("defect_number_idx").on(table.defectNumber),
}));

export type DefectProtocol = typeof defectProtocols.$inferSelect;
export type InsertDefectProtocol = typeof defectProtocols.$inferInsert;



/**
 * Work Packages (Arbeitspakete) - Tasks/categories within projects
 */
export const workPackages = mysqlTable("work_packages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(), // For "Hauptauftrag" and "Besondere Leistung"
  createdAt: timestamp("createdAt").defaultNow(),
  createdBy: varchar("createdBy", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  projectIdx: index("wp_project_idx").on(table.projectId),
}));

export type WorkPackage = typeof workPackages.$inferSelect;
export type InsertWorkPackage = typeof workPackages.$inferInsert;

/**
 * Time Entries (Zeiterfassung) - Completed time records
 */
export const timeEntries = mysqlTable("time_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  workPackageId: varchar("workPackageId", { length: 64 }),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  pauseDuration: int("pauseDuration").default(0).notNull(), // in minutes
  totalDuration: int("totalDuration").notNull(), // in minutes
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  userIdx: index("te_user_idx").on(table.userId),
  projectIdx: index("te_project_idx").on(table.projectId),
  dateIdx: index("te_date_idx").on(table.startTime),
}));

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

/**
 * Time Sessions (Laufende Timer) - Active timer sessions
 */
export const timeSessions = mysqlTable("time_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  startTime: timestamp("startTime").notNull(),
  lastPauseStart: timestamp("lastPauseStart"),
  totalPauseDuration: int("totalPauseDuration").default(0).notNull(), // in minutes
  status: mysqlEnum("status", ["running", "paused"]).default("running").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  userIdx: index("ts_user_idx").on(table.userId),
  statusIdx: index("ts_status_idx").on(table.status),
}));

export type TimeSession = typeof timeSessions.$inferSelect;
export type InsertTimeSession = typeof timeSessions.$inferInsert;

