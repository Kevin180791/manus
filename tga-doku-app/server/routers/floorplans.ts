import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { floorPlans, rooms } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const floorPlansRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const plans = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.projectId, input.projectId));

      return plans;
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        fileUrl: z.string(),
        floor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newPlan = await db.insert(floorPlans).values({
        id: nanoid(),
        projectId: input.projectId,
        name: input.name,
        fileUrl: input.fileUrl,
        floor: input.floor,
        createdAt: new Date(),
      });

      return { success: true, id: newPlan[0].insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(floorPlans).where(eq(floorPlans.id, input.id));
      return { success: true };
    }),
});

