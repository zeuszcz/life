"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/store";
import {
  LOCATION_META,
  LOCATION_TO_DOMAIN,
  DOMAIN_META,
  type LocationKey,
  type Difficulty,
  type QuestType,
} from "@/lib/game/constants";
import { getQuestsForLocation, completeQuest, type QuestView } from "@/server/actions/quests";

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Легко", medium: "Средне", hard: "Сложно" };
const TYPE_LABEL: Record<QuestType, string> = {
  oneoff: "Разовый",
  daily: "Ежедневный",
  weekly: "Недельный",
};

export default function LocationPanel({
  locationKey,
  onClose,
}: {
  locationKey: LocationKey;
  onClose: () => void;
}) {
  const meta = LOCATION_META[locationKey];
  const domainMeta = DOMAIN_META[LOCATION_TO_DOMAIN[locationKey]];
  const setPlay = useGameStore((s) => s.setPlay);
  const pushToast = useGameStore((s) => s.pushToast);
  const [quests, setQuests] = useState<QuestView[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getQuestsForLocation(locationKey).then((q) => alive && setQuests(q));
    return () => {
      alive = false;
    };
  }, [locationKey]);

  async function onComplete(q: QuestView) {
    setBusyId(q.id);
    setError(null);
    const res = await completeQuest(q.id);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.play) setPlay(res.play);
    pushToast(`+${res.gainedXp} XP · +${res.gainedGold} 🪙`, domainMeta.icon);
    if (res.leveledUp) pushToast(`Новый уровень — ${res.newLevel}!`, "⬆️");
    res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
    setQuests(await getQuestsForLocation(locationKey));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden"
        style={{ borderColor: domainMeta.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 className="pixel text-lg text-white">
              {meta.icon} {meta.label}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Квесты сферы «{domainMeta.label}» · стат {domainMeta.statName}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {quests === null && <p className="text-sm text-[var(--muted)]">Загрузка…</p>}
          {quests?.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">
              <div className="mb-2 text-3xl">📭</div>
              Здесь пока нет квестов.
              <div className="mt-3">
                <Link href="/onboarding" className="btn btn-primary">
                  Добавить цели и построить путь
                </Link>
              </div>
            </div>
          )}
          {quests?.map((q) => (
            <QuestCard
              key={q.id}
              q={q}
              color={domainMeta.color}
              busy={busyId === q.id}
              onComplete={() => onComplete(q)}
            />
          ))}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function QuestCard({
  q,
  color,
  busy,
  onComplete,
}: {
  q: QuestView;
  color: string;
  busy: boolean;
  onComplete: () => void;
}) {
  return (
    <div className="card p-4" style={{ opacity: q.canComplete ? 1 : 0.72 }}>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-[var(--muted)]">
        {q.milestoneTitle}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-white">{q.title}</h3>
      </div>
      {q.description && <p className="mt-1 text-sm text-[var(--muted)]">{q.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="chip text-xs" style={{ borderColor: color }}>
          {TYPE_LABEL[q.type]}
        </span>
        <span className="chip text-xs">{DIFF_LABEL[q.difficulty]}</span>
        <span className="chip text-xs">⭐ {q.xpReward} XP</span>
        <span className="chip text-xs" style={{ color: "var(--gold)" }}>🪙 {q.goldReward}</span>
        <button
          className="btn btn-primary ml-auto"
          disabled={busy || !q.canComplete}
          onClick={onComplete}
        >
          {busy ? "…" : q.canComplete ? "Выполнить ✓" : q.cooldownLabel ?? "Недоступно"}
        </button>
      </div>
    </div>
  );
}
