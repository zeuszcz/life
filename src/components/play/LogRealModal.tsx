"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { logReal } from "@/server/actions/shop";

type Kind = "real_achievement" | "real_purchase";

export default function LogRealModal({ onClose }: { onClose: () => void }) {
  const play = useGameStore((s) => s.play);
  const setPlay = useGameStore((s) => s.setPlay);
  const pushToast = useGameStore((s) => s.pushToast);
  const [kind, setKind] = useState<Kind>("real_achievement");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (title.trim().length < 2) {
      setError("Введите название");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await logReal({ kind, title: title.trim(), note: note.trim() });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.play) setPlay(res.play);
    pushToast("Записано в профиль! +25 XP", "🏆");
    res.newAchievements?.forEach((a) => pushToast(`Достижение: ${a.title}`, a.icon));
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="panel w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="pixel text-lg text-white">📝 Записать в жизнь</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Достиг чего-то в реальной жизни или сделал важную покупку? Занеси это в игру —
          получишь трофей и опыт. {play ? `Сейчас Lv ${play.level}.` : ""}
        </p>

        <div className="mb-4 flex gap-2">
          <button
            className="chip flex-1 justify-center py-2"
            style={kind === "real_achievement" ? { borderColor: "var(--accent)", background: "#4ade8022" } : undefined}
            onClick={() => setKind("real_achievement")}
          >
            🏆 Достижение
          </button>
          <button
            className="chip flex-1 justify-center py-2"
            style={kind === "real_purchase" ? { borderColor: "var(--gold)", background: "#f5c51822" } : undefined}
            onClick={() => setKind("real_purchase")}
          >
            🛍️ Покупка
          </button>
        </div>

        <label className="label">Название</label>
        <input
          className="input mb-3"
          value={title}
          maxLength={140}
          placeholder={kind === "real_achievement" ? "Например: сдал экзамен" : "Например: новый ноутбук"}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="label">Заметка (необязательно)</label>
        <textarea
          className="textarea mb-3"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <p className="mb-3 text-sm text-[var(--danger)]">{error}</p>}

        <button className="btn btn-primary w-full" disabled={busy} onClick={submit}>
          {busy ? "Сохраняем…" : "Записать 🏆"}
        </button>
      </div>
    </div>
  );
}
