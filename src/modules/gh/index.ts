import { spawnSync } from "child_process";
import chalk from "chalk";

export function runGh(args: string[]): void {
  const result = spawnSync("gh", args, { stdio: "inherit" });
  if (result.error) {
    console.error(chalk.red(`Failed to run gh: ${result.error.message}`));
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

export function switchGitUser(): void {
  const nameRes = spawnSync("gh", ["api", "user", "--jq", ".name"], { encoding: "utf8" });
  const emailRes = spawnSync("gh", ["api", "user", "--jq", ".email"], { encoding: "utf8" });
  const name = nameRes.stdout.trim();
  const email = emailRes.stdout.trim();
  if (!name || !email) {
    console.error(chalk.red("Could not retrieve user information from gh"));
    return;
  }
  spawnSync("git", ["config", "--global", "user.name", name], { stdio: "inherit" });
  spawnSync("git", ["config", "--global", "user.email", email], { stdio: "inherit" });
  console.log(chalk.green(`Configured git user as ${name} <${email}>`));
}
