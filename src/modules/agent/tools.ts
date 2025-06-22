import { FunctionDeclaration, Type } from "@google/genai";

export const tools: FunctionDeclaration[] = [
    {
        name: "readFile",
        description: "Read a file from disk and return its text content",
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: "Path of the file" }
            },
            required: ["path"]
        }
    },
    {
        name: "writeFile",
        description: "Write text content to a file",
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: "File path" },
                content: { type: Type.STRING, description: "Text to write" }
            },
            required: ["path", "content"]
        }
    },
    {
        name: "runCommand",
        description: "Execute a shell command and return its output",
        parameters: {
            type: Type.OBJECT,
            properties: {
                command: { type: Type.STRING, description: "Command to execute" },
                cwd: { type: Type.STRING, description: "Optional: The directory in which to run the command." }
            },
            required: ["command"]
        }
    },
    {
        name: "finish",
        description: "Call this when the task is complete. Provide a summary in 'summary'. Summary should be a full list of changes made and observations, not just a brief description. Tell if you think you have successfully completed the task or if not. If not specify what was missing. You MUST include a field 'userSatisfied' (boolean) indicating if the user confirmed satisfaction.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "Summary of the work" },
                userSatisfied: { type: Type.BOOLEAN, description: "Whether the user confirmed satisfaction (true/false)" }
            },
            required: ["summary", "userSatisfied"]
        }
    },
    {
        name: "listFiles",
        description: "List all files and folders in a directory",
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: "Path of the directory" }
            },
            required: ["path"]
        }
    },
    {
        name: "askUserInput",
        description: "Ask the user for an input and return the response as a string.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: "Prompt/question to display to the user" }
            },
            required: ["prompt"]
        }
    },
    {
        name: "getContext",
        description: "Get the current project context including current { cwd, projectName, user, platform, nodeVersion, git, packageManager, scripts, hasTsConfig, mainDependencies, env, date}.",
        parameters: {
            type: Type.OBJECT,
            properties: {},
            required: []
        }
    },
    {
        name: "listTools",
        description: "List all available tools and their descriptions.",
        parameters: {
            type: Type.OBJECT,
            properties: {},
            required: []
        }
    }
];