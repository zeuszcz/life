"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { getProvider } from "@/server/ai";
import type { WeeklyReviewResult } from "@/lib/zod-schemas";

// On-demand weekly digest (an AI call — used deliberately, not per action).
export async function getWeeklyReview(): Promise<
  WeeklyReviewResult & { tasksThisWeek: number; dayStreak: number }
> {
  const userId = await requireUserId();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [character, tasksThisWeek, habitsTracked, habits] = await Promise.all([
    prisma.character.findUnique({ where: { userId } }),
    prisma.activityLog.count({ where: { userId, type: "task_complete", createdAt: { gte: weekAgo } } }),
    prisma.habit.count({ where: { userId } }),
    prisma.habit.findMany({ where: { userId }, select: { bestStreak: true } }),
  ]);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);
  const dayStreak = character?.dayStreak ?? 0;

  const r = await getProvider().reviewWeek({
    characterName: character?.name ?? "Игрок",
    level: character?.level ?? 1,
    tasksThisWeek,
    habitsTracked,
    bestStreak,
    dayStreak,
  });
  return { ...r, tasksThisWeek, dayStreak };
}
