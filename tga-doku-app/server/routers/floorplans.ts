import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { floorPlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
// import { storagePut } from "../_core/storage";

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

  upload: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        fileData: z.string(), // base64 encoded
        fileType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // For now, store the base64 data directly
      // TODO: Implement S3 upload in production
      const floorPlanId = nanoid();
      
      const newFloorPlan = await db.insert(floorPlans).values({
        id: floorPlanId,
        projectId: input.projectId,
        name: input.name,
        filePath: input.fileData, // Store base64 temporarily
        fileType: input.fileType,
        analyzed: false,
        createdAt: new Date(),
      });

      return { success: true, id: floorPlanId, url: input.fileData };
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

