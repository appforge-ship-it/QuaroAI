import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, filesTable, projectsTable } from "@workspace/db";
import {
  ListFilesParams,
  CreateFileParams,
  CreateFileBody,
  GetFileParams,
  UpdateFileParams,
  UpdateFileBody,
  DeleteFileParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects/:projectId/files", async (req, res): Promise<void> => {
  const params = ListFilesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const files = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.projectId))
    .orderBy(filesTable.name);

  res.json(files);
});

router.post("/projects/:projectId/files", async (req, res): Promise<void> => {
  const params = CreateFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let parentPath = "";
  if (parsed.data.parentId) {
    const [parent] = await db
      .select()
      .from(filesTable)
      .where(
        and(
          eq(filesTable.id, parsed.data.parentId),
          eq(filesTable.projectId, params.data.projectId)
        )
      );
    if (parent) {
      parentPath = parent.path + "/";
    }
  }

  const [file] = await db
    .insert(filesTable)
    .values({
      projectId: params.data.projectId,
      name: parsed.data.name,
      path: parentPath + parsed.data.name,
      content: parsed.data.isFolder ? null : (parsed.data.content ?? ""),
      isFolder: parsed.data.isFolder ?? false,
      parentId: parsed.data.parentId ?? null,
    })
    .returning();

  await db
    .update(projectsTable)
    .set({ updatedAt: new Date() })
    .where(eq(projectsTable.id, params.data.projectId));

  res.status(201).json(file);
});

router.get(
  "/projects/:projectId/files/:fileId",
  async (req, res): Promise<void> => {
    const params = GetFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [file] = await db
      .select()
      .from(filesTable)
      .where(
        and(
          eq(filesTable.id, params.data.fileId),
          eq(filesTable.projectId, params.data.projectId)
        )
      );

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.json(file);
  }
);

router.patch(
  "/projects/:projectId/files/:fileId",
  async (req, res): Promise<void> => {
    const params = UpdateFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateFileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }
    if (parsed.data.content !== undefined) {
      updateData.content = parsed.data.content;
    }

    const [file] = await db
      .update(filesTable)
      .set(updateData)
      .where(
        and(
          eq(filesTable.id, params.data.fileId),
          eq(filesTable.projectId, params.data.projectId)
        )
      )
      .returning();

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    await db
      .update(projectsTable)
      .set({ updatedAt: new Date() })
      .where(eq(projectsTable.id, params.data.projectId));

    res.json(file);
  }
);

router.delete(
  "/projects/:projectId/files/:fileId",
  async (req, res): Promise<void> => {
    const params = DeleteFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [file] = await db
      .delete(filesTable)
      .where(
        and(
          eq(filesTable.id, params.data.fileId),
          eq(filesTable.projectId, params.data.projectId)
        )
      )
      .returning();

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.sendStatus(204);
  }
);

export default router;
