#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";

import createScriptInit from "./modules/createScripts/createScript";
import type { Options } from "./modules/createScripts/types";
import { listWorkflows, createWorkflowFromTemplate } from "./modules/workflows";
import { runAgent } from "./modules/agent";
import packageJson from "../package.json";

const rainbowColors = [
  chalk.red,
  chalk.yellowBright,
  chalk.yellow,
  chalk.green,
  chalk.cyan,
  chalk.blue,
  chalk.magenta
];

function rainbowLogo() {
  const lines = [
    "                          =#%%%%%%%*:                         ",
    "                       .%%%%%%%%%%%%%%%                       ",
    "                      #%%%%%+.     *%%%%*                     ",
    "                    =%%%%%%=+:.#- #%%%%@%%+                   ",
    "         %%%#%%%:  %%%%%@%%%% -@..@%%%%@%%%%.  =%%%*#%%-      ",
    "       *%-       %%%%%%%%@%%= +%  #*%%%@@%%%%%%#: .::.:%%     ",
    "      =%- :--=*%%%%%%%%%%%%% .%%*  #%%%%%%%%%%- :##:   :%#    ",
    "      *%  +%%%%%%%%%%@%%%%%%%%%%%%%%%%%%%%%%#: -%=      +%.   ",
    "      *%   +%%%%%%%%%%%%%###########%%%%%%%#. :%+..     =%.   ",
    "      =%-   :#%%%%%%%%#=:         :=*%%**#%-  %%#%-     *%    ",
    "       %#.    .=%%*. .:*%%#-  .=%%%=..    .  -%%*.     -%=    ",
    "        %#.    :#%%%%%%#=:+%%%%+: .:=**=.    =%*.     :%*     ",
    "         =%*:  -%%%%@%%%%%%+-. =#*%%%%+..    .: .-: :*%:      ",
    "           :%%%%%%%%%%%%@%-     ..*@%%@      .  =%%%%-        ",
    "               =%%%%%%%%%=        :%%%=      +%%%%:+*         ",
    "               %=:#%%%%*:                    .%+ ##%-         ",
    "        -+#*: %#. .#%:.    .                  =%.             ",
    "             .@%*:#*. .........:+##+=:         +%             ",
    "         .:--+%*=*%*#@%*....:+.-----::.      :*+#%            ",
    "              @*:#%@@@@@+...:..:::::::-=++:. .@#:.            ",
    "           :**+%==@%%%%+....:.:+*##+:.......-+@:              ",
    "         :      #*%%+%%+:....-+%@%+.:==....*@%*               ",
    "            :*=   *@@@+=%%%%@#-:.........+%*     +*.          ",
    "           #%=*%-    ##   .%-.........:#@#     +%++%=         ",
    "           %#..+%      -%@%###+:....:*%#       %=.:%*         ",
    "         =%*:...-#%#-    #%+......=%%=     =#%*:...-*%-       ",
    "         +%-.-+*-...+%%#. -%@=:=%%#    .#%%+...-*+:.+@+       ",
    "          :+*=..=#%#+-:-*%%*%@%+   .+%%*-:-+#%#=.:=++.        ",
    "                    .*%%#=-+@@#+*%@#=:=#%%*.                  ",
    "                         #@@%%%#-.-#@@*                       ",
    "              :%%#%%-:+%%#*=::=*%@@%**%@%+:-%%#%%             ",
    "              %#:..:+=:...+#%%+  +%%#+..::=+:..-%+            ",
    "               #%%+...+%%%+          +%%%+...+@%+             ",
    "                =@: =%+                  *@:.-%-              ",
    "                 %%%%=                    *%%%%               ",
    "                                                              ",
    "     -+++++++:        =***=   -**********  =++++++=.    +++   ",
    "     +%%%#%@%%%=     -%%%%%:  +%@@@@%%%@%  #%%%%@@%%%: .%%%   ",
    "     +%%+   :%%%     %%%:%%@      *%%-     #%%+   =%%@ .%%%   ",
    "     +%%*   *%@*    *%@= =%%#     *%%-     #%%*   %%%# .%%%   ",
    "     +%%%%%%%%-    .%%%:  %%%-    *%%-     #%%%%%%%%=  .%%%   ",
    "     +%%+  %%%-    %%%%%%%%%%#    *%%-     #%%+        .%%%   ",
    "     +%%+   %%%-  +%%%     *%%=   *%%-     #%%+        .%%%   ",
    "                                                              ",
    "                                                              ",
    "           *%*%*  ##%%#-  @   *#  +%##%*   %=   #%*#%:        ",
    "           #%+-     #*    @   *#  +%   %+  %=  %+   -%:       ",
    "              *%.   #*    %.  *#  +%  :%+  %=  ##   +%.       ",
    "           =#%%=    #*    -#@%*   =%%#*-   %=   =%@%*         ",
    "                                                              "
  ];
  return lines.map((line, i) => rainbowColors[i % rainbowColors.length](line)).join("\n");
}

const program = new Command();

program
  .name("ratpi-cli")
  .description("ratpi-cli is a multi-purpose CLI tool for project management.")
  .version(packageJson.version, "-v, --version", "Display the current version of ratpi-cli");

// N'affiche le logo que dans le terminal (hors .description)
if (require.main === module) {
  // Terminal uniquement
  console.log(rainbowLogo());
}

// Personnalisation de l'affichage de l'aide
program.configureHelp({
  formatHelp: (cmd, helper) => {
    let output = "";
    output += helper.commandDescription(cmd) + "\n\n";
    output += chalk.cyan("Commands:") + "\n\n";
    const commandList = helper.visibleCommands(cmd).map((c) => {
      const usage = helper.subcommandTerm(c).padEnd(28);
      const desc = helper.subcommandDescription(c);
      return chalk.white(usage + desc);
    });
    output += commandList.join("\n") + "\n\n";
    // Ajout de la section Options
    const optionList = helper.visibleOptions(cmd).map((opt) => {
      return chalk.white(helper.optionTerm(opt).padEnd(24) + opt.description);
    });
    if (optionList.length > 0) {
      output += chalk.cyan("Options:") + "\n\n";
      output += optionList.join("\n") + "\n";
    }
    return output;
  }
});

program
  .command("create-script")
  .description("Create a script template using Commander and Chalk")
  .option("--template <name>", "Template name")
  .option("--use <path>", "Path to JSON config file")
  .option("--skip-devDependencies", "Skip installation of dev dependencies")
  .option("--output <dir>", "Output directory for generated project")
  .option("--sample-conf", "Copy sample config (basic.json) to ./ratpi-cli.config.json")
  .action(async (options: Options & { sampleConf?: boolean }) => {
    if (options.sampleConf) {
      const fs = await import("fs");
      const path = await import("path");
      const chalk = (await import("chalk")).default;
      const src = path.resolve(__dirname, "../static/templates/basic.json");
      const dest = path.resolve(process.cwd(), "ratpi-cli.config.json");
      if (!fs.existsSync(src)) {
        console.error(chalk.red("Sample config not found: basic.json"));
        process.exit(1);
      }
      fs.copyFileSync(src, dest);
      console.log(chalk.green(`Sample config copied to ${dest}`));
      return;
    }
    await createScriptInit({
      template: options.template,
      use: options.use,
      installDeps: options.skipDevDependencies !== true,
      output: options.output,
    });
  });

program
  .command("agent")
  .description("Run a Gemini Flash AI agent")
  .argument("<task...>", "Task for the agent")
  .action(async (task: string[]) => {
    const goal = task.join(" ");
    await runAgent(goal);
  });

  const workflow = program.command("workflow").description("Manage GitHub workflows");

workflow
  .command("list")
  .description("List available workflows from .github/workflows")
  .action(async () => {
    const workflows = await listWorkflows();
    if (workflows.length === 0) {
      console.log(chalk.yellow("No workflow found in .github/workflows"));
    } else {
      console.log(chalk.green("Available workflows:"));
      workflows.forEach((w) => console.log("-", w));
    }
  });

workflow
  .command("create")
  .description("Create a workflow from a template in .github/workflows")
  .requiredOption("--template <name>", "Template name to copy from .github/workflows")
  .action(async (options: { template: string }) => {
    const result = await createWorkflowFromTemplate(options.template);
    if (result) {
      console.log(chalk.green(`Workflow created: ${result}`));
    } else {
      console.log(chalk.red("Template not found in .github/workflows"));
    }
  });


if (require.main === module) {
  program.parse();
}


export default program
