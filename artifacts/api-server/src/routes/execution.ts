import { Router, type IRouter } from "express";
import { spawn } from "child_process";
import { db, executionsTable } from "@workspace/db";
import { RunCodeParams, RunCodeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post(
  "/projects/:projectId/run",
  async (req, res): Promise<void> => {
    const params = RunCodeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = RunCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const startTime = Date.now();
    const language = parsed.data.language ?? "python";

    try {
      const result = await executeCode(parsed.data.code, language);
      const executionTime = (Date.now() - startTime) / 1000;

      await db.insert(executionsTable).values({
        projectId: params.data.projectId,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime,
      });

      res.json({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime,
      });
    } catch (err) {
      const executionTime = (Date.now() - startTime) / 1000;
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      res.json({
        stdout: "",
        stderr: `Execution error: ${errorMessage}`,
        exitCode: 1,
        executionTime,
      });
    }
  }
);

function executeCode(
  code: string,
  language: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let command: string;
    let args: string[];

    if (language === "python") {
      command = "python3";
      args = ["-c", code];
    } else if (language === "javascript") {
      command = "node";
      args = ["-e", code];
    } else {
      resolve({
        stdout: "",
        stderr: `Unsupported language: ${language}`,
        exitCode: 1,
      });
      return;
    }

    const proc = spawn(command, args, {
      timeout: 30000,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (exitCode) => {
      resolve({
        stdout: stdout.slice(0, 50000),
        stderr: stderr.slice(0, 50000),
        exitCode: exitCode ?? 1,
      });
    });

    proc.on("error", (err) => {
      resolve({
        stdout: "",
        stderr: `Failed to start process: ${err.message}`,
        exitCode: 1,
      });
    });
  });
}

export default router;
