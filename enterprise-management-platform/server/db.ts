import { eq, and, desc, asc, gte, lte, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  employees,
  InsertEmployee,
  inventoryItems,
  InsertInventoryItem,
  inventoryAssignments,
  InsertInventoryAssignment,
  projects,
  InsertProject,
  projectTeamMembers,
  InsertProjectTeamMember,
  projectTasks,
  InsertProjectTask,
  projectDocuments,
  InsertProjectDocument,
  rfis,
  InsertRFI,
  measurements,
  InsertMeasurement,
  progressReports,
  InsertProgressReport,
  notifications,
  InsertNotification,
  capacityPlanning,
  InsertCapacityPlanning
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ==================== USER FUNCTIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
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
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
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

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== EMPLOYEE FUNCTIONS ====================

export async function createEmployee(employee: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(employees).values(employee);
  return employee;
}

export async function getEmployees() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(employees).orderBy(desc(employees.createdAt));
}

export async function getEmployee(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEmployee(id: string, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(employees).where(eq(employees.id, id));
}

// ==================== INVENTORY FUNCTIONS ====================

export async function createInventoryItem(item: InsertInventoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(inventoryItems).values(item);
  return item;
}

export async function getInventoryItems() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));
}

export async function getInventoryItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInventoryItem(id: string, data: Partial<InsertInventoryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
}

export async function deleteInventoryItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
}

// ==================== INVENTORY ASSIGNMENT FUNCTIONS ====================

export async function createInventoryAssignment(assignment: InsertInventoryAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(inventoryAssignments).values(assignment);
  
  // Update item status to assigned
  await db.update(inventoryItems).set({ status: 'assigned' }).where(eq(inventoryItems.id, assignment.itemId));
  
  return assignment;
}

export async function getInventoryAssignments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(inventoryAssignments).orderBy(desc(inventoryAssignments.assignedDate));
}

export async function getActiveAssignmentsByEmployee(employeeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(inventoryAssignments)
    .where(and(eq(inventoryAssignments.employeeId, employeeId), isNull(inventoryAssignments.returnedDate)))
    .orderBy(desc(inventoryAssignments.assignedDate));
}

export async function returnInventoryAssignment(assignmentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const assignment = await db.select().from(inventoryAssignments)
    .where(eq(inventoryAssignments.id, assignmentId)).limit(1);
  
  if (assignment.length > 0) {
    await db.update(inventoryAssignments)
      .set({ returnedDate: new Date() })
      .where(eq(inventoryAssignments.id, assignmentId));
    
    // Update item status to available
    await db.update(inventoryItems)
      .set({ status: 'available' })
      .where(eq(inventoryItems.id, assignment[0].itemId));
  }
}

// ==================== PROJECT FUNCTIONS ====================

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projects).values(project);
  return project;
}

export async function getProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProject(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProject(id: string, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projects).where(eq(projects.id, id));
}

// ==================== PROJECT TEAM FUNCTIONS ====================

export async function addTeamMember(member: InsertProjectTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projectTeamMembers).values(member);
  return member;
}

export async function getProjectTeamMembers(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectTeamMembers)
    .where(and(eq(projectTeamMembers.projectId, projectId), isNull(projectTeamMembers.removedDate)))
    .orderBy(asc(projectTeamMembers.assignedDate));
}

export async function removeTeamMember(memberId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectTeamMembers)
    .set({ removedDate: new Date() })
    .where(eq(projectTeamMembers.id, memberId));
}

// ==================== PROJECT TASK FUNCTIONS ====================

export async function createProjectTask(task: InsertProjectTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projectTasks).values(task);
  return task;
}

export async function getProjectTasks(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectTasks)
    .where(eq(projectTasks.projectId, projectId))
    .orderBy(desc(projectTasks.createdAt));
}

export async function updateProjectTask(id: string, data: Partial<InsertProjectTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectTasks).set(data).where(eq(projectTasks.id, id));
}

export async function deleteProjectTask(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectTasks).where(eq(projectTasks.id, id));
}

// ==================== DOCUMENT FUNCTIONS ====================

export async function createProjectDocument(document: InsertProjectDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projectDocuments).values(document);
  return document;
}

export async function getProjectDocuments(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectDocuments)
    .where(eq(projectDocuments.projectId, projectId))
    .orderBy(desc(projectDocuments.uploadedAt));
}

export async function deleteProjectDocument(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectDocuments).where(eq(projectDocuments.id, id));
}

// ==================== RFI FUNCTIONS ====================

export async function createRFI(rfi: InsertRFI) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(rfis).values(rfi);
  return rfi;
}

export async function getRFIs(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(rfis)
    .where(eq(rfis.projectId, projectId))
    .orderBy(desc(rfis.requestDate));
}

export async function getAllRFIs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(rfis)
    .orderBy(desc(rfis.requestDate));
}

export async function updateRFI(id: string, data: Partial<InsertRFI>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(rfis).set(data).where(eq(rfis.id, id));
}

export async function deleteRFI(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(rfis).where(eq(rfis.id, id));
}

// ==================== MEASUREMENT FUNCTIONS ====================

export async function createMeasurement(measurement: InsertMeasurement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(measurements).values(measurement);
  return measurement;
}

export async function getMeasurements(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(measurements)
    .where(eq(measurements.projectId, projectId))
    .orderBy(desc(measurements.measurementDate));
}

export async function updateMeasurement(id: string, data: Partial<InsertMeasurement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(measurements).set(data).where(eq(measurements.id, id));
}

export async function deleteMeasurement(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(measurements).where(eq(measurements.id, id));
}

// ==================== PROGRESS REPORT FUNCTIONS ====================

export async function createProgressReport(report: InsertProgressReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(progressReports).values(report);
  return report;
}

export async function getProgressReports(projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(progressReports)
    .where(eq(progressReports.projectId, projectId))
    .orderBy(desc(progressReports.reportDate));
}

export async function deleteProgressReport(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(progressReports).where(eq(progressReports.id, id));
}

// ==================== NOTIFICATION FUNCTIONS ====================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(notifications).values(notification);
  return notification;
}

export async function getUserNotifications(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotifications(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ==================== CAPACITY PLANNING FUNCTIONS ====================

export async function createCapacityPlanning(capacity: InsertCapacityPlanning) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(capacityPlanning).values(capacity);
  return capacity;
}

export async function getCapacityPlanningByEmployee(employeeId: string, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (startDate && endDate) {
    return await db.select().from(capacityPlanning).where(
      and(
        eq(capacityPlanning.employeeId, employeeId),
        gte(capacityPlanning.weekStartDate, startDate),
        lte(capacityPlanning.weekStartDate, endDate)
      )
    ).orderBy(asc(capacityPlanning.weekStartDate));
  }
  
  return await db.select().from(capacityPlanning)
    .where(eq(capacityPlanning.employeeId, employeeId))
    .orderBy(asc(capacityPlanning.weekStartDate));
}

export async function updateCapacityPlanning(id: string, data: Partial<InsertCapacityPlanning>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(capacityPlanning).set(data).where(eq(capacityPlanning.id, id));
}

export async function deleteCapacityPlanning(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(capacityPlanning).where(eq(capacityPlanning.id, id));
}


// ==================== HELPER FUNCTIONS FOR LISTS ====================

export async function getAllProjectDocuments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectDocuments)
    .orderBy(desc(projectDocuments.uploadedAt));
}

export async function getAllCapacityPlanning() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(capacityPlanning)
    .orderBy(desc(capacityPlanning.weekStartDate));
}

export async function getAllMeasurements() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(measurements)
    .orderBy(desc(measurements.measurementDate));
}

// ==================== TASK HELPER FUNCTIONS ====================

export async function getAllTasks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectTasks)
    .orderBy(desc(projectTasks.createdAt));
}

export async function getTasksByType(projectId: string, taskType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectTasks)
    .where(and(
      eq(projectTasks.projectId, projectId),
      eq(projectTasks.taskType, taskType as any)
    ))
    .orderBy(desc(projectTasks.createdAt));
}

export async function getTaskCountByType(projectId: string, taskType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const tasks = await db.select().from(projectTasks)
    .where(and(
      eq(projectTasks.projectId, projectId),
      eq(projectTasks.taskType, taskType as any)
    ));
  
  return tasks.length;
}
