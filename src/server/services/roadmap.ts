import "server-only";
import { prisma } from "@/lib/prisma";
import { getProvider, type RoadmapInput } from "@/server/ai";
import { DOMAIN_TO_LOCATION, type Domain } from "@/lib/game/constants";

/**
 * Generate a roadmap for the user from their stored goals and persist it as
 * Milestones + Quests. Replaces any previous roadmap so there is exactly one
 * active plan (XP/achievements already earned are preserved in ActivityLog).
 */
export async function generateAndStoreRoadmap(userId: string) {
  const [user, goals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { character: true } }),
    prisma.goal.findMany({ where: { userId, status: "active" }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!user) throw new Error("User not found");
  if (goals.length === 0) throw new Error("No goals to plan");

  const provider = getProvider();
  const input: RoadmapInput = {
    characterName: user.character?.name ?? user.name ?? "Игрок",
    goals: goals.map((g) => ({
      domain: g.domain as Domain,
      title: g.title,
      description: g.description,
      motivation: g.motivation,
      currentState: g.currentState,
      hoursPerWeek: g.hoursPerWeek,
      targetDate: g.targetDate ? g.targetDate.toISOString().slice(0, 10) : null,
    })),
  };

  const result = await provider.generateRoadmap(input);

  const prevCount = await prisma.roadmap.count({ where: { userId } });
  // Cascade-deletes old milestones + quests.
  await prisma.roadmap.deleteMany({ where: { userId } });

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      provider: provider.name,
      model: provider.model,
      summary: result.summary,
      version: prevCount + 1,
      milestones: {
        create: result.milestones.map((m, i) => ({
          domain: m.domain,
          title: m.title,
          description: m.description,
          order: i,
          targetWeeks: m.targetWeeks,
          xpReward: m.xpReward,
          quests: {
            create: m.quests.map((q) => ({
              domain: m.domain,
              locationKey: DOMAIN_TO_LOCATION[m.domain],
              title: q.title,
              description: q.description,
              type: q.type,
              difficulty: q.difficulty,
              xpReward: q.xpReward,
              goldReward: q.goldReward,
            })),
          },
        })),
      },
    },
    include: { milestones: { include: { quests: true }, orderBy: { order: "asc" } } },
  });

  return roadmap;
}
