import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { photos } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const photosRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.projectId, input.projectId));

      return allPhotos;
    }),

  upload: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        inspectionId: z.string().optional(),
        findingId: z.string().optional(),
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // For now, store base64 data directly
      // TODO: Implement S3 upload in production
      const photoId = nanoid();

      const newPhoto = await db.insert(photos).values({
        id: photoId,
        projectId: input.projectId,
        inspectionId: input.inspectionId,
        findingId: input.findingId,
        filePath: input.fileData, // Store base64 temporarily
        fileName: input.fileName,
        caption: input.caption,
        createdAt: new Date(),
      });

      return { success: true, id: photoId, url: input.fileData };
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        inspectionId: z.string().optional(),
        findingId: z.string().optional(),
        fileUrl: z.string(),
        caption: z.string().optional(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newPhoto = await db.insert(photos).values({
        id: nanoid(),
        projectId: input.projectId,
        inspectionId: input.inspectionId,
        findingId: input.findingId,
        filePath: input.fileUrl,
        caption: input.caption,
        position: input.position,
        createdAt: new Date(),
      });

      return { success: true, id: newPhoto[0].insertId };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        caption: z.string().optional(),
        position: z.number().optional(),
        floorPlanX: z.number().optional(),
        floorPlanY: z.number().optional(),
        viewDirection: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(photos)
        .set(updateData)
        .where(eq(photos.id, id));

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(photos).where(eq(photos.id, input.id));
      return { success: true };
    }),
});

