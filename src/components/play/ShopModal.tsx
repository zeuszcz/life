"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store";
import { getShopState, buyItem } from "@/server/actions/shop";

type ShopState = Awaited<ReturnType<typeof getShopState>>;

export default function ShopModal({ onClose }: { onClose: () => void }) {
  const play = useGameStore((s) => s.play);
  const setPlay = useGameStore((s) => s.setPlay);
  const pushToast = useGameStore((s) => s.pushToast);
  const [shop, setShop] = useState<ShopState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getShopState().then((s) => alive && setShop(s));
    return () => {
      alive = false;
    };
  }, []);

  const gold = shop?.gold ?? play?.gold ?? 0;

  async function onBuy(key: string) {
    setBusy(key);
    setError(null);
    const res = await buyItem(key);
    setBusy(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    pushToast("Покупка совершена!", "🛍️");
    if (typeof res.gold === "number") {
      setShop((s) => (s ? { ...s, gold: res.gold!, owned: [...s.owned, key] } : s));
      if (play) setPlay({ ...play, gold: res.gold });
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 className="pixel text-lg text-white">🛒 Магазин</h2>
          <div className="flex items-center gap-3">
            <span className="chip" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
              🪙 {gold}
            </span>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">✕</button>
          </div>
        </header>

        <div className="overflow-y-auto p-4">
          {shop === null ? (
            <p className="text-sm text-[var(--muted)]">Загрузка…</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shop.catalog.map((item) => {
                const owned = shop.owned.includes(item.key);
                const tooPoor = gold < item.cost;
                return (
                  <div key={item.key} className="card flex flex-col items-center gap-2 p-3 text-center">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-[var(--muted)]">{item.description}</div>
                    <button
                      className="btn btn-primary mt-auto w-full text-sm"
                      disabled={owned || tooPoor || busy === item.key}
                      onClick={() => onBuy(item.key)}
                    >
                      {owned ? "Куплено ✓" : busy === item.key ? "…" : `🪙 ${item.cost}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
