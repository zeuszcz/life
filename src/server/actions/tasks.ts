"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import {
  applyRewards,
  evaluateAchievements,
  getPlayState,
  type UnlockedAchievement,
} from "@/server/services/progression";
import type { Domain } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";

export interface ToggleResult {
  ok?: boolean;
  error?: string;
  play?: PlayState;
  gainedXp?: number;
  gainedGold?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newAchievements?: UnlockedAchievement[];
}

export async function toggleTask(taskId: string, done: boolean): Promise<ToggleResult> {
  const userId = await requireUserId();
  const task = await prisma.goalTask.findFirst({
    where: { id: taskId, goal: { userId } },
    include: { goal: true },
  });
  if (!task) return { error: "Задание не найдено" };

  let result: ToggleResult = { ok: true };

  if (done) {
    const firstTime = !task.completedAt; // reward only on the first completion
    await prisma.goalTask.update({
      where: { id: task.id },
      data: { done: true, completedAt: task.completedAt ?? new Date() },
    });
    if (firstTime) {
      const r = await applyRewards(userId, {
        xp: task.xpReward,
        gold: task.goldReward,
        domain: task.goal.domain as Domain,
      });
      await prisma.activityLog.create({
        data: {
          userId,
          type: "task_complete",
          payload: { title: task.title, xp: task.xpReward, gold: task.goldReward, domain: task.goal.domain },
        },
      });
      const newAchievements = await evaluateAchievements(userId);
      result = {
        ok: true,
        gainedXp: task.xpReward,
        gainedGold: task.goldReward,
        leveledUp: r.leveledUp,
        newLevel: r.newLevel,
        newAchievements,
      };
    }
  } else {
    await prisma.goalTask.update({ where: { id: task.id }, data: { done: false } });
  }

  result.play = (await getPlayState(userId)) ?? undefined;
  return result;
}

export async function removeTask(taskId: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await prisma.goalTask.deleteMany({ where: { id: taskId, goal: { userId } } });
  return { ok: true };
}

export async function addTask(
  goalId: string,
  title: string,
): Promise<{ ok?: boolean; error?: string; task?: { id: string; title: string; done: boolean; source: string } }> {
  const userId = await requireUserId();
  const t = title.trim();
  if (t.length < 2) return { error: "Слишком коротко" };
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return { error: "Цель не найдена" };
  const count = await prisma.goalTask.count({ where: { goalId } });
  const task = await prisma.goalTask.create({
    data: { goalId, title: t, order: count, source: "manual" },
  });
  return { ok: true, task: { id: task.id, title: task.title, done: task.done, source: task.source } };
}
