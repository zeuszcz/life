"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarPreview from "@/components/AvatarPreview";
import { AppearanceSchema, type Appearance, type GoalInput } from "@/lib/zod-schemas";
import { DOMAINS, DOMAIN_META, type Domain } from "@/lib/game/constants";
import { createCharacter } from "@/server/actions/character";
import { submitGoalsAndGenerate } from "@/server/actions/goals";

type Step = "character" | "goals" | "generating";

const BODIES: Appearance["body"][] = ["light", "tan", "dark"];
const HAIRS: Appearance["hair"][] = ["short", "long", "buzz", "ponytail"];
const OUTFITS: Appearance["outfit"][] = ["casual", "sporty", "formal", "hoodie"];
const HAIR_COLORS = ["#5a3a1a", "#1c1c1c", "#caa472", "#b5453b", "#6d28d9", "#e2e8f0"];
const OUTFIT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#f59e0b", "#0ea5e9"];

const HAIR_LABEL: Record<Appearance["hair"], string> = {
  short: "Короткие",
  long: "Длинные",
  buzz: "Ёжик",
  ponytail: "Хвост",
};
const OUTFIT_LABEL: Record<Appearance["outfit"], string> = {
  casual: "Кэжуал",
  sporty: "Спорт",
  formal: "Деловой",
  hoodie: "Худи",
};
const BODY_LABEL: Record<Appearance["body"], string> = {
  light: "Светлый",
  tan: "Загар",
  dark: "Тёмный",
};

interface DraftGoal {
  domain: Domain;
  title: string;
  currentState: string;
  motivation: string;
  description: string;
  hoursPerWeek: number;
  targetDate: string;
}

const emptyGoal = (domain: Domain): DraftGoal => ({
  domain,
  title: "",
  currentState: "",
  motivation: "",
  description: "",
  hoursPerWeek: 3,
  targetDate: "",
});

export default function OnboardingClient({
  initialName,
  initialAppearance,
}: {
  initialName: string;
  initialAppearance?: Appearance;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("character");
  const [name, setName] = useState(initialName);
  const [appearance, setAppearance] = useState<Appearance>(
    initialAppearance ?? AppearanceSchema.parse({}),
  );
  const [goals, setGoals] = useState<DraftGoal[]>([emptyGoal("fitness")]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setAp = <K extends keyof Appearance>(k: K, v: Appearance[K]) =>
    setAppearance((a) => ({ ...a, [k]: v }));

  const updateGoal = (i: number, patch: Partial<DraftGoal>) =>
    setGoals((gs) => gs.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  const readyGoals = useMemo(() => goals.filter((g) => g.title.trim().length >= 3), [goals]);

  async function handleCharacterNext() {
    setError(null);
    if (name.trim().length < 1) {
      setError("Введите имя персонажа");
      return;
    }
    setBusy(true);
    const res = await createCharacter({ name: name.trim(), appearance });
    setBusy(false);
    if (res.error) setError(res.error);
    else setStep("goals");
  }

  async function handleGenerate() {
    setError(null);
    if (readyGoals.length === 0) {
      setError("Добавьте хотя бы одну цель с названием (от 3 символов)");
      return;
    }
    const payload: GoalInput[] = readyGoals.map((g) => ({
      domain: g.domain,
      title: g.title.trim(),
      description: g.description.trim(),
      motivation: g.motivation.trim(),
      currentState: g.currentState.trim(),
      hoursPerWeek: g.hoursPerWeek,
      targetDate: g.targetDate || undefined,
    }));
    setStep("generating");
    const res = await submitGoalsAndGenerate(payload);
    if (res.error) {
      setError(res.error);
      setStep("goals");
      return;
    }
    router.push("/play");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Stepper step={step} />

      {step === "character" && (
        <section className="card mt-6 p-6">
          <h2 className="pixel text-xl text-white">Создай персонажа</h2>
          <p className="mb-5 mt-1 text-sm text-[var(--muted)]">Это твой аватар в игре про жизнь.</p>

          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-3">
              <div className="card flex items-center justify-center p-4" style={{ background: "#0e1626" }}>
                <AvatarPreview appearance={appearance} size={120} />
              </div>
            </div>

            <div className="flex-1">
              <label className="label">Имя персонажа</label>
              <input
                className="input mb-4"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Алекс"
              />

              <Picker label="Тон кожи" value={appearance.body} options={BODIES} render={(b) => BODY_LABEL[b]} onPick={(v) => setAp("body", v)} />
              <Picker label="Причёска" value={appearance.hair} options={HAIRS} render={(h) => HAIR_LABEL[h]} onPick={(v) => setAp("hair", v)} />
              <Swatches label="Цвет волос" value={appearance.hairColor} options={HAIR_COLORS} onPick={(v) => setAp("hairColor", v)} />
              <Picker label="Стиль одежды" value={appearance.outfit} options={OUTFITS} render={(o) => OUTFIT_LABEL[o]} onPick={(v) => setAp("outfit", v)} />
              <Swatches label="Цвет одежды" value={appearance.outfitColor} options={OUTFIT_COLORS} onPick={(v) => setAp("outfitColor", v)} />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
          <div className="mt-6 flex justify-end">
            <button className="btn btn-primary" disabled={busy} onClick={handleCharacterNext}>
              {busy ? "Сохраняем..." : "Далее → цели"}
            </button>
          </div>
        </section>
      )}

      {step === "goals" && (
        <section className="mt-6">
          <div className="card p-6">
            <h2 className="pixel text-xl text-white">Твои цели</h2>
            <p className="mb-2 mt-1 text-sm text-[var(--muted)]">
              Опиши, чего хочешь достичь. Чем подробнее — тем точнее ИИ построит роадмапу.
              Каждая цель привязана к локации в игре.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {goals.map((g, i) => (
              <div key={i} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="pixel text-sm text-[var(--muted)]">Цель #{i + 1}</span>
                  {goals.length > 1 && (
                    <button className="btn btn-danger px-2 py-1 text-xs" onClick={() => setGoals((gs) => gs.filter((_, idx) => idx !== i))}>
                      Удалить
                    </button>
                  )}
                </div>

                <label className="label">Сфера</label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {DOMAINS.map((d) => (
                    <button
                      key={d}
                      onClick={() => updateGoal(i, { domain: d })}
                      className="chip"
                      style={
                        g.domain === d
                          ? { borderColor: DOMAIN_META[d].color, background: `${DOMAIN_META[d].color}22` }
                          : undefined
                      }
                    >
                      {DOMAIN_META[d].icon} {DOMAIN_META[d].label}
                    </button>
                  ))}
                </div>

                <label className="label">Цель</label>
                <input className="input mb-3" value={g.title} maxLength={120} placeholder="Например: пробежать 10 км без остановки" onChange={(e) => updateGoal(i, { title: e.target.value })} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Где я сейчас</label>
                    <textarea className="textarea" rows={2} value={g.currentState} placeholder="Текущая ситуация" onChange={(e) => updateGoal(i, { currentState: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Зачем мне это</label>
                    <textarea className="textarea" rows={2} value={g.motivation} placeholder="Мотивация" onChange={(e) => updateGoal(i, { motivation: e.target.value })} />
                  </div>
                </div>

                <label className="label mt-3">Подробности (необязательно)</label>
                <textarea className="textarea" rows={2} value={g.description} placeholder="Любые детали, ограничения, дедлайны" onChange={(e) => updateGoal(i, { description: e.target.value })} />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Часов в неделю: {g.hoursPerWeek}</label>
                    <input type="range" min={1} max={20} value={g.hoursPerWeek} onChange={(e) => updateGoal(i, { hoursPerWeek: Number(e.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="label">Целевая дата (необязательно)</label>
                    <input type="date" className="input" value={g.targetDate} onChange={(e) => updateGoal(i, { targetDate: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn mt-4 w-full" onClick={() => setGoals((gs) => [...gs, emptyGoal("career")])}>
            + Добавить цель
          </button>

          {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}

          <div className="mt-6 flex justify-between">
            <button className="btn btn-ghost" onClick={() => setStep("character")}>← Назад</button>
            <button className="btn btn-primary" onClick={handleGenerate}>🧠 Сгенерировать роадмапу</button>
          </div>
        </section>
      )}

      {step === "generating" && (
        <section className="card mt-6 flex flex-col items-center gap-4 p-12 text-center">
          <div className="text-5xl animate-bounce">🧠</div>
          <h2 className="pixel text-xl text-white">ИИ строит твой путь…</h2>
          <p className="max-w-md text-sm text-[var(--muted)]">
            Разбиваем цели на этапы и квесты по локациям. Это займёт несколько секунд.
          </p>
          <div className="xp-track w-64">
            <div className="xp-fill" style={{ width: "70%" }} />
          </div>
        </section>
      )}
    </main>
  );
}

function Stepper({ step }: { step: Step }) {
  const items: { key: Step; label: string }[] = [
    { key: "character", label: "1. Персонаж" },
    { key: "goals", label: "2. Цели" },
    { key: "generating", label: "3. Роадмапа" },
  ];
  const activeIdx = items.findIndex((i) => i.key === step);
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div
          key={it.key}
          className="chip"
          style={i <= activeIdx ? { borderColor: "var(--accent)", color: "var(--accent)" } : { opacity: 0.6 }}
        >
          {it.label}
        </div>
      ))}
    </div>
  );
}

function Picker<T extends string>({
  label,
  value,
  options,
  render,
  onPick,
}: {
  label: string;
  value: T;
  options: T[];
  render: (v: T) => string;
  onPick: (v: T) => void;
}) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className="chip"
            style={value === o ? { borderColor: "var(--accent)", background: "#4ade8022" } : undefined}
          >
            {render(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Swatches({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: string[];
  onPick: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            aria-label={c}
            className="h-7 w-7 rounded-full border-2"
            style={{ background: c, borderColor: value === c ? "#fff" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}
