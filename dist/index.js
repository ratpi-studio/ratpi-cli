#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const createScript_1 = __importDefault(require("./modules/createScript"));
const program = new commander_1.Command();
program
    .name('ratpi-cli')
    .description('Utility CLI to scaffold scripts with Commander and Chalk')
    .version('0.1.0');
program
    .command('create-script:init')
    .description('Create a script template using Commander and Chalk')
    .option('--template <name>', 'Template name')
    .option('--use <path>', 'Path to JSON config file')
    .option('--no-install-deps', 'Skip installation of dev dependencies')
    .option('--output <dir>', 'Output directory for generated project')
    .action(async (options) => {
    await (0, createScript_1.default)({
        template: options.template,
        use: options.use,
        installDeps: options.installDeps,
        output: options.output
    });
});
program.parse();
