"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { GoalsSubmitSchema, type GoalInput } from "@/lib/zod-schemas";
import { generateAndStoreRoadmap } from "@/server/services/roadmap";

export async function submitGoalsAndGenerate(
  goals: GoalInput[],
): Promise<{ ok?: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = GoalsSubmitSchema.safeParse({ goals });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте цели" };
  }

  // Replace the user's goal set with the submitted one.
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.goal.createMany({
    data: parsed.data.goals.map((g) => ({
      userId,
      domain: g.domain,
      title: g.title,
      description: g.description,
      motivation: g.motivation,
      currentState: g.currentState,
      hoursPerWeek: g.hoursPerWeek,
      targetDate: g.targetDate ? new Date(g.targetDate) : null,
    })),
  });

  try {
    await generateAndStoreRoadmap(userId);
  } catch (error) {
    console.error("[roadmap] generation failed", error);
    return { error: "Не удалось сгенерировать роадмапу. Попробуйте ещё раз." };
  }
  return { ok: true };
}

export async function getMyRoadmap() {
  const userId = await requireUserId();
  return prisma.roadmap.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { milestones: { include: { quests: true }, orderBy: { order: "asc" } } },
  });
}
