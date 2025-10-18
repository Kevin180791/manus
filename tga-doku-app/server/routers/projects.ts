import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects, inspections, findings, photos } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const projectsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        location: projects.location,
        client: projects.client,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        createdAt: projects.createdAt,
        createdBy: projects.createdBy,
      })
      .from(projects)
      .orderBy(desc(projects.createdAt));

    // Get counts for each project
    const projectsWithCounts = await Promise.all(
      allProjects.map(async (project) => {
        const [inspectionCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(inspections)
          .where(eq(inspections.projectId, project.id));

        const [findingCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(findings)
          .leftJoin(inspections, eq(findings.inspectionId, inspections.id))
          .where(eq(inspections.projectId, project.id));

        return {
          ...project,
          inspectionCount: Number(inspectionCount?.count || 0),
          findingCount: Number(findingCount?.count || 0),
        };
      })
    );

    return projectsWithCounts;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      if (!project) {
        throw new Error("Project not found");
      }

      // Get related data
      const projectInspections = await db
        .select()
        .from(inspections)
        .where(eq(inspections.projectId, input.id))
        .orderBy(desc(inspections.createdAt));

      return {
        ...project,
        inspections: projectInspections,
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        location: z.string().optional(),
        client: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userId = ctx.user?.id || "anonymous";

      const newProject = await db.insert(projects).values({
        id: nanoid(),
        name: input.name,
        location: input.location,
        client: input.client,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        createdBy: userId,
        status: "preparation",
      });

      return { success: true, id: newProject[0].insertId };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        location: z.string().optional(),
        client: z.string().optional(),
        status: z.enum(["preparation", "in_progress", "review", "completed"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;

      await db
        .update(projects)
        .set({
          ...updateData,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        })
        .where(eq(projects.id, id));

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(projects).where(eq(projects.id, input.id));
      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [totalProjects] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects);

    const [activeProjects] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, "in_progress"));

    const [totalInspections] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inspections);

    const [totalFindings] = await db
      .select({ count: sql<number>`count(*)` })
      .from(findings);

    const [criticalFindings] = await db
      .select({ count: sql<number>`count(*)` })
      .from(findings)
      .where(eq(findings.priority, "critical"));

    return {
      totalProjects: Number(totalProjects?.count || 0),
      activeProjects: Number(activeProjects?.count || 0),
      totalInspections: Number(totalInspections?.count || 0),
      totalFindings: Number(totalFindings?.count || 0),
      criticalFindings: Number(criticalFindings?.count || 0),
    };
  }),
});

