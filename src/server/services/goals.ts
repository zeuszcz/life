import "server-only";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/server/ai";
import { applyRewards, evaluateAchievements, getPlayState } from "./progression";
import type { Domain } from "@/lib/game/constants";
import type { GoalInput, NextGoalResult } from "@/lib/zod-schemas";

const GOAL_COMPLETE_XP = 100;
const GOAL_COMPLETE_GOLD = 30;

/** Add a goal and have the AI break it into mini-tasks (AI call #1). */
export async function createGoalWithTasks(userId: string, input: GoalInput) {
  let tasks: string[];
  try {
    const r = await getProvider().generateGoalTasks({
      domain: input.domain,
      title: input.title,
      description: input.description,
      motivation: input.motivation,
      currentState: input.currentState,
      hoursPerWeek: input.hoursPerWeek,
    });
    tasks = r.tasks;
  } catch (e) {
    console.error("[ai] generateGoalTasks failed", e);
    tasks = [
      `Сделать первый шаг к «${input.title}»`,
      `Заниматься «${input.title}» на этой неделе`,
      `Подвести итоги и наметить следующий шаг`,
    ];
  }
  return createGoalWithGivenTasks(userId, input, tasks);
}

/** Create a goal with already-known tasks (no AI) — e.g. accepting a suggestion. */
export async function createGoalWithGivenTasks(userId: string, input: GoalInput, tasks: string[]) {
  return prisma.goal.create({
    data: {
      userId,
      domain: input.domain,
      title: input.title,
      description: input.description ?? "",
      motivation: input.motivation ?? "",
      currentState: input.currentState ?? "",
      hoursPerWeek: input.hoursPerWeek ?? 3,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      status: "active",
      tasks: {
        create: tasks.slice(0, 12).map((title, i) => ({ title, order: i, source: "ai" as const })),
      },
    },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
}

/** Mark a goal done, reward, then ask the AI for the next goal (AI call #2). */
export async function completeGoalAndSuggest(userId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new Error("Goal not found");

  if (goal.status !== "done") {
    await prisma.goal.update({
      where: { id: goal.id },
      data: { status: "done", completedAt: new Date() },
    });
    await applyRewards(userId, {
      xp: GOAL_COMPLETE_XP,
      gold: GOAL_COMPLETE_GOLD,
      domain: goal.domain as Domain,
    });
    await prisma.activityLog.create({
      data: { userId, type: "goal_complete", payload: { title: goal.title, domain: goal.domain } },
    });
  }

  const newAchievements = await evaluateAchievements(userId);
  const character = await prisma.character.findUnique({ where: { userId } });

  let suggestion: NextGoalResult | null = null;
  try {
    suggestion = await getProvider().suggestNextGoal({
      characterName: character?.name ?? "Игрок",
      domain: goal.domain as Domain,
      completedGoalTitle: goal.title,
    });
  } catch (e) {
    console.error("[ai] suggestNextGoal failed", e);
  }

  const play = await getPlayState(userId);
  return { play, suggestion, newAchievements };
}
