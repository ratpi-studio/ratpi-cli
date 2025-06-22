import { Supervisor } from "./supervisor";

export async function runAgent(taskPrompt: string) {
  const supervisor = new Supervisor();
  return supervisor.executeTask(taskPrompt);
}