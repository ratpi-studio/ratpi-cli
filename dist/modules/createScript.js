"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createScriptInit;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
const ajv_1 = __importDefault(require("ajv"));
const json_schema_draft_06_json_1 = __importDefault(require("ajv/dist/refs/json-schema-draft-06.json"));
async function createScriptInit(options) {
    const schemaPath = path_1.default.resolve(__dirname, '../../schemas/ratpi-cli-config.schema.json');
    const schema = JSON.parse(fs_1.default.readFileSync(schemaPath, 'utf8'));
    const ajv = new ajv_1.default({ strict: false });
    ajv.addMetaSchema(json_schema_draft_06_json_1.default);
    const validate = ajv.compile(schema);
    let config;
    if (options.use) {
        const jsonPath = path_1.default.resolve(process.cwd(), options.use);
        if (fs_1.default.existsSync(jsonPath)) {
            config = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf8'));
        }
        else {
            console.error(chalk_1.default.red(`Config file not found: ${jsonPath}`));
            process.exit(1);
        }
    }
    else if (options.template) {
        const builtIn = path_1.default.resolve(__dirname, '../../templates', `${options.template}.json`);
        if (fs_1.default.existsSync(builtIn)) {
            config = JSON.parse(fs_1.default.readFileSync(builtIn, 'utf8'));
        }
        else {
            console.error(chalk_1.default.red(`Template not found: ${options.template}`));
            process.exit(1);
        }
    }
    else {
        console.error(chalk_1.default.red('No configuration provided'));
        process.exit(1);
    }
    if (!config) {
        throw new Error('Configuration could not be loaded');
    }
    if (!validate(config)) {
        console.error(chalk_1.default.red('Invalid configuration:'));
        console.error(validate.errors);
        process.exit(1);
    }
    for (const a of config.args) {
        if (a.type === 'enum' && (!a.values || a.values.length === 0)) {
            console.error(chalk_1.default.red(`Arg ${a.name} is enum but values are missing`));
            process.exit(1);
        }
    }
    let output = options.output;
    if (!output) {
        output = await ask(`Output directory (${config.name}): `) || config.name;
    }
    const scriptDir = path_1.default.resolve(process.cwd(), output);
    if (!fs_1.default.existsSync(scriptDir)) {
        fs_1.default.mkdirSync(scriptDir, { recursive: true });
    }
    fs_1.default.writeFileSync(path_1.default.join(scriptDir, 'index.js'), generateScript(config));
    fs_1.default.chmodSync(path_1.default.join(scriptDir, 'index.js'), 0o755);
    console.log(chalk_1.default.green(`Created script in ${scriptDir}`));
    if (options.installDeps !== false) {
        installDeps(['commander', 'chalk']);
    }
}
function ask(question) {
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}
function escape(str) {
    return str.replace(/'/g, "\\'");
}
function generateOption(arg) {
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
function generateScript(config) {
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
function detectPackageManager() {
    const agent = process.env.npm_config_user_agent || '';
    if (agent.startsWith('bun'))
        return 'bun';
    if (agent.includes('pnpm'))
        return 'pnpm';
    if (agent.includes('yarn'))
        return 'yarn';
    if (fs_1.default.existsSync('bun.lock') || fs_1.default.existsSync('bun.lockb'))
        return 'bun';
    if (fs_1.default.existsSync('pnpm-lock.yaml'))
        return 'pnpm';
    if (fs_1.default.existsSync('yarn.lock'))
        return 'yarn';
    return 'bun';
}
function installDeps(pkgs) {
    const manager = detectPackageManager();
    let cmd = manager;
    let args = [];
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
    console.log(chalk_1.default.cyan(`Installing dev dependencies with ${manager}...`));
    (0, child_process_1.spawnSync)(cmd, args, { stdio: 'inherit' });
}
