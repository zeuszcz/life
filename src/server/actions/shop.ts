"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { CATALOG, CATALOG_BY_KEY } from "@/lib/game/catalog";
import { BuyItemSchema, LogRealSchema, type LogRealInput } from "@/lib/zod-schemas";
import { applyRewards, evaluateAchievements, getPlayState } from "@/server/services/progression";

export async function getShopState() {
  const userId = await requireUserId();
  const character = await prisma.character.findUnique({
    where: { userId },
    include: { inventory: { orderBy: { acquiredAt: "desc" } } },
  });
  return {
    gold: character?.gold ?? 0,
    catalog: CATALOG,
    owned: character?.inventory.map((i) => i.itemKey) ?? [],
    inventory: character?.inventory ?? [],
  };
}

export async function buyItem(
  itemKey: string,
): Promise<{ ok?: boolean; error?: string; gold?: number }> {
  const userId = await requireUserId();
  const parsed = BuyItemSchema.safeParse({ itemKey });
  if (!parsed.success) return { error: "Некорректный предмет" };

  const item = CATALOG_BY_KEY[parsed.data.itemKey];
  if (!item) return { error: "Предмет не найден" };

  const character = await prisma.character.findUnique({
    where: { userId },
    include: { inventory: true },
  });
  if (!character) return { error: "Сначала создайте персонажа" };
  if (character.inventory.some((i) => i.itemKey === item.key)) return { error: "Уже куплено" };
  if (character.gold < item.cost) return { error: "Недостаточно золота" };

  await prisma.character.update({
    where: { id: character.id },
    data: { gold: { decrement: item.cost } },
  });
  await prisma.inventoryItem.create({
    data: {
      characterId: character.id,
      itemKey: item.key,
      kind: item.kind,
      name: item.name,
      cost: item.cost,
      source: "shop",
    },
  });
  await prisma.activityLog.create({
    data: { userId, type: "purchase", payload: { itemKey: item.key, name: item.name, cost: item.cost } },
  });

  return { ok: true, gold: character.gold - item.cost };
}

export async function logReal(input: LogRealInput) {
  const userId = await requireUserId();
  const parsed = LogRealSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };

  const character = await prisma.character.findUnique({ where: { userId } });
  if (!character) return { error: "Сначала создайте персонажа" };

  await prisma.activityLog.create({
    data: { userId, type: parsed.data.kind, payload: { title: parsed.data.title, note: parsed.data.note } },
  });
  // A trophy on the shelf for every real milestone/purchase logged.
  await prisma.inventoryItem.create({
    data: {
      characterId: character.id,
      itemKey: `trophy_${parsed.data.kind}_${character.id.slice(0, 6)}_${Math.floor(Date.now() / 1000)}`,
      kind: "trophy",
      name: parsed.data.title,
      cost: 0,
      source: parsed.data.kind === "real_purchase" ? "real_purchase" : "reward",
    },
  });

  const reward = await applyRewards(userId, { xp: 25, gold: 5 });
  const newAchievements = await evaluateAchievements(userId);
  const play = await getPlayState(userId);

  return { ok: true, play: play ?? undefined, leveledUp: reward.leveledUp, newAchievements };
}
