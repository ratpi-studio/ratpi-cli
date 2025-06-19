import fs from "fs";
import path from "path";

import { fetchWorkflowsList, downloadWorkflowFile } from "./github";

const WORKFLOWS_DIR = ".github/workflows";

export async function listWorkflows(): Promise<string[]> {
  return fetchWorkflowsList();
}

export async function createWorkflowFromTemplate(templateName: string, destDir: string = WORKFLOWS_DIR): Promise<string | null> {
  const file = await downloadWorkflowFile(templateName);
  if (!file) return null;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, templateName);
  fs.writeFileSync(destPath, file);
  return destPath;
}
