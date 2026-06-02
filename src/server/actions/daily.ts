"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { applyRewards, getPlayState } from "@/server/services/progression";
import type { PlayState } from "@/lib/types";

const DAY = 86_400_000;
const dayKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export async function getDailyState(): Promise<{ dayStreak: number; claimedToday: boolean }> {
  const userId = await requireUserId();
  const c = await prisma.character.findUnique({ where: { userId } });
  if (!c) return { dayStreak: 0, claimedToday: true };
  const today = dayKey(new Date());
  return {
    dayStreak: c.dayStreak,
    claimedToday: !!c.lastActiveDate && dayKey(c.lastActiveDate) === today,
  };
}

export interface DailyClaim {
  claimed: boolean;
  dayStreak: number;
  gold?: number;
  xp?: number;
  play?: PlayState;
}

/** Daily login bonus. Idempotent per day; streak grows on consecutive days. */
export async function claimDaily(): Promise<DailyClaim> {
  const userId = await requireUserId();
  const c = await prisma.character.findUnique({ where: { userId } });
  if (!c) return { claimed: false, dayStreak: 0 };

  const today = dayKey(new Date());
  if (c.lastActiveDate && dayKey(c.lastActiveDate) === today) {
    return { claimed: false, dayStreak: c.dayStreak };
  }

  let streak = 1;
  if (c.lastActiveDate) {
    const diff = Math.round((today - dayKey(c.lastActiveDate)) / DAY);
    if (diff === 1) streak = c.dayStreak + 1;
  }
  const gold = 5 + Math.min(streak, 7) * 3;
  const xp = 10;

  await prisma.character.update({
    where: { userId },
    data: { dayStreak: streak, lastActiveDate: new Date() },
  });
  await applyRewards(userId, { xp, gold });
  await prisma.activityLog.create({
    data: { userId, type: "daily_bonus", payload: { gold, xp, streak } },
  });
  const play = await getPlayState(userId);

  return { claimed: true, dayStreak: streak, gold, xp, play: play ?? undefined };
}
