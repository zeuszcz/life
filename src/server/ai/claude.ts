import Anthropic from "@anthropic-ai/sdk";
import { RoadmapResultSchema, type RoadmapResult } from "@/lib/zod-schemas";
import type { AIProvider, RoadmapInput } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, ROADMAP_JSON_SCHEMA } from "./prompt";

const TOOL_NAME = "emit_roadmap";

// Claude implementation. Uses forced tool use to guarantee structured JSON and
// prompt caching on the (large, static) system prompt + tool schema.
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateRoadmap(input: RoadmapInput): Promise<RoadmapResult> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: TOOL_NAME,
          description: "Сохранить сгенерированную роадмапу игрока.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input_schema: ROADMAP_JSON_SCHEMA as any,
          cache_control: { type: "ephemeral" },
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const toolUse = msg.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not return a tool_use block");
    }
    return RoadmapResultSchema.parse(toolUse.input);
  }
}
