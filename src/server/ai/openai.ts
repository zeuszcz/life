import OpenAI from "openai";
import { GoalTasksSchema, NextGoalSchema } from "@/lib/zod-schemas";
import type {
  AIProvider,
  GoalContext,
  GoalTasksResult,
  NextGoalContext,
  NextGoalResult,
} from "./types";
import {
  TASKS_SYSTEM,
  NEXT_GOAL_SYSTEM,
  buildTasksPrompt,
  buildNextGoalPrompt,
  GOAL_TASKS_JSON_SCHEMA,
  NEXT_GOAL_JSON_SCHEMA,
} from "./prompt";

// OpenAI implementation using structured outputs (strict JSON schema).
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  private async structured(
    system: string,
    prompt: string,
    schemaName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: any,
  ): Promise<unknown> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    });
    return JSON.parse(res.choices[0]?.message?.content ?? "{}");
  }

  async generateGoalTasks(goal: GoalContext): Promise<GoalTasksResult> {
    const input = await this.structured(
      TASKS_SYSTEM,
      buildTasksPrompt(goal),
      "goal_tasks",
      GOAL_TASKS_JSON_SCHEMA,
    );
    return GoalTasksSchema.parse(input);
  }

  async suggestNextGoal(ctx: NextGoalContext): Promise<NextGoalResult> {
    const input = await this.structured(
      NEXT_GOAL_SYSTEM,
      buildNextGoalPrompt(ctx),
      "next_goal",
      NEXT_GOAL_JSON_SCHEMA,
    );
    return NextGoalSchema.parse(input);
  }
}
