import { GoogleGenAI, FunctionCallingConfigMode, createPartFromText, Part } from "@google/genai";
import chalk from "chalk";
import { GEMINI_MODEL_NAME } from "./AgentContext";
import { tools } from "./tools";

export async function initializeGeminiChat(): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error(chalk.red("[Ratpi AI Utils] GEMINI_API_KEY environment variable not set"));
        throw new Error("GEMINI_API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
            tools: [{ functionDeclarations: tools }],
            toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } }
        }
    });
    return chat;
}

export async function sendMessage(chat: any, message: Part | Part[]): Promise<any> {
    try {
        return await chat.sendMessage({ message });
    } catch (error: any) {
        console.error(chalk.red("[Ratpi AI Utils] Error sending message to chat:"), chalk.red(error));
        throw error;
    }
}
