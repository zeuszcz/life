"use server";

import type { Goal, GoalTask } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { GoalInputSchema, NextGoalSchema, type GoalInput } from "@/lib/zod-schemas";
import { LOCATION_TO_DOMAIN, type Domain, type LocationKey } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";
import type { UnlockedAchievement } from "@/server/services/progression";
import {
  createGoalWithTasks,
  createGoalWithGivenTasks,
  completeGoalAndSuggest,
  generateNextWeekTasks,
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
  week: number; // current weekly sprint
  weeksCompleted: number; // fully finished weeks so far
  tasks: TaskView[]; // CURRENT week's tasks only
  doneCount: number;
  total: number;
}

function toGoalView(goal: Goal & { tasks: GoalTask[] }): GoalView {
  // Show only the current week's checklist; past weeks count as completed.
  const current = goal.tasks.filter((t) => t.week === goal.week);
  const tasks = current.map((t) => ({ id: t.id, title: t.title, done: t.done, source: t.source }));
  return {
    id: goal.id,
    domain: goal.domain as Domain,
    title: goal.title,
    motivation: goal.motivation,
    status: goal.status,
    week: goal.week,
    weeksCompleted: Math.max(0, goal.week - 1),
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

export interface NextWeekResult {
  ok?: boolean;
  error?: string;
  advanced?: boolean;
  week?: number;
  play?: PlayState;
  gainedXp?: number;
  gainedGold?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newAchievements?: UnlockedAchievement[];
}

/**
 * Finish the current week and generate the next week's tasks for the SAME goal
 * (one AI call). The goal stays active — the user closes it via completeGoal.
 */
export async function nextWeek(goalId: string): Promise<NextWeekResult> {
  const userId = await requireUserId();
  try {
    const r = await generateNextWeekTasks(userId, goalId);
    return { ok: true, ...r, play: r.play ?? undefined };
  } catch (e) {
    console.error("[goals] nextWeek failed", e);
    return { error: "Не удалось сгенерировать следующие шаги. Попробуйте ещё раз." };
  }
}

export async function deleteGoal(goalId: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await prisma.goal.deleteMany({ where: { id: goalId, userId } });
  return { ok: true };
}

export interface TodayTaskView {
  id: string;
  title: string;
  goalTitle: string;
  domain: Domain;
}

/** A few not-yet-done tasks across active goals — for the "Today" hub. */
export async function getTodayTasks(limit = 6): Promise<TodayTaskView[]> {
  const userId = await requireUserId();
  const goals = await prisma.goal.findMany({
    where: { userId, status: "active" },
    orderBy: { createdAt: "asc" },
    include: { tasks: { where: { done: false }, orderBy: { order: "asc" } } },
  });
  const out: TodayTaskView[] = [];
  for (const g of goals) {
    for (const t of g.tasks) {
      out.push({ id: t.id, title: t.title, goalTitle: g.title, domain: g.domain as Domain });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
