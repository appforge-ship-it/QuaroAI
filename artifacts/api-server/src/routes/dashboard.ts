import { Router, type IRouter } from "express";
import { desc, count, sql } from "drizzle-orm";
import { db, projectsTable, filesTable, executionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [projectCount] = await db
    .select({ value: count() })
    .from(projectsTable);

  const [fileCount] = await db.select({ value: count() }).from(filesTable);

  const [execCount] = await db
    .select({ value: count() })
    .from(executionsTable);

  const recentExecs = await db
    .select({
      projectId: executionsTable.projectId,
      createdAt: executionsTable.createdAt,
    })
    .from(executionsTable)
    .orderBy(desc(executionsTable.createdAt))
    .limit(5);

  const recentActivity = recentExecs.map((exec) => ({
    type: "execution",
    description: `Code executed in project #${exec.projectId}`,
    timestamp: exec.createdAt.toISOString(),
  }));

  res.json({
    totalProjects: projectCount.value,
    totalFiles: fileCount.value,
    totalExecutions: execCount.value,
    recentActivity,
  });
});

router.get("/dashboard/recent", async (_req, res): Promise<void> => {
  const projects = await db
    .select()
    .from(projectsTable)
    .orderBy(desc(projectsTable.lastOpenedAt))
    .limit(5);

  res.json(projects);
});

export default router;
