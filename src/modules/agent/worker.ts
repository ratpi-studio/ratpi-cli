import { FunctionCallingConfigMode, createPartFromFunctionResponse, createPartFromText, Part } from "@google/genai";
import { executeTool, waitingForUser } from "./workbench";
import chalk from "chalk";
import { tools } from "./tools";
import ora from "ora";
import { AGENT_CONTEXT } from "./AgentContext";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { initializeGeminiChat, sendMessage } from "./aiUtils";

marked.setOptions({
    // @ts-expect-error types
    renderer: new TerminalRenderer(),
});

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateSpinner(spinner: ReturnType<typeof ora> | null, text: string, action: "start" | "stop" | "succeed" = "start") {
    if (!spinner) return;
    if (action === "start") spinner.text = text, spinner.start();
    if (action === "stop") spinner.stop();
    if (action === "succeed") spinner.succeed(text);
}

function stopAndClearSpinner(spinner: ReturnType<typeof ora> | null) {
    if (spinner) {
        spinner.stop();
        spinner.clear();
    }
}

async function handleFunctionCalls(response: any, spinner: ReturnType<typeof ora> | null) {
    const isUserInput = response.functionCalls.some((call: { name: string }) => call.name === "askUserInput" || call.name === "finish");
    if (!isUserInput) console.log(chalk.blue("[Tool 🔧]") + ` Action: calling tool ${JSON.stringify(response.functionCalls?.[0].name, null, 2)}`);
    else stopAndClearSpinner(spinner);

    const parts = [];
    for (const call of response.functionCalls) {
        if (waitingForUser) {
            stopAndClearSpinner(spinner);
            break;
        }
        const result = await executeTool(call);
        const output = result.functionResponse.response.output;
        if (call.name === "finish" && output && typeof output === "object" && "summary" in output) {
            updateSpinner(spinner, "Answer generate.", "succeed");
            return { finished: true, summary: (output as any).summary };
        }
        let responseObj: Record<string, unknown> = {};
        if (output && typeof output === "object" && !Array.isArray(output)) {
            responseObj = { ...(output as Record<string, unknown>) };
        } else {
            responseObj = { output, success: result.functionResponse.response.success, error: result.functionResponse.response.error };
        }
        parts.push(createPartFromFunctionResponse(call.id ?? "", call.name ?? "", responseObj));
    }
    return { finished: false, parts };
}

function isFinishCall(response: any): { summary?: string; status?: string } | null {
    if (response.functionCalls) {
        const finishCall = response.functionCalls.find((call: any) => call.name === "finish");
        if (finishCall && finishCall.args) return finishCall.args;
        if (finishCall && finishCall.response?.output?.summary && finishCall.response?.output?.status) {
            return finishCall.response.output;
        }
    }
    const finishPart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.functionCall?.name === "finish"
    );
    if (finishPart?.functionCall?.args) return finishPart.functionCall.args;
    return null;
}

let agentLock: Promise<void> | null = null;

async function acquireAgentLock() {
    while (agentLock) {
        await agentLock;
    }
    let release: () => void;
    agentLock = new Promise<void>(resolve => { release = resolve; });
    return () => {
        release();
        agentLock = null;
    };
}

const debug = (...args: any[]) => {
    if (process.env.RATPI_VERBOSE === 'true') {
        // eslint-disable-next-line no-console
        console.debug(...args);
    }
};

export type SupervisorCallbackResult = boolean | { continue: true; feedback: string };

export async function worker(
    goal: string,
    onMessage: (message: string, isFinal: boolean) => Promise<SupervisorCallbackResult>
): Promise<void> {
    const releaseLock = await acquireAgentLock();
    let spinner: ReturnType<typeof ora> | null = null;
    try {
        console.log(chalk.green("[Ratpi Worker 🐀]"), "Initializing GoogleGenAI...");
        const chat = await initializeGeminiChat();
        console.log(chalk.green("[Ratpi Worker 🐀]"), "Creating Gemini chat...");
        let response = await sendMessage(chat, createPartFromText(`${AGENT_CONTEXT}\n Your goal: ${goal}`));
        debug('[DEBUG] Première réponse du modèle:', response);
        let shouldContinue: SupervisorCallbackResult = true;
        while (shouldContinue) {
            while (waitingForUser) {
                debug('[DEBUG] En attente de la réponse utilisateur (waitingForUser=true)');
                stopAndClearSpinner(spinner);
                await sleep(1000);
            }
            const finishArgs = isFinishCall(response);
            debug('[DEBUG] Résultat isFinishCall:', finishArgs);
            if (finishArgs && finishArgs.summary && finishArgs.status === "completed") {
                updateSpinner(spinner, chalk.green("[Ratpi Worker 🐀]") + " Final answer generated.", "succeed");
                stopAndClearSpinner(spinner);
                shouldContinue = await onMessage(finishArgs.summary, true);
                if (shouldContinue === false) {
                    break;
                }
                if (typeof shouldContinue === 'object' && shouldContinue.continue && shouldContinue.feedback) {
                    // Envoyer le feedback au modèle
                    updateSpinner(spinner, 'Feedback du superviseur envoyé à l\'agent', "start");
                    response = await sendMessage(chat, createPartFromText(shouldContinue.feedback));
                    stopAndClearSpinner(spinner);
                    continue;
                }
            }
            if (response.functionCalls && response.functionCalls.length > 0) {
                debug('[DEBUG] functionCalls détectés:', response.functionCalls);
                const isUserInput = response.functionCalls.some((call: { name: string }) => call.name === "askUserInput");
                if (isUserInput) {
                    stopAndClearSpinner(spinner);
                    debug('[DEBUG] askUserInput détecté, attente utilisateur sans spinner');
                    const { parts, finished, summary } = await handleFunctionCalls(response, null) || {};
                    if (finished && summary) {
                        shouldContinue = await onMessage(summary, true);
                        if (!shouldContinue) break;
                    }
                    while (waitingForUser) {
                        await sleep(1000);
                    }
                    if (parts) {
                        debug('[DEBUG] Transmission des parts utilisateur au modèle après réponse:', parts);
                        updateSpinner(spinner, 'Waiting for model answer', "start");
                        response = await sendMessage(chat, parts);
                        stopAndClearSpinner(spinner);
                        debug('[DEBUG] Réponse du modèle après askUserInput:', response);
                    }
                    continue;
                }
                if (!spinner) spinner = ora({ text: chalk.green('[Ratpi Worker 🐀]') + ' Thinking', spinner: 'dots8Bit' });
                const { parts, finished, summary } = await handleFunctionCalls(response, spinner) || {};
                debug('[DEBUG] Résultat handleFunctionCalls:', parts);
                if (finished && summary) {
                    shouldContinue = await onMessage(summary, true);
                    if (!shouldContinue) break;
                }
                await sleep(1000);
                if (parts) {
                    updateSpinner(spinner, 'Waiting for model answer', "start");
                    debug('[DEBUG] Envoi des parts au modèle:', parts);
                    response = await sendMessage(chat, parts);
                    debug('[DEBUG] Réponse du modèle après functionCalls:', response);
                }
                continue;
            }
            if (response.text) {
                debug('[DEBUG] Réponse textuelle du modèle:', response.text);
                updateSpinner(spinner, chalk.green("[Ratpi Worker 🐀]") + " Answer generated.", "succeed");
                stopAndClearSpinner(spinner);
                shouldContinue = await onMessage(response.text, false);
                if (!shouldContinue) {
                    break;
                }
            }
            await sleep(1000);
            if (!waitingForUser && shouldContinue) {
                if (!spinner) spinner = ora({ text: '', spinner: 'dots8Bit' });
                updateSpinner(spinner, 'Waiting for model answer', "start");
                debug('[DEBUG] Envoi d\'un "continue" au modèle');
                response = await sendMessage(chat, createPartFromText("continue"));
                stopAndClearSpinner(spinner);
                debug('[DEBUG] Réponse du modèle après "continue":', response);
            } else if (!shouldContinue) {
                break;
            }
        }
    } finally {
        releaseLock();
        if (spinner) spinner.stop();
    }
}
