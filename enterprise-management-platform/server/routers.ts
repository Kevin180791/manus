import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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

  // ==================== EMPLOYEE ROUTES ====================
  employees: router({
    list: protectedProcedure.query(async () => {
      return await db.getEmployees();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getEmployee(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        position: z.string().optional(),
        department: z.string().optional(),
        employeeNumber: z.string().optional(),
        status: z.enum(["active", "inactive", "on_leave"]).default("active"),
        hireDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const employee = {
          id: randomUUID(),
          ...input,
          createdBy: ctx.user.id,
        };
        await db.createEmployee(employee);
        
        // Create notification for admin
        await db.createNotification({
          id: randomUUID(),
          userId: ctx.user.id,
          type: "employee_added",
          title: "Neuer Mitarbeiter hinzugefügt",
          message: `${employee.firstName} ${employee.lastName} wurde als neuer Mitarbeiter hinzugefügt.`,
          relatedEntityType: "employee",
          relatedEntityId: employee.id,
        });
        
        return employee;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        position: z.string().optional(),
        department: z.string().optional(),
        employeeNumber: z.string().optional(),
        status: z.enum(["active", "inactive", "on_leave"]).optional(),
        hireDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEmployee(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployee(input.id);
        return { success: true };
      }),
  }),

  // ==================== INVENTORY ROUTES ====================
  inventory: router({
    list: protectedProcedure.query(async () => {
      return await db.getInventoryItems();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getInventoryItem(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["tool", "it_equipment", "vehicle", "other"]),
        serialNumber: z.string().optional(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        purchaseDate: z.date().optional(),
        purchasePrice: z.number().optional(),
        status: z.enum(["available", "assigned", "maintenance", "retired"]).default("available"),
        condition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const item = {
          id: randomUUID(),
          ...input,
          createdBy: ctx.user.id,
        };
        await db.createInventoryItem(item);
        return item;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.enum(["tool", "it_equipment", "vehicle", "other"]).optional(),
        serialNumber: z.string().optional(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        purchaseDate: z.date().optional(),
        purchasePrice: z.number().optional(),
        status: z.enum(["available", "assigned", "maintenance", "retired"]).optional(),
        condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateInventoryItem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteInventoryItem(input.id);
        return { success: true };
      }),

    // Assignment operations
    assign: protectedProcedure
      .input(z.object({
        itemId: z.string(),
        employeeId: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const assignment = {
          id: randomUUID(),
          ...input,
          createdBy: ctx.user.id,
        };
        await db.createInventoryAssignment(assignment);
        
        // Create notification
        await db.createNotification({
          id: randomUUID(),
          userId: input.employeeId,
          type: "inventory_assigned",
          title: "Inventar zugewiesen",
          message: "Ihnen wurde ein neues Inventar zugewiesen.",
          relatedEntityType: "inventory_assignment",
          relatedEntityId: assignment.id,
        });
        
        return assignment;
      }),

    listAssignments: protectedProcedure.query(async () => {
      return await db.getInventoryAssignments();
    }),

    getEmployeeAssignments: protectedProcedure
      .input(z.object({ employeeId: z.string() }))
      .query(async ({ input }) => {
        return await db.getActiveAssignmentsByEmployee(input.employeeId);
      }),

    returnAssignment: protectedProcedure
      .input(z.object({ assignmentId: z.string() }))
      .mutation(async ({ input }) => {
        await db.returnInventoryAssignment(input.assignmentId);
        return { success: true };
      }),
  }),
  // ==================== DOCUMENT ROUTES ====================
  documents: router({
    list: protectedProcedure
      .query(async () => {
        return await db.getAllProjectDocuments();
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string(),
        category: z.enum(["plan", "contract", "rfi", "measurement", "progress_report", "other"]).default("other"),
        version: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const document = {
          id: randomUUID(),
          ...input,
          fileUrl: "",
          uploadedBy: ctx.user.id,
        };
        await db.createProjectDocument(document);
        
        // Create notification
        await db.createNotification({
          id: randomUUID(),
          userId: ctx.user.id,
          type: "document_uploaded",
          title: "Neues Dokument hochgeladen",
          message: `Dokument "${document.title}" wurde hochgeladen.`,
          relatedEntityType: "document",
          relatedEntityId: document.id,
        });
        
        return document;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectDocument(input.id);
        return { success: true };
      }),
  }),

  // ==================== PROJECT ROUTES ====================
  projects: router({
    list: protectedProcedure.query(async () => {
      return await db.getProjects();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getProject(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        projectNumber: z.string().optional(),
        client: z.string().optional(),
        status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        location: z.string().optional(),
        projectManagerId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = {
          id: randomUUID(),
          ...input,
          createdBy: ctx.user.id,
        };
        await db.createProject(project);
        
        // Create notification
        await db.createNotification({
          id: randomUUID(),
          userId: ctx.user.id,
          type: "project_created",
          title: "Neues Projekt erstellt",
          message: `Projekt "${project.name}" wurde erstellt.`,
          relatedEntityType: "project",
          relatedEntityId: project.id,
        });
        
        return project;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        projectNumber: z.string().optional(),
        client: z.string().optional(),
        status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        location: z.string().optional(),
        projectManagerId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),

    // Team management
    addTeamMember: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        employeeId: z.string(),
        role: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const member = {
          id: randomUUID(),
          ...input,
          createdBy: ctx.user.id,
        };
        await db.addTeamMember(member);
        return member;
      }),

    getTeamMembers: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        return await db.getProjectTeamMembers(input.projectId);
      }),

    removeTeamMember: protectedProcedure
      .input(z.object({ memberId: z.string() }))
      .mutation(async ({ input }) => {
        await db.removeTeamMember(input.memberId);
        return { success: true };
      }),

    // Tasks
    createTask: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        taskType: z.enum(["task", "rfi", "defect", "question"]).default("task"),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed", "blocked", "answered", "closed"]).default("pending"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        assignedTo: z.string().optional(),
        requestedBy: z.string().optional(),
        startDate: z.date().optional(),
        dueDate: z.date().optional(),
        estimatedHours: z.number().optional(),
        response: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate task number based on type
        const taskCount = await db.getTaskCountByType(input.projectId, input.taskType);
        const taskNumber = `${input.taskType.toUpperCase()}-${String(taskCount + 1).padStart(4, '0')}`;
        
        const task = {
          id: randomUUID(),
          ...input,
          taskNumber,
          requestedBy: input.requestedBy || ctx.user.id,
          createdBy: ctx.user.id,
        };
        await db.createProjectTask(task);
        
        // Create notification if assigned
        if (task.assignedTo) {
          await db.createNotification({
            id: randomUUID(),
            userId: task.assignedTo,
            type: "task_assigned",
            title: "Neue Aufgabe zugewiesen",
            message: `Ihnen wurde die Aufgabe "${task.title}" zugewiesen.`,
            relatedEntityType: "task",
            relatedEntityId: task.id,
          });
        }
        
        return task;
      }),

    list: protectedProcedure
      .query(async () => {
        return await db.getAllTasks();
      }),

    getByType: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        taskType: z.enum(["task", "rfi", "defect", "question"]).optional(),
      }))
      .query(async ({ input }) => {
        if (input.taskType) {
          return await db.getTasksByType(input.projectId, input.taskType);
        }
        return await db.getProjectTasks(input.projectId);
      }),

    updateTask: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed", "blocked", "answered", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        assignedTo: z.string().optional(),
        startDate: z.date().optional(),
        dueDate: z.date().optional(),
        completedDate: z.date().optional(),
        responseDate: z.date().optional(),
        response: z.string().optional(),
        estimatedHours: z.number().optional(),
        actualHours: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProjectTask(id, data);
        return { success: true };
      }),

    deleteTask: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectTask(input.id);
        return { success: true };
      }),

    // Documents
    uploadDocument: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        category: z.enum(["plan", "contract", "rfi", "measurement", "progress_report", "other"]),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        version: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const document = {
          id: randomUUID(),
          ...input,
          uploadedBy: ctx.user.id,
        };
        await db.createProjectDocument(document);
        
        // Create notification
        await db.createNotification({
          id: randomUUID(),
          userId: ctx.user.id,
          type: "document_uploaded",
          title: "Neues Dokument hochgeladen",
          message: `Dokument "${document.title}" wurde hochgeladen.`,
          relatedEntityType: "document",
          relatedEntityId: document.id,
        });
        
        return document;
      }),

    getDocuments: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        return await db.getProjectDocuments(input.projectId);
      }),

    deleteDocument: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectDocument(input.id);
        return { success: true };
      }),
  }),

  // ==================== RFI ROUTES ====================
  rfis: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(["open", "in_review", "answered", "closed"]).default("open"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        raisedBy: z.string().optional(),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const rfi = {
          id: randomUUID(),
          rfiNumber: `RFI-${Date.now()}`,
          subject: input.title,
          description: input.description || "",
          projectId: input.projectId,
          status: input.status,
          priority: input.priority,
          requestedBy: input.raisedBy || ctx.user.id,
          assignedTo: input.assignedTo,
          dueDate: input.dueDate,
        };
        await db.createRFI(rfi);
        
        // Create notification
        if (rfi.assignedTo) {
          await db.createNotification({
            id: randomUUID(),
            userId: rfi.assignedTo,
            type: "rfi_created",
            title: "Neue RFI erstellt",
            message: `RFI "${rfi.subject}" wurde Ihnen zugewiesen.`,
            relatedEntityType: "rfi",
            relatedEntityId: rfi.id,
          });
        }
        
        return rfi;
      }),

    list: protectedProcedure
      .query(async () => {
        return await db.getAllRFIs();
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        projectId: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["open", "in_review", "answered", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        raisedBy: z.string().optional(),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, title, ...rest } = input;
        const data: any = { ...rest };
        if (title) data.subject = title;
        await db.updateRFI(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteRFI(input.id);
        return { success: true };
      }),
  }),

  // ==================== MEASUREMENT ROUTES ====================
  measurements: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        measurementDate: z.date().optional(),
        measuredBy: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        unitPrice: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const measurement = {
          id: randomUUID(),
          ...input,
          measurementDate: input.measurementDate || new Date(),
          measuredBy: input.measuredBy || ctx.user.id,
          createdBy: ctx.user.id,
        };
        await db.createMeasurement(measurement);
        return measurement;
      }),

    list: protectedProcedure
      .query(async () => {
        return await db.getAllMeasurements();
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        measurementDate: z.date().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMeasurement(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteMeasurement(input.id);
        return { success: true };
      }),
  }),

  // ==================== PROGRESS REPORT ROUTES ====================
  progressReports: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string(),
        reportDate: z.date(),
        overallProgress: z.number().min(0).max(100),
        summary: z.string().optional(),
        achievements: z.string().optional(),
        issues: z.string().optional(),
        nextSteps: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const report = {
          id: randomUUID(),
          ...input,
          createdBy: ctx.user.id,
        };
        await db.createProgressReport(report);
        
        // Create notification
        await db.createNotification({
          id: randomUUID(),
          userId: ctx.user.id,
          type: "progress_report",
          title: "Neuer Fortschrittsbericht",
          message: `Fortschrittsbericht "${report.title}" wurde erstellt.`,
          relatedEntityType: "progress_report",
          relatedEntityId: report.id,
        });
        
        return report;
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        return await db.getProgressReports(input.projectId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteProgressReport(input.id);
        return { success: true };
      }),
  }),

  // ==================== NOTIFICATION ROUTES ====================
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),

    unread: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ==================== CAPACITY PLANNING ROUTES ====================
  capacity: router({
    create: protectedProcedure
      .input(z.object({
        employeeId: z.string(),
        projectId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        allocatedHours: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const capacity = {
          id: randomUUID(),
          weekStartDate: input.startDate,
          allocatedHours: input.allocatedHours || 40,
          availableHours: 40,
          employeeId: input.employeeId,
          projectId: input.projectId,
          createdBy: ctx.user.id,
        };
        await db.createCapacityPlanning(capacity);
        return capacity;
      }),

    list: protectedProcedure
      .query(async () => {
        return await db.getAllCapacityPlanning();
      }),

    getByEmployee: protectedProcedure
      .input(z.object({
        employeeId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getCapacityPlanningByEmployee(input.employeeId, input.startDate, input.endDate);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        projectId: z.string().optional(),
        allocatedHours: z.number().optional(),
        availableHours: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCapacityPlanning(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteCapacityPlanning(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

