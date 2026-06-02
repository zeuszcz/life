import "server-only";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/server/ai";
import { applyRewards, evaluateAchievements, getPlayState } from "./progression";
import type { Domain } from "@/lib/game/constants";
import type { GoalInput, NextGoalResult } from "@/lib/zod-schemas";

const GOAL_COMPLETE_XP = 100;
const GOAL_COMPLETE_GOLD = 30;
const WEEK_COMPLETE_XP = 40;
const WEEK_COMPLETE_GOLD = 12;

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

/**
 * Finish the CURRENT week of a goal and have the AI generate the NEXT week's
 * tasks for the SAME goal — continuing the progress, no repeats (AI call).
 * Rewards a "week complete" bonus. The goal itself stays active; the user
 * closes it whenever they want via completeGoalAndSuggest.
 */
export async function generateNextWeekTasks(userId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: { tasks: true },
  });
  if (!goal) throw new Error("Goal not found");
  if (goal.status !== "active") throw new Error("Goal is not active");

  const current = goal.tasks.filter((t) => t.week === goal.week);
  const allDone = current.length > 0 && current.every((t) => t.done);
  if (!allDone) {
    const play = await getPlayState(userId);
    return { play, advanced: false as const };
  }

  const nextWeek = goal.week + 1;
  const previousTasks = goal.tasks
    .filter((t) => t.done)
    .sort((a, b) => a.week - b.week || a.order - b.order)
    .map((t) => t.title);

  let tasks: string[];
  try {
    const r = await getProvider().generateGoalTasks({
      domain: goal.domain as Domain,
      title: goal.title,
      description: goal.description,
      motivation: goal.motivation,
      currentState: goal.currentState,
      hoursPerWeek: goal.hoursPerWeek,
      week: nextWeek,
      previousTasks,
    });
    tasks = r.tasks;
  } catch (e) {
    console.error("[ai] next-week generateGoalTasks failed", e);
    tasks = [
      `Неделя ${nextWeek}: повторить ключевое действие по «${goal.title}»`,
      `Усложнить задачу и закрыть слабое место прошлой недели`,
      `Подвести итоги недели и наметить следующий шаг`,
    ];
  }

  await prisma.$transaction([
    prisma.goal.update({ where: { id: goal.id }, data: { week: nextWeek } }),
    prisma.goalTask.createMany({
      data: tasks.slice(0, 12).map((title, i) => ({
        goalId: goal.id,
        title,
        order: i,
        week: nextWeek,
        source: "ai" as const,
      })),
    }),
  ]);

  const rewarded = await applyRewards(userId, {
    xp: WEEK_COMPLETE_XP,
    gold: WEEK_COMPLETE_GOLD,
    domain: goal.domain as Domain,
  });
  await prisma.activityLog.create({
    data: {
      userId,
      type: "week_complete",
      payload: { title: goal.title, week: goal.week, domain: goal.domain },
    },
  });

  const newAchievements = await evaluateAchievements(userId);
  const play = await getPlayState(userId);
  return {
    play,
    advanced: true as const,
    week: nextWeek,
    gainedXp: WEEK_COMPLETE_XP,
    gainedGold: WEEK_COMPLETE_GOLD,
    leveledUp: rewarded.leveledUp,
    newLevel: rewarded.newLevel,
    newAchievements,
  };
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
