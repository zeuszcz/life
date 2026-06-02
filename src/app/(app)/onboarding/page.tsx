import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OnboardingClient from "@/components/onboarding/OnboardingClient";
import { AppearanceSchema, type Appearance } from "@/lib/zod-schemas";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
  });

  let initialAppearance: Appearance | undefined;
  if (character) {
    const parsed = AppearanceSchema.safeParse(character.appearance);
    if (parsed.success) initialAppearance = parsed.data;
  }

  return (
    <OnboardingClient
      initialName={character?.name ?? session.user.name ?? ""}
      initialAppearance={initialAppearance}
    />
  );
}
