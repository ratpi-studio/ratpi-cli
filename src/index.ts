#!/usr/bin/env node
import { Command } from 'commander';
import createScriptInit from './modules/createScript';

const program = new Command();

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
  .action((options) => {
    createScriptInit({
      template: options.template,
      use: options.use,
      installDeps: options.installDeps
    });
  });

program.parse();
