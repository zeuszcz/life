"use server";

import { requireUserId } from "@/server/auth-util";
import { getPlayState } from "@/server/services/progression";

export async function refreshPlayState() {
  const userId = await requireUserId();
  return getPlayState(userId);
}
