import { worker } from "./worker";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import chalk from "chalk";
import { initializeGeminiChat, sendMessage } from "./aiUtils";
import { createPartFromText } from "@google/genai";
import type { SupervisorCallbackResult } from "./worker";

marked.setOptions({
  // @ts-expect-error types
  renderer: new TerminalRenderer(),
});

export class Supervisor {
  private currentTaskPrompt: string = "";
  private supervisorChat: any;

  constructor() {
    console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Initializing Supervisor.");
    this.initializeSupervisorChat();
  }

  private async initializeSupervisorChat() {
    try {
      this.supervisorChat = await initializeGeminiChat();
      console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Gemini chat initialized for supervisor's internal use.");
    } catch (error) {
      console.error(chalk.red("[Ratpi Supervisor 👨‍]"), "Failed to initialize Gemini chat for supervisor:", error);
    }
  }

  public async optimizePrompt(prompt: string): Promise<string> {
    console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Performing prompt optimization using Gemini...");
    if (!this.supervisorChat) {
      console.warn(chalk.yellow("[Ratpi Supervisor 👨‍]") + " Supervisor chat not initialized. Falling back to basic optimization.");
      return prompt;
    }
    const optimizationInstruction = `Given the following user request, rephrase and optimize it to be as clear, concise, and actionable as possible for an AI agent. Ensure it includes instructions for the agent to double-check its work. Do not add any conversational filler, just the optimized prompt.\nOriginal Prompt: "${prompt}"`;
    try {
      const response = await sendMessage(this.supervisorChat, createPartFromText(optimizationInstruction));
      const optimizedPrompt = response.text || prompt;
      console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Optimized prompt (from Gemini): " + optimizedPrompt);
      return optimizedPrompt;
    } catch (error) {
      console.error(chalk.red("[Ratpi Supervisor 👨‍]"), "Error during prompt optimization with Gemini. Returning original prompt.", error);
      return prompt;
    }
  }

  private async handleAgentMessage(message: string, isFinal: boolean): Promise<boolean | { continue: true; feedback: string }> {
    console.log(chalk.magenta("\n--- [Ratpi Supervisor 👨‍] Agent Message Received ---"));
    console.log(marked(message));
    console.log(chalk.magenta("--------------------------------------------------\n"));

    if (isFinal) {
      console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Agent reported final answer. Performing final verification.");
      const verificationResult = await this.verifyAnswer(message, this.currentTaskPrompt);
      if (verificationResult) {
        console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Final answer satisfactory. Agent will stop.");
        return false;
      } else {
        const feedback = await this.getFeedbackForAgent(message, this.currentTaskPrompt);
        console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Final answer UNSATISFACTORY. Sending feedback to agent to continue: " + feedback);
        return { continue: true, feedback };
      }
    }

    console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Agent is continuing. No final decision yet. Returning true.");
    return true;
  }

  private async getFeedbackForAgent(answer: string, originalPrompt: string): Promise<string> {
    if (!this.supervisorChat) return "The answer is not satisfactory, please correct it.";
    const feedbackPrompt = `The agent tried to answer the following instruction:\n"${originalPrompt}"\nIts answer:\n"${answer}"\n\nBriefly explain to the agent what it should correct or improve to properly address the instruction.`;
    try {
      const response = await sendMessage(this.supervisorChat, createPartFromText(feedbackPrompt));
      return response.text || "The answer is not satisfactory, please correct it.";
    } catch {
      return "The answer is not satisfactory, please correct it.";
    }
  }

  public async verifyAnswer(answer: string, originalPrompt: string): Promise<boolean> {
    console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Initiating answer verification for prompt: " + originalPrompt);
    if (!this.supervisorChat) {
      console.warn(chalk.yellow("[Ratpi Supervisor 👨‍]") + " Supervisor chat not initialized. Returning false.");
      return false;
    }
    const verificationPrompt = `Given the original task prompt: "${originalPrompt}"
And the agent's final answer: "${answer}"

Is the agent's answer satisfactory, complete, and does it address the original prompt effectively? Respond with "YES" if satisfactory, "NO" if not. Provide a brief reason for your decision.`;
    try {
      const response = await sendMessage(this.supervisorChat, createPartFromText(verificationPrompt));
      const geminiVerification = response.text ? response.text.toUpperCase() : "";
      if (geminiVerification.includes("YES")) {
        console.log(chalk.green("[Ratpi Supervisor 👨‍]") + " Verification passed by Gemini.");
        return true;
      } else if (geminiVerification.includes("NO")) {
        console.log(chalk.red("[Ratpi Supervisor 👨‍]") + " Verification failed by Gemini. Reason: " + response.text);
        return false;
      } else {
        console.log(chalk.yellow("[Ratpi Supervisor 👨‍]") + " Gemini verification inconclusive. Returning false.");
        return false;
      }
    } catch (error) {
      console.error(chalk.red("[Ratpi Supervisor 👨‍]"), "Error during answer verification with Gemini. Returning false:", error);
      return false;
    }
  }

  public async executeTask(taskPrompt: string): Promise<string> {
    this.currentTaskPrompt = taskPrompt;
    if (!this.supervisorChat) {
      await this.initializeSupervisorChat();
      if (!this.supervisorChat) {
        return `Error: Supervisor Gemini chat could not be initialized. Aborting task.`;
      }
    }
    const optimizedPrompt = await this.optimizePrompt(taskPrompt);
    console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " Initiating agent task execution with optimized prompt...");
    try {
      await worker(optimizedPrompt, this.handleAgentMessage.bind(this) as (message: string, isFinal: boolean) => Promise<SupervisorCallbackResult>);
      const finalOutcome = "Agent execution flow completed, overseen by supervisor. Check console for agent's messages and final output.";
      console.log(chalk.magenta("[Ratpi Supervisor 👨‍]") + " `worker` has finished its execution.");
      return finalOutcome;
    } catch (error) {
      console.error(chalk.red("[Ratpi Supervisor 👨‍]") + " An error occurred during agent execution:", error);
      return `Error: Agent execution failed - ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
