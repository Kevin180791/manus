import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inspections, findings, photos } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const inspectionsRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allInspections = await db
        .select()
        .from(inspections)
        .where(eq(inspections.projectId, input.projectId));

      return allInspections;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const inspection = await db
        .select()
        .from(inspections)
        .where(eq(inspections.id, input.id))
        .limit(1);

      if (!inspection.length) {
        throw new Error("Inspection not found");
      }

      // Get related findings and photos
      const inspectionFindings = await db
        .select()
        .from(findings)
        .where(eq(findings.inspectionId, input.id));

      const inspectionPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.inspectionId, input.id));

      return {
        ...inspection[0],
        findings: inspectionFindings,
        photos: inspectionPhotos,
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        floorPlanId: z.string().optional(),
        inspectorId: z.string(),
        mode: z.enum(["guided", "quick_capture"]).default("guided"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const inspectionId = nanoid();

      const newInspection = await db.insert(inspections).values({
        id: inspectionId,
        projectId: input.projectId,
        floorPlanId: input.floorPlanId,
        inspectorId: input.inspectorId,
        mode: input.mode,
        status: "in_progress",
        inspectionDate: new Date(),
        createdAt: new Date(),
      });

      return { success: true, id: inspectionId };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "in_progress", "completed", "reviewed"]).optional(),
        inspectionDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(inspections)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(inspections.id, id));

      return { success: true };
    }),

  complete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(inspections)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(inspections.id, input.id));

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(inspections).where(eq(inspections.id, input.id));
      return { success: true };
    }),
});

