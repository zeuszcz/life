import OpenAI from "openai";
import { RoadmapResultSchema, type RoadmapResult } from "@/lib/zod-schemas";
import type { AIProvider, RoadmapInput } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, ROADMAP_JSON_SCHEMA } from "./prompt";

// OpenAI implementation using structured outputs (strict JSON schema).
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateRoadmap(input: RoadmapInput): Promise<RoadmapResult> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "roadmap",
          strict: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schema: ROADMAP_JSON_SCHEMA as any,
        },
      },
    });

    const text = res.choices[0]?.message?.content ?? "{}";
    return RoadmapResultSchema.parse(JSON.parse(text));
  }
}
