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
function createScriptInit(options) {
    let template = { name: 'my-script', commands: [] };
    if (options.use) {
        const jsonPath = path_1.default.resolve(process.cwd(), options.use);
        if (fs_1.default.existsSync(jsonPath)) {
            template = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf8'));
        }
        else {
            console.error(chalk_1.default.red(`Config file not found: ${jsonPath}`));
            process.exit(1);
        }
    }
    else if (options.template) {
        const builtIn = path_1.default.resolve(__dirname, '../../templates', `${options.template}.json`);
        if (fs_1.default.existsSync(builtIn)) {
            template = JSON.parse(fs_1.default.readFileSync(builtIn, 'utf8'));
        }
        else {
            console.error(chalk_1.default.red(`Template not found: ${options.template}`));
            process.exit(1);
        }
    }
    const scriptDir = path_1.default.resolve(process.cwd(), template.name || 'my-script');
    if (!fs_1.default.existsSync(scriptDir)) {
        fs_1.default.mkdirSync(scriptDir, { recursive: true });
    }
    fs_1.default.writeFileSync(path_1.default.join(scriptDir, 'index.js'), generateScript(template.commands || []));
    fs_1.default.chmodSync(path_1.default.join(scriptDir, 'index.js'), 0o755);
    console.log(chalk_1.default.green(`Created script in ${scriptDir}`));
    if (options.installDeps !== false) {
        installDeps(['commander', 'chalk']);
    }
}
function generateScript(commands) {
    const commandLines = commands
        .map((c) => `program.command('${c.name}').description('${c.description}').action(() => {\n  console.log(chalk.green('${c.name} executed'));\n});`)
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
function detectPackageManager() {
    const agent = process.env.npm_config_user_agent || '';
    if (agent.startsWith('bun'))
        return 'bun';
    if (agent.includes('pnpm'))
        return 'pnpm';
    if (agent.includes('yarn'))
        return 'yarn';
    if (fs_1.default.existsSync('bun.lockb'))
        return 'bun';
    if (fs_1.default.existsSync('pnpm-lock.yaml'))
        return 'pnpm';
    if (fs_1.default.existsSync('yarn.lock'))
        return 'yarn';
    return 'npm';
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
