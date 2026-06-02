// Runs once when the Next.js server boots. Idempotently ensures the achievement
// catalogue exists in the DB so production doesn't need a separate seed step.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { prisma } = await import("@/lib/prisma");
    const { ACHIEVEMENTS } = await import("@/lib/game/achievements");
    for (const a of ACHIEVEMENTS) {
      await prisma.achievementDef.upsert({
        where: { key: a.key },
        update: {
          title: a.title,
          description: a.description,
          icon: a.icon,
          conditionType: a.conditionType,
          threshold: a.threshold,
          domain: a.domain,
        },
        create: a,
      });
    }
    console.log(`[seed] achievements ensured (${ACHIEVEMENTS.length})`);
  } catch (err) {
    // DB may not be migrated yet on very first boot — safe to ignore; the next
    // boot (after migrate) will seed.
    console.warn("[seed] skipped:", (err as Error).message);
  }
}
