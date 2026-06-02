import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DOMAIN_META, DOMAINS } from "@/lib/game/constants";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) {
    const character = await prisma.character.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    redirect(character ? "/play" : "/onboarding");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-4 text-6xl">🎮</div>
        <h1 className="pixel text-4xl sm:text-5xl text-white">
          LIFE<span className="text-[var(--accent)]">.</span>
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          Игра про тебя. Опиши свои цели — ИИ построит роадмапу, а ты прокачивай
          реального себя как персонажа: ходи в качалку, на работу, учись и развивайся.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DOMAINS.map((d) => (
            <div key={d} className="card flex flex-col items-center gap-1 py-4">
              <span className="text-3xl">{DOMAIN_META[d].icon}</span>
              <span className="text-sm text-[var(--muted)]">{DOMAIN_META[d].label}</span>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn btn-primary w-full sm:w-auto text-base px-7 py-3">
            🚀 Начать игру
          </Link>
          <Link href="/login" className="btn btn-ghost w-full sm:w-auto text-base px-7 py-3">
            Войти
          </Link>
        </div>

        <p className="mt-10 text-xs text-[var(--muted)]">
          Воспринимай жизнь как игру. Маленькие квесты → большие изменения.
        </p>
      </div>
    </main>
  );
}
