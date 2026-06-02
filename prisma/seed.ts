import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENTS } from "../src/lib/game/achievements";

const prisma = new PrismaClient();

async function main() {
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
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
