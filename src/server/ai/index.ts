import "server-only";
import type { AIProvider } from "./types";
import { MockProvider } from "./mock";
import { ClaudeProvider } from "./claude";
import { OpenAIProvider } from "./openai";

export type { AIProvider, RoadmapInput, RoadmapGoal } from "./types";

/**
 * Resolve the configured AI provider. Falls back to the deterministic mock
 * provider when the chosen provider has no API key, so the app always works.
 */
export function getProvider(): AIProvider {
  const choice = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (choice === "claude" && anthropicKey) {
    return new ClaudeProvider(anthropicKey, process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6");
  }
  if (choice === "openai" && openaiKey) {
    return new OpenAIProvider(openaiKey, process.env.OPENAI_MODEL?.trim() || "gpt-4o");
  }

  if (choice === "claude" || choice === "openai") {
    console.warn(`[ai] AI_PROVIDER="${choice}" but its API key is missing — using mock provider.`);
  }
  return new MockProvider();
}
