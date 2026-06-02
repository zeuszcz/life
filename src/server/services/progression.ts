import "server-only";
import type { Character, Stat } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DOMAINS, type Domain } from "@/lib/game/constants";
import { applyXp, progress } from "@/lib/game/progression";
import type { PlayState } from "@/lib/types";

/** Ensure a Stat row exists for every domain, then return all of them. */
export async function getOrCreateStats(characterId: string): Promise<Stat[]> {
  const existing = await prisma.stat.findMany({ where: { characterId } });
  const have = new Set(existing.map((s) => s.domain));
  const missing = DOMAINS.filter((d) => !have.has(d));
  if (missing.length === 0) return existing;
  await prisma.stat.createMany({
    data: missing.map((domain) => ({ characterId, domain })),
    skipDuplicates: true,
  });
  return prisma.stat.findMany({ where: { characterId } });
}

export function buildPlayState(
  character: Character,
  stats: Stat[],
  questsCompleted: number,
): PlayState {
  const p = progress(character.xp);
  const statMap = {} as PlayState["stats"];
  for (const d of DOMAINS) {
    const s = stats.find((x) => x.domain === d);
    statMap[d] = { value: s?.value ?? 0, level: s?.level ?? 1 };
  }
  return {
    characterName: character.name,
    level: p.level,
    xp: character.xp,
    xpInLevel: p.current,
    xpForLevel: p.needed,
    gold: character.gold,
    stats: statMap,
    questsCompleted,
  };
}

export async function getPlayState(userId: string): Promise<PlayState | null> {
  const character = await prisma.character.findUnique({ where: { userId } });
  if (!character) return null;
  const [stats, questsCompleted] = await Promise.all([
    getOrCreateStats(character.id),
    prisma.activityLog.count({ where: { userId, type: "quest_complete" } }),
  ]);
  return buildPlayState(character, stats, questsCompleted);
}

export interface RewardResult {
  leveledUp: boolean;
  levelsGained: number;
  statLeveledUp: boolean;
  newLevel: number;
}

/** Apply XP (to the character and, optionally, a domain stat) and gold. */
export async function applyRewards(
  userId: string,
  opts: { xp: number; gold: number; domain?: Domain },
): Promise<RewardResult> {
  const character = await prisma.character.findUnique({ where: { userId } });
  if (!character) throw new Error("Character not found");

  const charRes = applyXp(character.xp, opts.xp);
  await prisma.character.update({
    where: { id: character.id },
    data: {
      xp: charRes.totalXp,
      level: charRes.level,
      gold: { increment: Math.max(0, Math.floor(opts.gold)) },
    },
  });

  let statLeveledUp = false;
  if (opts.domain) {
    const stats = await getOrCreateStats(character.id);
    const stat = stats.find((s) => s.domain === opts.domain);
    if (stat) {
      const statRes = applyXp(stat.value, opts.xp);
      statLeveledUp = statRes.leveledUp;
      await prisma.stat.update({
        where: { id: stat.id },
        data: { value: statRes.totalXp, level: statRes.level },
      });
    }
  }

  return {
    leveledUp: charRes.leveledUp,
    levelsGained: charRes.levelsGained,
    statLeveledUp,
    newLevel: charRes.level,
  };
}

export interface UnlockedAchievement {
  key: string;
  title: string;
  icon: string;
}

/** Check achievement definitions against current state and unlock new ones. */
export async function evaluateAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const defs = await prisma.achievementDef.findMany();
  if (defs.length === 0) return [];

  const [character, unlocked, questsCompleted] = await Promise.all([
    prisma.character.findUnique({ where: { userId }, include: { stats: true } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { key: true } }),
    prisma.activityLog.count({ where: { userId, type: "quest_complete" } }),
  ]);
  if (!character) return [];

  const have = new Set(unlocked.map((u) => u.key));
  const newly: UnlockedAchievement[] = [];

  for (const def of defs) {
    if (have.has(def.key)) continue;
    let ok = false;
    switch (def.conditionType) {
      case "first_quest":
        ok = questsCompleted >= 1;
        break;
      case "quests_completed":
        ok = questsCompleted >= def.threshold;
        break;
      case "level":
        ok = character.level >= def.threshold;
        break;
      case "domain_level":
        ok =
          !!def.domain &&
          (character.stats.find((s) => s.domain === def.domain)?.level ?? 1) >= def.threshold;
        break;
      case "gold_earned":
        ok = character.gold >= def.threshold;
        break;
    }
    if (!ok) continue;
    try {
      await prisma.userAchievement.create({ data: { userId, key: def.key } });
      await prisma.activityLog.create({
        data: { userId, type: "achievement", payload: { key: def.key, title: def.title } },
      });
      newly.push({ key: def.key, title: def.title, icon: def.icon });
    } catch {
      // Unique constraint race — already unlocked elsewhere; ignore.
    }
  }
  return newly;
}
