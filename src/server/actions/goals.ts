"use server";

import type { Goal, GoalTask } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { GoalInputSchema, NextGoalSchema, type GoalInput } from "@/lib/zod-schemas";
import { LOCATION_TO_DOMAIN, type Domain, type LocationKey } from "@/lib/game/constants";
import {
  createGoalWithTasks,
  createGoalWithGivenTasks,
  completeGoalAndSuggest,
} from "@/server/services/goals";

export interface TaskView {
  id: string;
  title: string;
  done: boolean;
  source: string;
}
export interface GoalView {
  id: string;
  domain: Domain;
  title: string;
  motivation: string;
  status: string;
  tasks: TaskView[];
  doneCount: number;
  total: number;
}

function toGoalView(goal: Goal & { tasks: GoalTask[] }): GoalView {
  const tasks = goal.tasks.map((t) => ({ id: t.id, title: t.title, done: t.done, source: t.source }));
  return {
    id: goal.id,
    domain: goal.domain as Domain,
    title: goal.title,
    motivation: goal.motivation,
    status: goal.status,
    tasks,
    doneCount: tasks.filter((t) => t.done).length,
    total: tasks.length,
  };
}

export async function getGoalsForLocation(locationKey: LocationKey): Promise<GoalView[]> {
  const userId = await requireUserId();
  const domain = LOCATION_TO_DOMAIN[locationKey];
  const goals = await prisma.goal.findMany({
    where: { userId, domain, status: "active" },
    orderBy: { createdAt: "asc" },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  return goals.map(toGoalView);
}

export async function getAllGoals(): Promise<GoalView[]> {
  const userId = await requireUserId();
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  return goals.map(toGoalView);
}

export async function addGoal(input: GoalInput): Promise<{ ok?: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = GoalInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте цель" };
  try {
    await createGoalWithTasks(userId, parsed.data);
  } catch (e) {
    console.error("[goals] addGoal failed", e);
    return { error: "Не удалось создать цель. Попробуйте ещё раз." };
  }
  return { ok: true };
}

/** Batch create for onboarding (each goal gets AI-generated tasks). */
export async function createGoalsBatch(goals: GoalInput[]): Promise<{ ok?: boolean; error?: string }> {
  const userId = await requireUserId();
  const valid = goals
    .map((g) => GoalInputSchema.safeParse(g))
    .filter((r) => r.success)
    .map((r) => r.data);
  if (valid.length === 0) return { error: "Добавьте хотя бы одну цель" };
  try {
    for (const g of valid) await createGoalWithTasks(userId, g);
  } catch (e) {
    console.error("[goals] batch failed", e);
    return { error: "Не удалось создать цели. Попробуйте ещё раз." };
  }
  return { ok: true };
}

/** Accept an AI-suggested next goal — tasks already known, so NO extra AI call. */
export async function addSuggestedGoal(
  suggestion: unknown,
): Promise<{ ok?: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = NextGoalSchema.safeParse(suggestion);
  if (!parsed.success) return { error: "Некорректное предложение" };
  const s = parsed.data;
  await createGoalWithGivenTasks(
    userId,
    { domain: s.domain, title: s.title, description: "", motivation: s.motivation, currentState: "", hoursPerWeek: 3 },
    s.tasks,
  );
  return { ok: true };
}

export async function completeGoal(goalId: string) {
  const userId = await requireUserId();
  return completeGoalAndSuggest(userId, goalId);
}

export async function deleteGoal(goalId: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await prisma.goal.deleteMany({ where: { id: goalId, userId } });
  return { ok: true };
}
