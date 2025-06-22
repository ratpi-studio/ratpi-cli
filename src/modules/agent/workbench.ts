import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { getContext } from "./getContext";
import readline from "node:readline/promises";
import chalk from "chalk";
import { tools } from "./tools";

const execPromise = promisify(exec);

interface ToolExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
}

interface FunctionCall {
    name: string;
    args: Record<string, any>;
}

interface FunctionResponse {
    functionResponse: {
        name: string
        response: ToolExecutionResult;
    }
}


let isBusy = false;
export let waitingForUser = false;

export async function executeTool(call: FunctionCall): Promise<FunctionResponse> {
    if (isBusy) {
        return {
            functionResponse: {
                name: call.name,
                response: {
                    success: false,
                    error: "Another tool is currently running. Please wait.",
                }
            }
        };
    }
    isBusy = true;
    let output: any;
    let success = false;
    let errorMessage: string | undefined;

    try {
        if (call.name === "askUserInput") {
            waitingForUser = true;
            if (typeof call.args.prompt === "string") {
                console.log(chalk.green(`[Ratpi tool 🐀]`), ` Asking user input`);
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
                output = await rl.question(chalk.green(`[Ratpi tool 🐀]`) + ` Asking user input: ${call.args.prompt}` + "\nWaiting for user input >");
                await rl.close();
                success = true;
                waitingForUser = false;
            } else {
                errorMessage = "Invalid arguments for askUserInput: prompt must be a string";
            }
        } else if (call.name === "finish" && waitingForUser) {
            return {
                functionResponse: {
                    name: call.name,
                    response: {
                        success: false,
                        error: "Cannot finish: waiting for user input.",
                    }
                }
            };
        } else {
            if (call.name === "readFile") {
                if (typeof call.args.path === "string") {
                    output = await fs.readFile(call.args.path, "utf8");
                    console.log(chalk.green(`[Ratpi tool 🐀]`), ` Read file: ${call.args.path}`);
                    success = true;
                } else {
                    errorMessage = "Invalid arguments for readFile: path must be a string";
                }
            } else if (call.name === "writeFile") {
                if (typeof call.args.path === "string" && typeof call.args.content === "string") {
                    await fs.writeFile(call.args.path, call.args.content);
                    output = "File written successfully.";
                    console.log(chalk.green(`[Ratpi tool 🐀]`), ` Written to file: ${call.args.path}`);
                    success = true;
                } else {
                    errorMessage = "Invalid arguments for writeFile: path and content must be strings";
                }
            } else if (call.name === "runCommand") {
                if (typeof call.args.command === "string") {
                    try {
                        const { stdout, stderr } = await execPromise(call.args.command);
                        output = stdout || stderr || "Command executed successfully (no output).";
                        if (stderr) {
                            console.error(chalk.red(`[Ratpi tool 🐀]`), ` Command stderr: ${stderr}`);
                        }
                        console.log(chalk.green(`[Ratpi tool 🐀]`), `Executed command: ${call.args.command}`);
                        success = true;
                    } catch (e) {
                        errorMessage = `Command failed: ${(e as Error).message}`;
                        if ((e as any).stdout) {
                            errorMessage += `\nStdout: ${(e as any).stdout}`;
                        }
                        if ((e as any).stderr) {
                            errorMessage += `\nStderr: ${(e as any).stderr}`;
                        }
                        console.error(chalk.red(`[Ratpi tool 🐀]`), ` ${errorMessage}`);
                    }
                } else {
                    errorMessage = "Invalid arguments for runCommand: command must be a string";
                }
            } else if (call.name === "finish") {
                if (typeof call.args.summary === "string") {
                    console.log(chalk.blue(`[Ratpi tool 🐀]`), `Task finished: ${call.args.summary}`);
                    let userInput = "";
                    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
                    while (true) {
                        userInput = await rl.question(chalk.green(`[Ratpi tool 🐀]`) + " Do you need anything else ? (Yes/No): ");
                        userInput = userInput.trim().toLowerCase();
                        if (userInput === "no") {
                            await rl.close();
                            console.log(chalk.green(`[Ratpi tool 🐀]`), "Goodbye!");
                            process.exit(0);
                        } else if (userInput === "yes") {
                            await rl.close();
                            return {
                                functionResponse: {
                                    name: call.name,
                                    response: {
                                        success: true,
                                        output: "The user want to continue, ask him what do he want/need",
                                        error: undefined
                                    }
                                }
                            };
                        } else {
                            console.log(chalk.yellow(`[Ratpi tool 🐀] Please answer Yes or No.`));
                        }
                    }
                } else {
                    errorMessage = "Invalid arguments for finish: summary must be a string";
                }
            } else if (call.name === "listFiles") {
                if (typeof call.args.path === "string") {
                    try {
                        const files = await fs.readdir(call.args.path);
                        output = files;
                        console.log(chalk.green(`[Ratpi tool 🐀]`), ` Listed files in directory: ${call.args.path}`);
                        success = true;
                    } catch (e) {
                        errorMessage = `Failed to list files: ${(e as Error).message}`;
                        console.error(chalk.red(`[Ratpi tool 🐀]`), ` ${errorMessage}`);
                    }
                } else {
                    errorMessage = "Invalid arguments for listFiles: path must be a string";
                }
            } else if (call.name === "getContext") {
                const context = await getContext();
                output = `Context retrieved: ${JSON.stringify(context, null, 2)}`;
                console.log(chalk.green(`[Ratpi tool 🐀]`), ` Retrieved project context.`);
                success = true;
            } else if (call.name === 'listsTools') {
                output = `Available tools: ${JSON.stringify(tools, null, 2)}`;
                console.log(chalk.green(`[Ratpi tool 🐀]`), ` Listed available tools.`);
                success = true;
            }
            else {
                errorMessage = `Unknown tool: ${call.name}`;
                console.error(chalk.red(`[Ratpi tool 🐀]`), ` ${errorMessage}`);
            }
        }
    } catch (e) {
        errorMessage = `Tool execution failed for ${call.name}: ${(e as Error).message}`;
        console.error(chalk.red(`[Ratpi tool 🐀]`), ` ${errorMessage}`);
    } finally {
        isBusy = false;
    }

    return {
        functionResponse: {
            name: call.name,
            response: {
                success,
                output: output,
                error: errorMessage
            }
        }
    };
}
