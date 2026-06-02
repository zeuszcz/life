"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { applyRewards, getPlayState } from "@/server/services/progression";
import type { PlayState } from "@/lib/types";

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export interface MoodPoint {
  day: string; // ISO date
  mood: number;
  note: string;
}

export async function getTodayDiary(): Promise<{ mood: number; note: string } | null> {
  const userId = await requireUserId();
  const e = await prisma.diaryEntry.findUnique({
    where: { userId_day: { userId, day: startOfToday() } },
  });
  return e ? { mood: e.mood, note: e.note } : null;
}

export async function saveDiary(
  mood: number,
  note: string,
): Promise<{ ok: boolean; firstToday: boolean; play?: PlayState }> {
  const userId = await requireUserId();
  const m = Math.min(5, Math.max(1, Math.round(mood)));
  const n = note.trim().slice(0, 500);
  const day = startOfToday();

  const existing = await prisma.diaryEntry.findUnique({ where: { userId_day: { userId, day } } });
  await prisma.diaryEntry.upsert({
    where: { userId_day: { userId, day } },
    update: { mood: m, note: n },
    create: { userId, day, mood: m, note: n },
  });

  let play: PlayState | undefined;
  if (!existing) {
    await applyRewards(userId, { xp: 5, gold: 2, domain: "wellbeing" });
    await prisma.activityLog.create({ data: { userId, type: "diary", payload: { mood: m } } });
    play = (await getPlayState(userId)) ?? undefined;
  }
  return { ok: true, firstToday: !existing, play };
}

export async function getRecentMoods(days = 14): Promise<MoodPoint[]> {
  const userId = await requireUserId();
  const from = new Date();
  from.setDate(from.getDate() - days);
  const since = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const entries = await prisma.diaryEntry.findMany({
    where: { userId, day: { gte: since } },
    orderBy: { day: "asc" },
  });
  return entries.map((e) => ({ day: e.day.toISOString().slice(0, 10), mood: e.mood, note: e.note }));
}
