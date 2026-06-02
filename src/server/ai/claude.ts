import Anthropic from "@anthropic-ai/sdk";
import { GoalTasksSchema, NextGoalSchema, WeeklyReviewSchema } from "@/lib/zod-schemas";
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
  GOAL_TASKS_JSON_SCHEMA,
  NEXT_GOAL_JSON_SCHEMA,
  WEEKLY_REVIEW_JSON_SCHEMA,
} from "./prompt";

// Claude implementation. Forced tool use guarantees structured JSON; prompt
// caching on the static system + tool schema.
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async callTool(
    system: string,
    prompt: string,
    toolName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: any,
  ): Promise<unknown> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: [
        {
          name: toolName,
          description: "Сохранить результат для игры.",
          input_schema: schema,
          cache_control: { type: "ephemeral" },
        },
      ],
      tool_choice: { type: "tool", name: toolName },
      messages: [{ role: "user", content: prompt }],
    });
    const tu = msg.content.find((b) => b.type === "tool_use");
    if (!tu || tu.type !== "tool_use") throw new Error("Claude did not return a tool_use block");
    return tu.input;
  }

  async generateGoalTasks(goal: GoalContext): Promise<GoalTasksResult> {
    const input = await this.callTool(
      TASKS_SYSTEM,
      buildTasksPrompt(goal),
      "emit_tasks",
      GOAL_TASKS_JSON_SCHEMA,
    );
    return GoalTasksSchema.parse(input);
  }

  async suggestNextGoal(ctx: NextGoalContext): Promise<NextGoalResult> {
    const input = await this.callTool(
      NEXT_GOAL_SYSTEM,
      buildNextGoalPrompt(ctx),
      "emit_next_goal",
      NEXT_GOAL_JSON_SCHEMA,
    );
    return NextGoalSchema.parse(input);
  }

  async reviewWeek(ctx: WeeklyReviewContext): Promise<WeeklyReviewResult> {
    const input = await this.callTool(
      WEEKLY_REVIEW_SYSTEM,
      buildWeeklyReviewPrompt(ctx),
      "emit_review",
      WEEKLY_REVIEW_JSON_SCHEMA,
    );
    return WeeklyReviewSchema.parse(input);
  }
}
