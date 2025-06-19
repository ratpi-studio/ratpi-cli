import { Command } from "commander";
import chalk from "chalk";

import createScriptInit from "./modules/createScripts/createScript";
import type { Options } from "./modules/createScripts/types";
import { listWorkflows, createWorkflowFromTemplate } from "./modules/workflows";

const logo = `
                          =#%%%%%%%*:                         
                       .%%%%%%%%%%%%%%%                       
                      #%%%%%+.     *%%%%*                     
                    =%%%%%%=+:.#- #%%%%@%%+                   
         %%%#%%%:  %%%%%@%%%% -@..@%%%%@%%%%.  =%%%*#%%-      
       *%-       %%%%%%%%@%%= +%  #*%%%@@%%%%%%#: .::.:%%     
      =%- :--=*%%%%%%%%%%%%% .%%*  #%%%%%%%%%%- :##:   :%#    
      *%  +%%%%%%%%%%@%%%%%%%%%%%%%%%%%%%%%%#: -%=      +%.   
      *%   +%%%%%%%%%%%%%###########%%%%%%%#. :%+..     =%.   
      =%-   :#%%%%%%%%#=:         :=*%%**#%-  %%#%-     *%    
       %#.    .=%%*. .:*%%#-  .=%%%=..    .  -%%*.     -%=    
        %#.    :#%%%%%%#=:+%%%%+: .:=**=.    =%*.     :%*     
         =%*:  -%%%%@%%%%%%+-. =#*%%%%+..    .: .-: :*%:      
           :%%%%%%%%%%%%@%-     ..*@%%@      .  =%%%%-        
               =%%%%%%%%%=        :%%%=      +%%%%:+*         
               %=:#%%%%*:                    .%+ ##%-         
        -+#*: %#. .#%:.    .                  =%.             
             .@%*:#*. .........:+##+=:         +%             
         .:--+%*=*%*#@%*....:+.-----::.      :*+#%            
              @*:#%@@@@@+...:..:::::::-=++:. .@#:.            
           :**+%==@%%%%+....:.:+*##+:.......-+@:              
         :      #*%%+%%+:....-+%@%+.:==....*@%*               
            :*=   *@@@+=%%%%@#-:.........+%*     +*.          
           #%=*%-    ##   .%-.........:#@#     +%++%=         
           %#..+%      -%@%###+:....:*%#       %=.:%*         
         =%*:...-#%#-    #%+......=%%=     =#%*:...-*%-       
         +%-.-+*-...+%%#. -%@=:=%%#    .#%%+...-*+:.+@+       
          :+*=..=#%#+-:-*%%*%@%+   .+%%*-:-+#%#=.:=++.        
                    .*%%#=-+@@#+*%@#=:=#%%*.                  
                         #@@%%%#-.-#@@*                       
              :%%#%%-:+%%#*=::=*%@@%**%@%+:-%%#%%             
              %#:..:+=:...+#%%+  +%%#+..::=+:..-%+            
               #%%+...+%%%+          +%%%+...+@%+             
                =@: =%+                  *@:.-%-              
                 %%%%=                    *%%%%               
                                                              
     -+++++++:        =***=   -**********  =++++++=.    +++   
     +%%%#%@%%%=     -%%%%%:  +%@@@@%%%@%  #%%%%@@%%%: .%%%   
     +%%+   :%%%     %%%:%%@      *%%-     #%%+   =%%@ .%%%   
     +%%*   *%@*    *%@= =%%#     *%%-     #%%*   %%%# .%%%   
     +%%%%%%%%-    .%%%:  %%%-    *%%-     #%%%%%%%%=  .%%%   
     +%%+  %%%-    %%%%%%%%%%#    *%%-     #%%+        .%%%   
     +%%+   %%%-  +%%%     *%%=   *%%-     #%%+        .%%%   
                                                              
                                                              
           *%*%*  ##%%#-  @   *#  +%##%*   %=   #%*#%:        
           #%+-     #*    @   *#  +%   %+  %=  %+   -%:       
              *%.   #*    %.  *#  +%  :%+  %=  ##   +%.       
           =#%%=    #*    -#@%*   =%%#*-   %=   =%@%*         
                                                              `;

const program = new Command();

program
  .name("ratpi-cli")
  .description(logo + "\nratpi-cli is a multi-purpose CLI tool for project management.")
  .version("0.1.0");

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

program.parse();
