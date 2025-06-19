import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import chalk from 'chalk';

interface Cmd {
  name: string;
  description: string;
}

interface TemplateConfig {
  name?: string;
  commands?: Cmd[];
}

interface Options {
  template?: string;
  use?: string;
  installDeps?: boolean;
}

export default function createScriptInit(options: Options) {
  let template: TemplateConfig = { name: 'my-script', commands: [] };
  if (options.use) {
    const jsonPath = path.resolve(process.cwd(), options.use);
    if (fs.existsSync(jsonPath)) {
      template = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else {
      console.error(chalk.red(`Config file not found: ${jsonPath}`));
      process.exit(1);
    }
  } else if (options.template) {
    const builtIn = path.resolve(__dirname, '../../templates', `${options.template}.json`);
    if (fs.existsSync(builtIn)) {
      template = JSON.parse(fs.readFileSync(builtIn, 'utf8'));
    } else {
      console.error(chalk.red(`Template not found: ${options.template}`));
      process.exit(1);
    }
  }

  const scriptDir = path.resolve(process.cwd(), template.name || 'my-script');
  if (!fs.existsSync(scriptDir)) {
    fs.mkdirSync(scriptDir, { recursive: true });
  }

  fs.writeFileSync(path.join(scriptDir, 'index.js'), generateScript(template.commands || []));
  fs.chmodSync(path.join(scriptDir, 'index.js'), 0o755);
  console.log(chalk.green(`Created script in ${scriptDir}`));

  if (options.installDeps !== false) {
    installDeps(['commander', 'chalk']);
  }
}

function generateScript(commands: Cmd[]): string {
  const commandLines = commands
    .map(
      (c) =>
        `program.command('${c.name}').description('${c.description}').action(() => {\n  console.log(chalk.green('${c.name} executed'));\n});`
    )
    .join('\n');

  return `#!/usr/bin/env node
const { Command } = require('commander');
const chalk = require('chalk');

const program = new Command();
program.name('script').description('Generated script').version('0.1.0');

${commandLines}

program.parse();
`;
}

function detectPackageManager(): string {
  const agent = process.env.npm_config_user_agent || '';
  if (agent.startsWith('bun')) return 'bun';
  if (agent.includes('pnpm')) return 'pnpm';
  if (agent.includes('yarn')) return 'yarn';
  if (fs.existsSync('bun.lockb')) return 'bun';
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  return 'npm';
}

function installDeps(pkgs: string[]) {
  const manager = detectPackageManager();
  let cmd = manager;
  let args: string[] = [];
  switch (manager) {
    case 'bun':
      args = ['add', '-d', ...pkgs];
      break;
    case 'yarn':
      args = ['add', '-D', ...pkgs];
      break;
    case 'pnpm':
      args = ['add', '-D', ...pkgs];
      break;
    default:
      cmd = 'npm';
      args = ['install', '--save-dev', ...pkgs];
  }
  console.log(chalk.cyan(`Installing dev dependencies with ${manager}...`));
  spawnSync(cmd, args, { stdio: 'inherit' });
}
