import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

import program from "../src/index";

const markdownForCommand = (cmd: Command, level = 1): string => {
    const prefix = "#".repeat(level);
    let md = `\n${prefix} ${cmd.name()}\n\n`;

    if (cmd.description()) {
        md += `${cmd.description()}\n\n`;
    }

    // Affichage des options
    if (cmd.options.length > 0) {
        md += `**Options**\n\n`;
        cmd.options.forEach(opt => {
            md += `- \`${opt.flags}\` : ${opt.description}\n`;
        });
        md += "\n";
    }

    // Affichage des sous-commandes
    const subCmds = cmd.commands.filter(c => !!c);
    if (subCmds.length > 0) {
        md += `**Sous-commandes**\n\n`;
        subCmds.forEach(sc => {
            md += `- [${sc.name()}](#${sc.name().toLowerCase().replace(/ /g, '-')}) : ${sc.description()}\n`;
        });
        md += "\n";
        subCmds.forEach(sc => {
            md += markdownForCommand(sc, level + 1);
        });
    }

    return md;
};

const generateCLIDoc = () => {
    console.log("Génération de la documentation CLI...");
    let md = `# ${program.name()} CLI\n\n`;
    if (program.description()) {
        md += program.description() + "\n\n";
    }
    md += "## Version\n\n";
    md += "`" + program.version() + "`\n";
    md += markdownForCommand(program);

    // Enregistre dans un fichier
    const docPath = path.resolve(process.cwd(), "CLI.md");
    fs.writeFileSync(docPath, md);
    console.log("✅ Documentation CLI générée :", docPath);
};

generateCLIDoc();
