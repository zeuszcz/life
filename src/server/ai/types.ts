import type { Domain } from "@/lib/game/constants";

export interface GoalContext {
  domain: Domain;
  title: string;
  description: string;
  motivation: string;
  currentState: string;
  hoursPerWeek: number;
}

export interface GoalTasksResult {
  tasks: string[];
}

export interface NextGoalContext {
  characterName: string;
  domain: Domain;
  completedGoalTitle: string;
}

export interface NextGoalResult {
  domain: Domain;
  title: string;
  motivation: string;
  tasks: string[];
}

export interface WeeklyReviewContext {
  characterName: string;
  level: number;
  tasksThisWeek: number;
  habitsTracked: number;
  bestStreak: number;
  dayStreak: number;
}

export interface WeeklyReviewResult {
  summary: string;
  encouragement: string;
  suggestion: string;
}

/**
 * Pluggable AI mentor. It is invoked ONLY when a goal is added
 * (generateGoalTasks) or completed (suggestNextGoal) — never on every checkbox.
 */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateGoalTasks(goal: GoalContext): Promise<GoalTasksResult>;
  suggestNextGoal(ctx: NextGoalContext): Promise<NextGoalResult>;
  reviewWeek(ctx: WeeklyReviewContext): Promise<WeeklyReviewResult>;
}
