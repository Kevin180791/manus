import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects, findings, floorPlans, photos } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const reportsRouter = router({
  generateReport: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all project data
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      const projectFindings = await db
        .select()
        .from(findings)
        .where(eq(findings.projectId, input.projectId));

      const projectFloorPlans = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.projectId, input.projectId));

      const projectPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.projectId, input.projectId));

      const projectData = {
        project: project[0],
        findings: projectFindings,
        floorPlans: projectFloorPlans,
        photos: projectPhotos,
      };

      try {
        const scriptPath = path.join(__dirname, "scripts", "generate_report.py");
        const jsonData = JSON.stringify(projectData).replace(/"/g, '\\"');
        const { stdout } = await execAsync(
          `python3 "${scriptPath}" "${jsonData}"`
        );
        const reportPath = stdout.trim();

        return {
          success: true,
          reportPath,
          data: projectData,
        };
      } catch (error) {
        console.error("Error generating report:", error);
        return {
          success: false,
          error: "Failed to generate report",
          data: projectData,
        };
      }
    }),

  generatePresentation: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all project data
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      const projectFindings = await db
        .select()
        .from(findings)
        .where(eq(findings.projectId, input.projectId));

      const projectFloorPlans = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.projectId, input.projectId));

      const projectPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.projectId, input.projectId));

      // TODO: Generate presentation using slide tools
      // For now, return data structure
      return {
        success: true,
        data: {
          project: project[0],
          findings: projectFindings,
          floorPlans: projectFloorPlans,
          photos: projectPhotos,
        },
      };
    }),
});

