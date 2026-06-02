import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlayState } from "@/server/services/progression";
import { AppearanceSchema } from "@/lib/zod-schemas";
import PlayClient from "@/components/play/PlayClient";

export default async function PlayPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
  });
  if (!character) redirect("/onboarding");

  const play = await getPlayState(session.user.id);
  if (!play) redirect("/onboarding");

  const appearance = AppearanceSchema.parse(character.appearance);
  return <PlayClient initialPlay={play} appearance={appearance} />;
}
