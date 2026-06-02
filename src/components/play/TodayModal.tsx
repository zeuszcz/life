"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store";
import { DOMAINS, DOMAIN_META, type Domain } from "@/lib/game/constants";
import { claimDaily } from "@/server/actions/daily";
import {
  getHabits,
  createHabit,
  completeHabit,
  deleteHabit,
  type HabitView,
} from "@/server/actions/habits";
import { getTodayTasks, type TodayTaskView } from "@/server/actions/goals";
import { toggleTask } from "@/server/actions/tasks";

const HABIT_PRESETS: Record<Domain, string[]> = {
  fitness: ["Зарядка 5 минут", "10 000 шагов", "Отжимания 2 подхода"],
  career: ["Час фокус-работы", "Читать по профессии 20 мин", "Разобрать задачи на день"],
  wellbeing: ["Медитация 5 минут", "8 стаканов воды", "Лечь спать до 23:00"],
  knowledge: ["Учить язык 15 минут", "Читать книгу 20 страниц", "Узнать новый факт"],
};

export default function TodayModal({ onClose }: { onClose: () => void }) {
  const setPlay = useGameStore((s) => s.setPlay);
  const pushToast = useGameStore((s) => s.pushToast);

  const [dayStreak, setDayStreak] = useState(0);
  const [habits, setHabits] = useState<HabitView[] | null>(null);
  const [tasks, setTasks] = useState<TodayTaskView[]>([]);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState<Domain>("fitness");
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const claim = await claimDaily();
      if (!alive) return;
      setDayStreak(claim.dayStreak);
      if (claim.claimed) {
        if (claim.play) setPlay(claim.play);
        pushToast(`Бонус за вход: +${claim.gold} 🪙 · стрик ${claim.dayStreak} 🔥`, "🎁");
      }
      setHabits(await getHabits());
      setTasks(await getTodayTasks());
    })();
    return () => {
      alive = false;
    };
  }, [setPlay, pushToast]);

  async function onCompleteHabit(h: HabitView) {
    if (h.doneToday) return;
    setHabits((hs) => hs?.map((x) => (x.id === h.id ? { ...x, doneToday: true, currentStreak: x.currentStreak + 1 } : x)) ?? hs);
    const res = await completeHabit(h.id);
    if (res.error) {
      setHabits(await getHabits());
      return;
    }
    if (res.play) setPlay(res.play);
    pushToast(`+${res.gainedXp} XP · +${res.gainedGold} 🪙 · 🔥${res.currentStreak}`, DOMAIN_META[h.domain].icon);
    if (res.leveledUp) pushToast(`Новый уровень — ${res.newLevel}!`, "⬆️");
    res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
    setHabits(await getHabits());
  }

  async function onAddHabit() {
    if (newTitle.trim().length < 2) return;
    setBusy(true);
    const res = await createHabit(newDomain, newTitle.trim());
    setBusy(false);
    if (res.error) {
      pushToast(res.error, "⚠️");
      return;
    }
    setNewTitle("");
    setAdding(false);
    setHabits(await getHabits());
  }

  async function onDoTask(t: TodayTaskView) {
    setTasks((ts) => ts.filter((x) => x.id !== t.id));
    const res = await toggleTask(t.id, true);
    if (res.play) setPlay(res.play);
    if (res.gainedXp) pushToast(`+${res.gainedXp} XP · +${res.gainedGold} 🪙`, DOMAIN_META[t.domain].icon);
    if (res.leveledUp) pushToast(`Новый уровень — ${res.newLevel}!`, "⬆️");
    res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 className="pixel text-lg text-white">📅 Сегодня</h2>
            <p className="text-xs text-[var(--muted)]">Твой день. Маленькие шаги каждый день.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="chip" style={{ borderColor: "#f5a623", color: "#f5a623" }}>🔥 {dayStreak} дн.</span>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
          </div>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {/* Habits */}
          <section>
            <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Ежедневные привычки</h3>
            {habits === null && <p className="text-sm text-[var(--muted)]">Загрузка…</p>}
            {habits?.length === 0 && !adding && (
              <p className="text-sm text-[var(--muted)]">Пока нет привычек. Добавь первую 👇</p>
            )}
            <div className="flex flex-col gap-1.5">
              {habits?.map((h) => (
                <div key={h.id} className="card flex items-center gap-2 p-2.5" style={{ borderLeft: `3px solid ${DOMAIN_META[h.domain].color}`, opacity: h.doneToday ? 0.65 : 1 }}>
                  <input type="checkbox" checked={h.doneToday} onChange={() => onCompleteHabit(h)} className="h-5 w-5 accent-[var(--accent)]" />
                  <span className={h.doneToday ? "flex-1 text-sm line-through text-[var(--muted)]" : "flex-1 text-sm"}>
                    {DOMAIN_META[h.domain].icon} {h.title}
                  </span>
                  {h.currentStreak > 0 && <span className="text-xs" style={{ color: "#f5a623" }}>🔥 {h.currentStreak}</span>}
                  <button className="text-xs text-[var(--muted)] hover:text-[var(--danger)]" onClick={async () => { await deleteHabit(h.id); setHabits(await getHabits()); }}>🗑</button>
                </div>
              ))}
            </div>

            {adding ? (
              <div className="card mt-2 p-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {DOMAINS.map((d) => (
                    <button key={d} onClick={() => setNewDomain(d)} className="chip text-xs" style={newDomain === d ? { borderColor: DOMAIN_META[d].color, background: `${DOMAIN_META[d].color}22` } : undefined}>
                      {DOMAIN_META[d].icon} {DOMAIN_META[d].label}
                    </button>
                  ))}
                </div>
                <input className="input mb-2 py-1.5 text-sm" value={newTitle} maxLength={80} placeholder="Например: зарядка 5 минут" onChange={(e) => setNewTitle(e.target.value)} />
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {HABIT_PRESETS[newDomain].map((p) => (
                    <button key={p} className="chip text-xs" onClick={() => setNewTitle(p)}>{p}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary" disabled={busy || newTitle.trim().length < 2} onClick={onAddHabit}>Добавить</button>
                  <button className="btn btn-ghost" onClick={() => setAdding(false)}>Отмена</button>
                </div>
              </div>
            ) : (
              habits !== null && <button className="btn mt-2" onClick={() => setAdding(true)}>+ Привычка</button>
            )}
          </section>

          {/* Next steps from goals */}
          {tasks.length > 0 && (
            <section>
              <h3 className="pixel mb-2 text-sm text-[var(--muted)]">Ближайшие шаги к целям</h3>
              <div className="flex flex-col gap-1.5">
                {tasks.map((t) => (
                  <div key={t.id} className="card flex items-center gap-2 p-2.5" style={{ borderLeft: `3px solid ${DOMAIN_META[t.domain].color}` }}>
                    <input type="checkbox" checked={false} onChange={() => onDoTask(t)} className="h-5 w-5 accent-[var(--accent)]" />
                    <span className="flex-1 text-sm">{t.title}</span>
                    <span className="text-[10px] uppercase text-[var(--muted)]">{t.goalTitle}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
