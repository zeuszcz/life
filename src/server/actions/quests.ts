"use server";

import type { Quest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import {
  applyRewards,
  evaluateAchievements,
  getPlayState,
  type UnlockedAchievement,
} from "@/server/services/progression";
import type { Domain, LocationKey, QuestType, Difficulty } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";

export interface QuestView {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: Difficulty;
  xpReward: number;
  goldReward: number;
  status: string;
  milestoneTitle: string;
  domain: Domain;
  locationKey: LocationKey;
  canComplete: boolean;
  cooldownLabel?: string;
}

const DAY = 24 * 60 * 60 * 1000;

function completability(q: Quest): { can: boolean; label?: string } {
  if (q.type === "oneoff") {
    return q.status === "done" ? { can: false, label: "Выполнено ✓" } : { can: true };
  }
  if (!q.lastCompletedAt) return { can: true };
  const elapsed = Date.now() - q.lastCompletedAt.getTime();
  if (q.type === "daily") {
    return elapsed >= 20 * 60 * 60 * 1000
      ? { can: true }
      : { can: false, label: "Сегодня уже сделано" };
  }
  // weekly
  return elapsed >= 6 * DAY ? { can: true } : { can: false, label: "На этой неделе уже сделано" };
}

export async function getQuestsForLocation(locationKey: LocationKey): Promise<QuestView[]> {
  const userId = await requireUserId();
  const quests = await prisma.quest.findMany({
    where: { locationKey, milestone: { roadmap: { userId } } },
    include: { milestone: { select: { title: true, order: true } } },
    orderBy: [{ milestone: { order: "asc" } }, { createdAt: "asc" }],
  });

  return quests.map((q) => {
    const { can, label } = completability(q);
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type as QuestType,
      difficulty: q.difficulty as Difficulty,
      xpReward: q.xpReward,
      goldReward: q.goldReward,
      status: q.status,
      milestoneTitle: q.milestone.title,
      domain: q.domain as Domain,
      locationKey: q.locationKey as LocationKey,
      canComplete: can,
      cooldownLabel: label,
    };
  });
}

export interface CompleteResult {
  ok?: boolean;
  error?: string;
  play?: PlayState;
  leveledUp?: boolean;
  newLevel?: number;
  gainedXp?: number;
  gainedGold?: number;
  newAchievements?: UnlockedAchievement[];
}

export async function completeQuest(questId: string): Promise<CompleteResult> {
  const userId = await requireUserId();
  const quest = await prisma.quest.findFirst({
    where: { id: questId, milestone: { roadmap: { userId } } },
  });
  if (!quest) return { error: "Квест не найден" };

  const { can, label } = completability(quest);
  if (!can) return { error: label ?? "Сейчас нельзя выполнить" };

  const reward = await applyRewards(userId, {
    xp: quest.xpReward,
    gold: quest.goldReward,
    domain: quest.domain as Domain,
  });

  await prisma.quest.update({
    where: { id: quest.id },
    data:
      quest.type === "oneoff"
        ? { status: "done", completedAt: new Date(), lastCompletedAt: new Date() }
        : { lastCompletedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      type: "quest_complete",
      payload: {
        questId: quest.id,
        title: quest.title,
        xp: quest.xpReward,
        gold: quest.goldReward,
        domain: quest.domain,
      },
    },
  });

  if (reward.leveledUp) {
    await prisma.activityLog.create({
      data: { userId, type: "level_up", payload: { level: reward.newLevel } },
    });
  }

  const newAchievements = await evaluateAchievements(userId);
  const play = await getPlayState(userId);

  return {
    ok: true,
    play: play ?? undefined,
    leveledUp: reward.leveledUp,
    newLevel: reward.newLevel,
    gainedXp: quest.xpReward,
    gainedGold: quest.goldReward,
    newAchievements,
  };
}
