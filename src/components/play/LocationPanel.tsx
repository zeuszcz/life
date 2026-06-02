"use client";

import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "@/lib/store";
import {
  LOCATION_META,
  LOCATION_TO_DOMAIN,
  DOMAIN_META,
  type LocationKey,
} from "@/lib/game/constants";
import {
  getGoalsForLocation,
  addGoal,
  completeGoal,
  addSuggestedGoal,
  deleteGoal,
  nextWeek,
  type GoalView,
} from "@/server/actions/goals";
import { toggleTask, removeTask, addTask } from "@/server/actions/tasks";

interface Suggestion {
  domain: string;
  title: string;
  motivation: string;
  tasks: string[];
}

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

  const [goals, setGoals] = useState<GoalView[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWhy, setNewWhy] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const refresh = useCallback(() => {
    return getGoalsForLocation(locationKey).then(setGoals);
  }, [locationKey]);

  useEffect(() => {
    let alive = true;
    getGoalsForLocation(locationKey).then((g) => alive && setGoals(g));
    return () => {
      alive = false;
    };
  }, [locationKey]);

  async function onToggle(taskId: string, done: boolean) {
    // optimistic
    setGoals((gs) =>
      gs?.map((g) => ({ ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done } : t)) })) ?? gs,
    );
    const res = await toggleTask(taskId, done);
    if (res.play) setPlay(res.play);
    if (done && res.gainedXp) pushToast(`+${res.gainedXp} XP · +${res.gainedGold} 🪙`, domainMeta.icon);
    if (res.leveledUp) pushToast(`Новый уровень — ${res.newLevel}!`, "⬆️");
    res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
    refresh();
  }

  async function onRemoveTask(taskId: string) {
    setGoals((gs) => gs?.map((g) => ({ ...g, tasks: g.tasks.filter((t) => t.id !== taskId) })) ?? gs);
    await removeTask(taskId);
  }

  async function onAddTask(goalId: string, title: string) {
    if (title.trim().length < 2) return;
    await addTask(goalId, title);
    refresh();
  }

  async function onCreateGoal() {
    if (newTitle.trim().length < 3) return;
    setBusy(true);
    const res = await addGoal({
      domain: domainMeta.domain,
      title: newTitle.trim(),
      description: "",
      motivation: newWhy.trim(),
      currentState: "",
      hoursPerWeek: 3,
    });
    setBusy(false);
    if (res.error) {
      pushToast(res.error, "⚠️");
      return;
    }
    setNewTitle("");
    setNewWhy("");
    setAdding(false);
    refresh();
  }

  async function onComplete(goalId: string) {
    setBusy(true);
    const res = await completeGoal(goalId);
    setBusy(false);
    if (res.play) setPlay(res.play);
    pushToast("Цель завершена! 🎉 +100 XP", "🏆");
    res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
    if (res.suggestion) setSuggestion(res.suggestion as Suggestion);
    refresh();
  }

  async function onNextWeek(goalId: string) {
    setBusy(true);
    const res = await nextWeek(goalId);
    setBusy(false);
    if (res.error) {
      pushToast(res.error, "⚠️");
      return;
    }
    if (res.play) setPlay(res.play);
    if (res.advanced) {
      if (res.gainedXp) pushToast(`Неделя пройдена! +${res.gainedXp} XP · +${res.gainedGold} 🪙`, "🎉");
      pushToast(`Готовы шаги на неделю ${res.week} 🎯`, "🤖");
      if (res.leveledUp) pushToast(`Новый уровень — ${res.newLevel}!`, "⬆️");
      res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
    }
    refresh();
  }

  async function acceptSuggestion() {
    if (!suggestion) return;
    setBusy(true);
    await addSuggestedGoal(suggestion);
    setBusy(false);
    setSuggestion(null);
    refresh();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden"
        style={{ borderColor: domainMeta.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 className="pixel text-lg text-white">{meta.icon} {meta.label}</h2>
            <p className="text-xs text-[var(--muted)]">Цели сферы «{domainMeta.label}»</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {goals === null && <p className="text-sm text-[var(--muted)]">Загрузка…</p>}

          {goals?.length === 0 && !adding && (
            <div className="py-6 text-center text-sm text-[var(--muted)]">
              <div className="mb-2 text-3xl">🎯</div>
              Здесь пока нет целей. Поставь цель — ИИ разобьёт её на задания.
            </div>
          )}

          {goals?.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              color={domainMeta.color}
              busy={busy}
              onToggle={onToggle}
              onRemoveTask={onRemoveTask}
              onAddTask={onAddTask}
              onComplete={() => onComplete(g.id)}
              onNextWeek={() => onNextWeek(g.id)}
              onDelete={async () => {
                await deleteGoal(g.id);
                refresh();
              }}
            />
          ))}

          {suggestion && (
            <div className="card p-4" style={{ borderLeft: `4px solid ${domainMeta.color}` }}>
              <div className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">
                🤖 ИИ предлагает следующую цель
              </div>
              <div className="font-semibold text-white">{suggestion.title}</div>
              {suggestion.motivation && (
                <p className="mt-1 text-sm text-[var(--muted)]">{suggestion.motivation}</p>
              )}
              <ul className="mt-2 flex flex-col gap-0.5 text-sm text-[var(--muted)]">
                {suggestion.tasks.slice(0, 6).map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary" disabled={busy} onClick={acceptSuggestion}>
                  + Добавить цель
                </button>
                <button className="btn btn-ghost" onClick={() => setSuggestion(null)}>Не сейчас</button>
              </div>
            </div>
          )}

          {adding ? (
            <div className="card p-4">
              <label className="label">Новая цель</label>
              <input
                className="input mb-2"
                value={newTitle}
                maxLength={120}
                placeholder="Чего хочешь достичь?"
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                className="input mb-3"
                value={newWhy}
                maxLength={200}
                placeholder="Зачем тебе это? (необязательно)"
                onChange={(e) => setNewWhy(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn btn-primary" disabled={busy || newTitle.trim().length < 3} onClick={onCreateGoal}>
                  {busy ? "🤖 ИИ придумывает задания…" : "Создать (ИИ разобьёт на шаги)"}
                </button>
                <button className="btn btn-ghost" onClick={() => setAdding(false)}>Отмена</button>
              </div>
            </div>
          ) : (
            goals !== null && (
              <button className="btn" onClick={() => setAdding(true)}>+ Новая цель</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  color,
  busy,
  onToggle,
  onRemoveTask,
  onAddTask,
  onComplete,
  onNextWeek,
  onDelete,
}: {
  goal: GoalView;
  color: string;
  busy: boolean;
  onToggle: (taskId: string, done: boolean) => void;
  onRemoveTask: (taskId: string) => void;
  onAddTask: (goalId: string, title: string) => void;
  onComplete: () => void;
  onNextWeek: () => void;
  onDelete: () => void;
}) {
  const [newTask, setNewTask] = useState("");
  const pct = goal.total > 0 ? Math.round((goal.doneCount / goal.total) * 100) : 0;
  const allDone = goal.total > 0 && goal.doneCount === goal.total;

  return (
    <div className="card p-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{goal.title}</h3>
        <button className="text-xs text-[var(--muted)] hover:text-[var(--danger)]" title="Удалить цель" onClick={onDelete}>✕</button>
      </div>
      {goal.motivation && <p className="mt-0.5 text-xs text-[var(--muted)]">{goal.motivation}</p>}

      <div className="mt-2 flex items-center gap-2">
        <span className="chip text-[10px]" title="Недельный спринт по цели">Неделя {goal.week}</span>
        {goal.weeksCompleted > 0 && (
          <span className="text-[10px] text-[var(--muted)]">✓ {goal.weeksCompleted} пройдено</span>
        )}
        <div className="xp-track flex-1"><div className="xp-fill" style={{ width: `${pct}%`, background: color }} /></div>
        <span className="text-xs text-[var(--muted)]">{goal.doneCount}/{goal.total}</span>
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {goal.tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => onToggle(t.id, e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span className={t.done ? "flex-1 text-[var(--muted)] line-through" : "flex-1"}>{t.title}</span>
            <button className="text-xs text-[var(--muted)] hover:text-[var(--danger)]" title="Убрать задание" onClick={() => onRemoveTask(t.id)}>🗑</button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex gap-2">
        <input
          className="input flex-1 py-1 text-sm"
          value={newTask}
          placeholder="+ своё задание"
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAddTask(goal.id, newTask);
              setNewTask("");
            }
          }}
        />
      </div>

      {allDone ? (
        <div className="mt-3 rounded-md border border-[var(--border)] bg-black/20 p-3 text-center">
          <div className="text-sm font-semibold text-white">🎉 Неделя {goal.week} пройдена!</div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">ИИ составит следующие шаги для этой же цели.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={onNextWeek}>
              {busy ? "🤖 Готовлю следующие шаги…" : "Следующие шаги →"}
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={onComplete} title="Закрыть цель — она перейдёт в завершённые">
              Завершить цель ✓
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-right">
          <button
            className="text-xs text-[var(--muted)] hover:text-white underline-offset-2 hover:underline"
            disabled={busy}
            onClick={onComplete}
            title="Закрыть цель в любой момент, не выполняя все шаги"
          >
            Завершить цель досрочно
          </button>
        </div>
      )}
    </div>
  );
}
