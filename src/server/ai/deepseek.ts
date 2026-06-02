import OpenAI from "openai";
import { GoalTasksSchema, NextGoalSchema, WeeklyReviewSchema } from "@/lib/zod-schemas";
import { DOMAINS } from "@/lib/game/constants";
import type {
  AIProvider,
  GoalContext,
  GoalTasksResult,
  NextGoalContext,
  NextGoalResult,
  WeeklyReviewContext,
  WeeklyReviewResult,
} from "./types";
import {
  TASKS_SYSTEM,
  NEXT_GOAL_SYSTEM,
  WEEKLY_REVIEW_SYSTEM,
  buildTasksPrompt,
  buildNextGoalPrompt,
  buildWeeklyReviewPrompt,
} from "./prompt";

// DeepSeek via an OpenAI-compatible gateway (VseGPT / OpenRouter). DeepSeek
// supports JSON mode (not strict json_schema), so we force JSON + describe the
// exact shape in the prompt, then validate with Zod.
export class DeepSeekProvider implements AIProvider {
  readonly name = "deepseek";
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string, baseURL: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: { "HTTP-Referer": "https://life.innertalk.space", "X-Title": "Life" },
    });
    this.model = model;
  }

  private async json(system: string, prompt: string, shape: string): Promise<unknown> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: `${system}\n\n${shape}` },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });
    return JSON.parse(stripFences(res.choices[0]?.message?.content ?? "{}"));
  }

  async generateGoalTasks(goal: GoalContext): Promise<GoalTasksResult> {
    const input = await this.json(
      TASKS_SYSTEM,
      buildTasksPrompt(goal),
      `Ответь СТРОГО JSON-объектом без markdown: {"tasks": ["шаг 1", "шаг 2", ...]} — 4-7 коротких строк-действий на русском.`,
    );
    return GoalTasksSchema.parse(input);
  }

  async suggestNextGoal(ctx: NextGoalContext): Promise<NextGoalResult> {
    const input = await this.json(
      NEXT_GOAL_SYSTEM,
      buildNextGoalPrompt(ctx),
      `Ответь СТРОГО JSON без markdown: {"domain": "один из: ${DOMAINS.join(", ")}", "title": "...", "motivation": "...", "tasks": ["...", "..."]}.`,
    );
    return NextGoalSchema.parse(input);
  }

  async reviewWeek(ctx: WeeklyReviewContext): Promise<WeeklyReviewResult> {
    const input = await this.json(
      WEEKLY_REVIEW_SYSTEM,
      buildWeeklyReviewPrompt(ctx),
      `Ответь СТРОГО JSON без markdown: {"summary": "...", "encouragement": "...", "suggestion": "..."}.`,
    );
    return WeeklyReviewSchema.parse(input);
  }
}

// DeepSeek sometimes wraps JSON in ```json fences — strip them defensively.
function stripFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}
