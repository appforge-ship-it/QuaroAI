import { Router, type IRouter } from "express";
import { eq, desc, sql, count } from "drizzle-orm";
import { db, projectsTable, filesTable } from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      language: projectsTable.language,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      lastOpenedAt: projectsTable.lastOpenedAt,
      fileCount: count(filesTable.id),
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(projectsTable.id, filesTable.projectId))
    .groupBy(projectsTable.id)
    .orderBy(desc(projectsTable.updatedAt));

  res.json(projects);
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      name: parsed.data.name,
      language: parsed.data.language ?? "python",
    })
    .returning();

  const [mainFile] = await db
    .insert(filesTable)
    .values({
      projectId: project.id,
      name: "main.py",
      path: "main.py",
      content: '# Welcome to your new project!\nprint("Hello, World!")\n',
      isFolder: false,
    })
    .returning();

  res.status(201).json({ ...project, fileCount: 1 });
});

router.get("/projects/:projectId", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      language: projectsTable.language,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      lastOpenedAt: projectsTable.lastOpenedAt,
      fileCount: count(filesTable.id),
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(projectsTable.id, filesTable.projectId))
    .where(eq(projectsTable.id, params.data.projectId))
    .groupBy(projectsTable.id);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db
    .update(projectsTable)
    .set({ lastOpenedAt: new Date() })
    .where(eq(projectsTable.id, params.data.projectId));

  res.json(project);
});

router.patch("/projects/:projectId", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(projectsTable.id, params.data.projectId))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(project);
});

router.delete("/projects/:projectId", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
