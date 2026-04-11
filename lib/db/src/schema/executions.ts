import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const executionsTable = pgTable("executions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  stdout: text("stdout").notNull().default(""),
  stderr: text("stderr").notNull().default(""),
  exitCode: integer("exit_code").notNull().default(0),
  executionTime: real("execution_time").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Execution = typeof executionsTable.$inferSelect;
