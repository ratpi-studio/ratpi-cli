import { GoogleGenAI, FunctionDeclaration, FunctionCallingConfigMode, createPartFromFunctionResponse, createPartFromText, Type } from "@google/genai";
import fs from "fs";
import { execSync } from "child_process";

export async function runAgent(goal: string): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable not set");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  const tools: FunctionDeclaration[] = [
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
          command: { type: Type.STRING, description: "Command to execute" }
        },
        required: ["command"]
      }
    },
    {
      name: "finish",
      description: "Call this when the task is complete. Provide a summary in 'summary'",
      parameters: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Summary of the work" }
        },
        required: ["summary"]
      }
    }
  ];

  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    config: {
      tools: [{ functionDeclarations: tools }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } }
    }
  });

  let response = await chat.sendMessage({ message: createPartFromText(`Goal: ${goal}`) });

  while (true) {
    if (response.functionCalls && response.functionCalls.length > 0) {
      const parts = response.functionCalls.map((call) => {
        let output = "";
        try {
          if (call.name === "readFile" && call.args && typeof call.args.path === "string") {
            output = fs.readFileSync(call.args.path, "utf8");
          } else if (call.name === "writeFile" && call.args && typeof call.args.path === "string" && typeof call.args.content === "string") {
            fs.writeFileSync(call.args.path, call.args.content);
            output = "written";
          } else if (call.name === "runCommand" && call.args && typeof call.args.command === "string") {
            output = execSync(call.args.command, { encoding: "utf8", stdio: "pipe" });
          } else if (call.name === "finish" && call.args && typeof call.args.summary === "string") {
            console.log(call.args.summary);
            return;
          } else {
            output = "Invalid arguments";
          }
        } catch (e) {
          output = (e as Error).message;
        }
        return createPartFromFunctionResponse(call.id ?? "", call.name ?? "", { output });
      });
      response = await chat.sendMessage({ message: parts as any });
      continue;
    }

    if (response.text) {
      console.log(response.text);
    }

    const finish = response.candidates?.[0]?.content?.parts?.find((p) => p.functionCall?.name === "finish");
    let summary: string | undefined;
    if (finish && finish.functionCall && (finish.functionCall.args as any) && typeof (finish.functionCall.args as any).summary === "string") {
      summary = (finish.functionCall.args as any).summary as string;
    }
    if (summary) {
      console.log(summary);
      return;
    }

    response = await chat.sendMessage({ message: createPartFromText("continue") });
  }
}
