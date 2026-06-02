"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/auth-util";
import { CharacterCreateSchema, type CharacterCreateInput } from "@/lib/zod-schemas";
import { getOrCreateStats } from "@/server/services/progression";

export async function getMyCharacter() {
  const userId = await requireUserId();
  return prisma.character.findUnique({ where: { userId } });
}

export async function createCharacter(
  input: CharacterCreateInput,
): Promise<{ ok?: boolean; error?: string }> {
  const userId = await requireUserId();
  const parsed = CharacterCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const data = {
    name: parsed.data.name,
    appearance: parsed.data.appearance as unknown as Prisma.InputJsonValue,
  };
  const existing = await prisma.character.findUnique({ where: { userId } });
  const character = existing
    ? await prisma.character.update({ where: { userId }, data })
    : await prisma.character.create({ data: { userId, ...data } });

  await getOrCreateStats(character.id);
  return { ok: true };
}
