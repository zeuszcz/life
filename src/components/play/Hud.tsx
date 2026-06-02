"use client";

import Link from "next/link";
import AvatarPreview from "@/components/AvatarPreview";
import { useGameStore } from "@/lib/store";
import { DOMAINS, DOMAIN_META } from "@/lib/game/constants";
import type { Appearance } from "@/lib/zod-schemas";
import { signOutAction } from "@/server/actions/auth";

export default function Hud({
  appearance,
  onOpenToday,
  onOpenGoals,
  onOpenShop,
  onOpenLog,
}: {
  appearance: Appearance;
  onOpenToday: () => void;
  onOpenGoals: () => void;
  onOpenShop: () => void;
  onOpenLog: () => void;
}) {
  const play = useGameStore((s) => s.play);
  if (!play) return null;

  const pct = play.xpForLevel > 0 ? Math.round((play.xpInLevel / play.xpForLevel) * 100) : 0;

  return (
    <>
      {/* Top status bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3">
        <div className="panel pointer-events-auto mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
          <AvatarPreview appearance={appearance} size={44} />
          <div className="min-w-[150px]">
            <div className="flex items-center gap-2">
              <span className="pixel text-sm text-white">{play.characterName}</span>
              <span className="chip text-xs">Lv {play.level}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="xp-track w-36">
                <div className="xp-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-[var(--muted)]">
                {play.xpInLevel}/{play.xpForLevel}
              </span>
            </div>
          </div>
          <div className="chip" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
            🪙 {play.gold}
          </div>
          <div className="ml-auto hidden gap-2 sm:flex">
            {DOMAINS.map((d) => (
              <div
                key={d}
                className="chip text-xs"
                title={`${DOMAIN_META[d].label} — ${DOMAIN_META[d].statName}`}
                style={{ borderColor: DOMAIN_META[d].color }}
              >
                {DOMAIN_META[d].icon} {play.stats[d].level}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3">
        <div className="panel pointer-events-auto mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-3 py-2">
          <button className="btn btn-primary" onClick={onOpenToday}>📅 Сегодня</button>
          <button className="btn" onClick={onOpenGoals}>🎯 Цели</button>
          <button className="btn" onClick={onOpenShop}>🛒 Магазин</button>
          <button className="btn" onClick={onOpenLog}>📝 Записать</button>
          <Link className="btn" href="/dashboard">📊 Профиль</Link>
          <form action={signOutAction}>
            <button className="btn btn-ghost" type="submit">Выйти</button>
          </form>
        </div>
      </div>
    </>
  );
}
