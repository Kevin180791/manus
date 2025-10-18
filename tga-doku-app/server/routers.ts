import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { projectsRouter } from "./routers/projects";
import { floorPlansRouter } from "./routers/floorplans";
import { photosRouter } from "./routers/photos";
import { findingsRouter } from "./routers/findings";
import { inspectionsRouter } from "./routers/inspections";
import { reportsRouter } from "./routers/reports";

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

  projects: projectsRouter,
  floorPlans: floorPlansRouter,
  photos: photosRouter,
  findings: findingsRouter,
  inspections: inspectionsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
