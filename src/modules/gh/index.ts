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
  const result = spawnSync("gh", ["auth", "switch"], { encoding: "utf8" });
  if (result.error) {
    console.error(chalk.red(`Failed to switch git user: ${result.error.message}`));
    return;
  }
  const loginRes = spawnSync("gh", ["api", "user", "--jq", ".login"], { encoding: "utf8" });
  const login = loginRes.stdout.trim();
  if (!login) {
    console.error(chalk.red("Could not retrieve user information from gh"));
    return;
  }
  spawnSync("git", ["config", "--global", "user.name", login], { stdio: "inherit" });
  console.log(chalk.green(`Configured git user as ${login}`));
}
