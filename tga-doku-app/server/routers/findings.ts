import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { findings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const findingsRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allFindings = await db
        .select()
        .from(findings)
        .where(eq(findings.projectId, input.projectId));

      return allFindings;
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        inspectionId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        category: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]),
        location: z.string().optional(),
        recommendation: z.string().optional(),
        responsibility: z.string().optional(),
        deadline: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newFinding = await db.insert(findings).values({
        id: nanoid(),
        projectId: input.projectId,
        inspectionId: input.inspectionId,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        location: input.location,
        recommendation: input.recommendation,
        responsibility: input.responsibility,
        deadline: input.deadline,
        status: "open",
        createdAt: new Date(),
      });

      return { success: true, id: newFinding[0].insertId };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        location: z.string().optional(),
        recommendation: z.string().optional(),
        responsibility: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(findings)
        .set(updateData)
        .where(eq(findings.id, id));

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(findings).where(eq(findings.id, input.id));
      return { success: true };
    }),
});

