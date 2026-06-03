"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { getPlayState } from "@/server/services/progression";
import type { PlayState } from "@/lib/types";
import type { Domain } from "@/lib/game/constants";

export interface ProfileHabit {
  id: string;
  title: string;
  domain: Domain;
  currentStreak: number;
  bestStreak: number;
  doneToday: boolean;
}
export interface ProfileActivity {
  type: string;
  title: string;
  at: string;
}
export interface ProfileSummary {
  play: PlayState;
  dayStreak: number;
  goals: { active: number; done: number; weeksCompleted: number };
  habits: ProfileHabit[];
  achievements: { unlocked: number; total: number; recent: { icon: string; title: string }[] };
  activity: ProfileActivity[];
  moods: number[]; // chronological (oldest → newest), values 1..5
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Everything the in-game Progress panel needs, in one round trip. */
export async function getProfileSummary(): Promise<ProfileSummary | null> {
  const userId = await requireUserId();
  const [play, character, goals, habits, defsCount, unlocked, activity, moods] = await Promise.all([
    getPlayState(userId),
    prisma.character.findUnique({ where: { userId }, select: { dayStreak: true } }),
    prisma.goal.findMany({ where: { userId }, select: { status: true, week: true } }),
    prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.achievementDef.count(),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      include: { def: true },
    }),
    prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.diaryEntry.findMany({ where: { userId }, orderBy: { day: "desc" }, take: 14, select: { mood: true } }),
  ]);
  if (!play) return null;

  const now = new Date();
  return {
    play,
    dayStreak: character?.dayStreak ?? 0,
    goals: {
      active: goals.filter((g) => g.status === "active").length,
      done: goals.filter((g) => g.status === "done").length,
      weeksCompleted: goals.reduce((s, g) => s + Math.max(0, g.week - 1), 0),
    },
    habits: habits.map((h) => ({
      id: h.id,
      title: h.title,
      domain: h.domain as Domain,
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      doneToday: !!h.lastDoneAt && sameDay(new Date(h.lastDoneAt), now),
    })),
    achievements: {
      unlocked: unlocked.length,
      total: defsCount,
      recent: unlocked.slice(0, 6).map((u) => ({ icon: u.def.icon, title: u.def.title })),
    },
    activity: activity.map((a) => {
      const p = (a.payload ?? {}) as Record<string, unknown>;
      return { type: a.type, title: typeof p.title === "string" ? p.title : "", at: a.createdAt.toISOString() };
    }),
    moods: moods.map((m) => m.mood).reverse(),
  };
}
