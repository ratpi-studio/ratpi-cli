import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import readline from 'readline';
import Ajv from 'ajv';
import draft6Meta from 'ajv/dist/refs/json-schema-draft-06.json';

interface Arg {
  name: string;
  small?: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  description: string;
  example?: string | number;
  interactive: boolean;
  values?: string[];
}

interface RatpiCLIConfig {
  name: string;
  description: string;
  version: string;
  args: Arg[];
}

interface Options {
  template?: string;
  use?: string;
  installDeps?: boolean;
  output?: string;
}

export default async function createScriptInit(options: Options) {
  const schemaPath = path.resolve(__dirname, '../../schemas/ratpi-cli-config.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ strict: false });
  ajv.addMetaSchema(draft6Meta);
  const validate = ajv.compile(schema);

  let config: RatpiCLIConfig | undefined;
  if (options.use) {
    const jsonPath = path.resolve(process.cwd(), options.use);
    if (fs.existsSync(jsonPath)) {
      config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else {
      console.error(chalk.red(`Config file not found: ${jsonPath}`));
      process.exit(1);
    }
  } else if (options.template) {
    const builtIn = path.resolve(__dirname, '../../templates', `${options.template}.json`);
    if (fs.existsSync(builtIn)) {
      config = JSON.parse(fs.readFileSync(builtIn, 'utf8'));
    } else {
      console.error(chalk.red(`Template not found: ${options.template}`));
      process.exit(1);
    }
  } else {
    console.error(chalk.red('No configuration provided'));
    process.exit(1);
  }

  if (!config) {
    throw new Error('Configuration could not be loaded');
  }

  if (!validate(config)) {
    console.error(chalk.red('Invalid configuration:'));
    console.error(validate.errors);
    process.exit(1);
  }

  for (const a of config.args) {
    if (a.type === 'enum' && (!a.values || a.values.length === 0)) {
      console.error(chalk.red(`Arg ${a.name} is enum but values are missing`));
      process.exit(1);
    }
  }

  let output = options.output;
  if (!output) {
    output = await ask(`Output directory (${config.name}): `) || config.name;
  }

  const scriptDir = path.resolve(process.cwd(), output);
  if (!fs.existsSync(scriptDir)) {
    fs.mkdirSync(scriptDir, { recursive: true });
  }

  fs.writeFileSync(path.join(scriptDir, 'index.js'), generateScript(config));
  fs.chmodSync(path.join(scriptDir, 'index.js'), 0o755);
  console.log(chalk.green(`Created script in ${scriptDir}`));

  if (options.installDeps !== false) {
    installDeps(['commander', 'chalk']);
  }
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

function escape(str: string): string {
  return str.replace(/'/g, "\\'");
}

function generateOption(arg: Arg): string {
  if (arg.type === 'boolean') {
    const flag = `${arg.small ? '-' + arg.small + ', ' : ''}--${arg.name}`;
    return `  program.option('${flag}', '${escape(arg.description)}');`;
  }
  const value = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
  const flag = `${arg.small ? '-' + arg.small + ', ' : ''}--${arg.name} ${value}`;
  let desc = arg.description;
  if (arg.type === 'enum' && arg.values) {
    desc += ' (' + arg.values.join('|') + ')';
  }
  return `  program.option('${flag}', '${escape(desc)}');`;
}

function generateScript(config: RatpiCLIConfig): string {
  const optionLines = config.args.map((a) => generateOption(a)).join('\n');
  const interactive = config.args
    .filter((a) => a.interactive)
    .map((a) => `  if(!opts.${a.name}) opts.${a.name} = await ask('${escape(a.description)}: ');`)
    .join('\n');
  const header = `  const program = new Command();
  program.name('${escape(config.name)}')
    .description('${escape(config.description)}')
    .version('${config.version}');`;

  return `#!/usr/bin/env node
const { Command } = require('commander');
const chalk = require('chalk');
const readline = require('readline');

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(q, ans => { rl.close(); res(ans); }));
}

(async () => {
${header}
${optionLines}
  program.parse();
  const opts = program.opts();
${interactive}
  console.log(opts);
})();
`;
}

function detectPackageManager(): string {
  const agent = process.env.npm_config_user_agent || '';
  if (agent.startsWith('bun')) return 'bun';
  if (agent.includes('pnpm')) return 'pnpm';
  if (agent.includes('yarn')) return 'yarn';
  if (fs.existsSync('bun.lock') || fs.existsSync('bun.lockb')) return 'bun';
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  return 'bun';
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
