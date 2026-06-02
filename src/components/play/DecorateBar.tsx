"use client";

import { useEffect, useState } from "react";
import { CATALOG_BY_KEY } from "@/lib/game/catalog";
import { getShopState } from "@/server/actions/shop";

// Always-available starter furniture so the editor is usable without shopping.
const STARTER = ["plant", "rug", "lamp", "chair", "table", "bookshelf"];

export default function DecorateBar({
  onPlace,
  onRemove,
  onSave,
  onCancel,
}: {
  onPlace: (itemKey: string) => void;
  onRemove: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [keys, setKeys] = useState<string[]>(STARTER);

  useEffect(() => {
    let alive = true;
    getShopState()
      .then((s) => {
        if (!alive) return;
        setKeys(Array.from(new Set([...STARTER, ...(s.owned ?? [])])));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 p-3">
      <div className="panel pointer-events-auto mx-auto max-w-3xl p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="pixel text-sm text-white">🛋 Обставить комнату</span>
          <div className="flex gap-2">
            <button className="btn btn-danger" onClick={onRemove}>🗑 Убрать</button>
            <button className="btn btn-ghost" onClick={onCancel}>Отмена</button>
            <button className="btn btn-primary" onClick={onSave}>💾 Сохранить</button>
          </div>
        </div>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Нажми на предмет, затем перетащи его в комнате. Клик по предмету — выделить (для удаления).
        </p>
        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {keys.map((k) => {
            const it = CATALOG_BY_KEY[k];
            if (!it) return null;
            return (
              <button key={k} className="chip" onClick={() => onPlace(k)} title={it.description}>
                {it.icon} {it.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
