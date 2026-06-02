"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import {
  applyRewards,
  evaluateAchievements,
  getPlayState,
  type UnlockedAchievement,
} from "@/server/services/progression";
import { isDomain, type Domain } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";

export interface HabitView {
  id: string;
  domain: Domain;
  title: string;
  doneToday: boolean;
  currentStreak: number;
  bestStreak: number;
}

const DAY = 86_400_000;
const dayKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export async function getHabits(): Promise<HabitView[]> {
  const userId = await requireUserId();
  const habits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const today = dayKey(new Date());
  return habits.map((h) => ({
    id: h.id,
    domain: h.domain as Domain,
    title: h.title,
    doneToday: !!h.lastDoneAt && dayKey(h.lastDoneAt) === today,
    currentStreak: h.currentStreak,
    bestStreak: h.bestStreak,
  }));
}

export async function createHabit(
  domain: string,
  title: string,
): Promise<{ ok?: boolean; error?: string }> {
  const userId = await requireUserId();
  const t = title.trim();
  if (!isDomain(domain)) return { error: "Некорректная сфера" };
  if (t.length < 2) return { error: "Слишком коротко" };
  const count = await prisma.habit.count({ where: { userId } });
  if (count >= 40) return { error: "Слишком много привычек" };
  await prisma.habit.create({ data: { userId, domain, title: t } });
  return { ok: true };
}

export async function deleteHabit(id: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await prisma.habit.deleteMany({ where: { id, userId } });
  return { ok: true };
}

export interface HabitDoneResult {
  ok?: boolean;
  error?: string;
  play?: PlayState;
  gainedXp?: number;
  gainedGold?: number;
  leveledUp?: boolean;
  newLevel?: number;
  currentStreak?: number;
  newAchievements?: UnlockedAchievement[];
}

export async function completeHabit(id: string): Promise<HabitDoneResult> {
  const userId = await requireUserId();
  const h = await prisma.habit.findFirst({ where: { id, userId } });
  if (!h) return { error: "Привычка не найдена" };

  const today = dayKey(new Date());
  if (h.lastDoneAt && dayKey(h.lastDoneAt) === today) return { error: "Уже отмечено сегодня" };

  // Streak: +1 if last completion was yesterday, otherwise reset to 1.
  let streak = 1;
  if (h.lastDoneAt) {
    const diff = Math.round((today - dayKey(h.lastDoneAt)) / DAY);
    if (diff === 1) streak = h.currentStreak + 1;
  }
  const best = Math.max(h.bestStreak, streak);

  await prisma.habit.update({
    where: { id: h.id },
    data: { lastDoneAt: new Date(), currentStreak: streak, bestStreak: best },
  });

  const r = await applyRewards(userId, {
    xp: h.xpReward,
    gold: h.goldReward,
    domain: h.domain as Domain,
  });
  await prisma.activityLog.create({
    data: {
      userId,
      type: "task_complete",
      payload: { habit: h.title, xp: h.xpReward, gold: h.goldReward, domain: h.domain, streak },
    },
  });
  const newAchievements = await evaluateAchievements(userId);
  const play = await getPlayState(userId);

  return {
    ok: true,
    play: play ?? undefined,
    gainedXp: h.xpReward,
    gainedGold: h.goldReward,
    leveledUp: r.leveledUp,
    newLevel: r.newLevel,
    currentStreak: streak,
    newAchievements,
  };
}
