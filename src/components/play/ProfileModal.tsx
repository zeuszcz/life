"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AvatarPreview from "@/components/AvatarPreview";
import { DOMAINS, DOMAIN_META, type Domain } from "@/lib/game/constants";
import { progress } from "@/lib/game/progression";
import type { Appearance } from "@/lib/zod-schemas";
import { getProfileSummary, type ProfileSummary } from "@/server/actions/profile";

const MOOD_EMOJI = ["", "😞", "🙁", "😐", "🙂", "😄"];
const ACTIVITY_LABEL: Record<string, string> = {
  task_complete: "Задание",
  goal_complete: "Цель достигнута",
  week_complete: "Неделя пройдена",
  daily_bonus: "Бонус за вход",
  level_up: "Новый уровень",
  achievement: "Достижение",
  purchase: "Покупка",
  real_achievement: "Достижение в жизни",
  real_purchase: "Покупка в жизни",
};

export default function ProfileModal({
  appearance,
  onClose,
}: {
  appearance: Appearance;
  onClose: () => void;
}) {
  const [data, setData] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getProfileSummary()
      .then((d) => alive && setData(d))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const p = data?.play;
  const xpPct = p && p.xpForLevel > 0 ? Math.round((p.xpInLevel / p.xpForLevel) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 className="pixel text-lg text-white">📊 Прогресс</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          {loading && <p className="text-sm text-[var(--muted)]">Загрузка…</p>}

          {p && data && (
            <>
              {/* Hero */}
              <section className="card flex items-center gap-4 p-4">
                <div className="rounded-xl p-2" style={{ background: "#0e1626" }}>
                  <AvatarPreview appearance={appearance} size={72} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pixel text-lg text-white">{p.characterName}</span>
                    <span className="chip text-xs">Lv {p.level}</span>
                    <span className="chip text-xs" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
                      🪙 {p.gold}
                    </span>
                    <span className="chip text-xs" style={{ borderColor: "#f5a623", color: "#f5a623" }}>
                      🔥 {data.dayStreak} дн.
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="xp-track flex-1"><div className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
                    <span className="shrink-0 text-xs text-[var(--muted)]">{p.xpInLevel}/{p.xpForLevel} XP</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Заданий выполнено: <b className="text-white">{p.tasksCompleted}</b> · недель пройдено:{" "}
                    <b className="text-white">{data.goals.weeksCompleted}</b>
                  </p>
                </div>
              </section>

              {/* Stats */}
              <section>
                <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Характеристики</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {DOMAINS.map((d: Domain) => {
                    const sp = progress(p.stats[d].value);
                    const spct = sp.needed > 0 ? Math.round((sp.current / sp.needed) * 100) : 0;
                    const dm = DOMAIN_META[d];
                    return (
                      <div key={d} className="card p-3" style={{ borderLeft: `4px solid ${dm.color}` }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{dm.icon} {dm.statName}</span>
                          <span className="chip text-[10px]">Ур. {sp.level}</span>
                        </div>
                        <div className="mt-2 xp-track"><div className="xp-fill" style={{ width: `${spct}%`, background: dm.color }} /></div>
                        <div className="mt-1 text-[11px] text-[var(--muted)]">{dm.label} · {sp.current}/{sp.needed} XP</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Goals + habits */}
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="card p-3">
                  <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Цели</h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="chip">🎯 {data.goals.active} активных</span>
                    <span className="chip">✓ {data.goals.done} завершено</span>
                    <span className="chip">🗓 {data.goals.weeksCompleted} недель</span>
                  </div>
                </div>
                <div className="card p-3">
                  <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Привычки</h3>
                  {data.habits.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">Заведи привычку в «Сегодня».</p>
                  ) : (
                    <ul className="flex flex-col gap-1 text-sm">
                      {data.habits.slice(0, 5).map((h) => (
                        <li key={h.id} className="flex items-center gap-2">
                          <span>{DOMAIN_META[h.domain].icon}</span>
                          <span className="flex-1 truncate text-white">{h.title}</span>
                          <span className="text-xs text-[var(--muted)]" title={`Лучший: ${h.bestStreak}`}>🔥 {h.currentStreak}</span>
                          {h.doneToday && <span className="text-xs text-[var(--accent)]">✓</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Mood */}
              <section className="card p-3">
                <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Настроение (последние дни)</h3>
                {data.moods.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">Отмечай настроение в «Сегодня» — здесь появится тренд.</p>
                ) : (
                  <div className="flex flex-wrap gap-1 text-2xl">
                    {data.moods.map((m, i) => <span key={i}>{MOOD_EMOJI[m] ?? "•"}</span>)}
                  </div>
                )}
              </section>

              {/* Achievements */}
              <section className="card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="pixel text-sm text-[var(--muted)]">Достижения</h3>
                  <span className="chip text-xs">{data.achievements.unlocked}/{data.achievements.total}</span>
                </div>
                {data.achievements.recent.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">Выполняй задания и цели — открывай достижения 🏆</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.achievements.recent.map((a, i) => (
                      <span key={i} className="chip text-xs" title={a.title}>{a.icon} {a.title}</span>
                    ))}
                  </div>
                )}
              </section>

              {/* Activity */}
              <section>
                <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Последняя активность</h3>
                <div className="card divide-y divide-[var(--border)]">
                  {data.activity.length === 0 && <p className="p-3 text-sm text-[var(--muted)]">Пока пусто.</p>}
                  {data.activity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 text-sm">
                      <span className="shrink-0 text-[var(--muted)]">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                      <span className="flex-1 truncate text-white">{a.title}</span>
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">
                        {new Date(a.at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <Link href="/dashboard" className="btn w-full">Открыть полный профиль →</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
