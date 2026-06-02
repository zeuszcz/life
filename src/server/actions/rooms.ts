"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { isLocation } from "@/lib/game/constants";
import { CATALOG_BY_KEY } from "@/lib/game/catalog";
import type { RoomItemDTO } from "@/lib/event-bus";

export async function getRoom(locationKey: string): Promise<RoomItemDTO[]> {
  const userId = await requireUserId();
  if (!isLocation(locationKey)) return [];
  const items = await prisma.roomItem.findMany({ where: { userId, locationKey } });
  return items.map((i) => ({ itemKey: i.itemKey, x: i.x, y: i.y }));
}

export async function saveRoom(
  locationKey: string,
  items: RoomItemDTO[],
): Promise<{ ok?: boolean; error?: string; count?: number }> {
  const userId = await requireUserId();
  if (!isLocation(locationKey)) return { error: "Некорректная локация" };

  const clean = (items ?? [])
    .filter((i) => i && CATALOG_BY_KEY[i.itemKey])
    .slice(0, 60)
    .map((i) => ({
      userId,
      locationKey,
      itemKey: i.itemKey,
      x: Math.round(i.x),
      y: Math.round(i.y),
    }));

  await prisma.$transaction([
    prisma.roomItem.deleteMany({ where: { userId, locationKey } }),
    prisma.roomItem.createMany({ data: clean }),
  ]);
  return { ok: true, count: clean.length };
}
