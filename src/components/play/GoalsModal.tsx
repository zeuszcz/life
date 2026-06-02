"use client";

import { useEffect, useState } from "react";
import { getAllGoals, type GoalView } from "@/server/actions/goals";
import { DOMAIN_META } from "@/lib/game/constants";

export default function GoalsModal({ onClose }: { onClose: () => void }) {
  const [goals, setGoals] = useState<GoalView[] | null>(null);

  useEffect(() => {
    let alive = true;
    getAllGoals().then((g) => alive && setGoals(g));
    return () => {
      alive = false;
    };
  }, []);

  const active = goals?.filter((g) => g.status !== "done") ?? [];
  const done = goals?.filter((g) => g.status === "done") ?? [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 className="pixel text-lg text-white">🎯 Мои цели</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>

        <div className="overflow-y-auto p-4">
          {goals === null && <p className="text-sm text-[var(--muted)]">Загрузка…</p>}
          {goals?.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--muted)]">
              Целей пока нет. Заходи в локации (Качалка / Работа / Дом / Учёба) и ставь цели — ИИ разобьёт их на задания.
            </p>
          )}

          {active.length > 0 && <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Активные</h3>}
          <div className="flex flex-col gap-3">
            {active.map((g) => <GoalRow key={g.id} g={g} />)}
          </div>

          {done.length > 0 && (
            <>
              <h3 className="pixel mb-2 mt-5 text-sm text-[var(--muted)]">Завершённые</h3>
              <div className="flex flex-col gap-2">
                {done.map((g) => (
                  <div key={g.id} className="card flex items-center gap-2 p-3 opacity-70">
                    <span>{DOMAIN_META[g.domain].icon}</span>
                    <span className="flex-1 text-sm text-white line-through">{g.title}</span>
                    <span className="text-xs text-[var(--accent)]">✓ завершено</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalRow({ g }: { g: GoalView }) {
  const dm = DOMAIN_META[g.domain];
  const pct = g.total > 0 ? Math.round((g.doneCount / g.total) * 100) : 0;
  return (
    <div className="card p-4" style={{ borderLeft: `4px solid ${dm.color}` }}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white">{dm.icon} {g.title}</h4>
        <span className="chip text-xs">{g.doneCount}/{g.total}</span>
      </div>
      <div className="mt-2 xp-track"><div className="xp-fill" style={{ width: `${pct}%`, background: dm.color }} /></div>
      <ul className="mt-2 flex flex-col gap-0.5 text-sm">
        {g.tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <span style={{ color: t.done ? "var(--accent)" : "var(--muted)" }}>{t.done ? "✓" : "•"}</span>
            <span className={t.done ? "text-[var(--muted)] line-through" : ""}>{t.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
