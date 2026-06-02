"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyRoadmap } from "@/server/actions/goals";
import { DOMAIN_META, type Domain } from "@/lib/game/constants";

type Roadmap = Awaited<ReturnType<typeof getMyRoadmap>>;

export default function RoadmapModal({ onClose }: { onClose: () => void }) {
  const [roadmap, setRoadmap] = useState<Roadmap | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getMyRoadmap().then((r) => alive && setRoadmap(r));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 className="pixel text-lg text-white">🗺️ Твой путь</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>

        <div className="overflow-y-auto p-4">
          {roadmap === undefined && <p className="text-sm text-[var(--muted)]">Загрузка…</p>}

          {roadmap === null && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">
              Роадмапа ещё не построена.
              <div className="mt-3">
                <Link href="/onboarding" className="btn btn-primary">Поставить цели</Link>
              </div>
            </div>
          )}

          {roadmap && (
            <>
              {roadmap.summary && (
                <div className="card mb-4 p-4 text-sm text-[var(--muted)]">{roadmap.summary}</div>
              )}
              <div className="flex flex-col gap-3">
                {roadmap.milestones.map((m, i) => {
                  const dm = DOMAIN_META[m.domain as Domain];
                  return (
                    <div key={m.id} className="card p-4" style={{ borderLeft: `4px solid ${dm.color}` }}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">
                          {dm.icon} {i + 1}. {m.title}
                        </h3>
                        <span className="chip text-xs">~{m.targetWeeks} нед.</span>
                      </div>
                      {m.description && (
                        <p className="mt-1 text-sm text-[var(--muted)]">{m.description}</p>
                      )}
                      <ul className="mt-2 flex flex-col gap-1">
                        {m.quests.map((q) => (
                          <li key={q.id} className="flex items-center gap-2 text-sm">
                            <span style={{ color: q.status === "done" ? "var(--accent)" : "var(--muted)" }}>
                              {q.status === "done" ? "✓" : "•"}
                            </span>
                            <span className={q.status === "done" ? "line-through opacity-60" : ""}>
                              {q.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-[11px] text-[var(--muted)]">
                Построено: {roadmap.provider} · {roadmap.model} · v{roadmap.version}
              </p>
            </>
          )}
        </div>

        <footer className="border-t border-[var(--border)] p-3 text-center">
          <Link href="/onboarding" className="btn">🔄 Изменить цели / перестроить</Link>
        </footer>
      </div>
    </div>
  );
}
