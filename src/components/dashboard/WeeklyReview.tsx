"use client";

import { useState } from "react";
import { getWeeklyReview } from "@/server/actions/review";

type Review = Awaited<ReturnType<typeof getWeeklyReview>>;

export default function WeeklyReview() {
  const [data, setData] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      setData(await getWeeklyReview());
    } catch {
      // ignore — provider may be unavailable
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="pixel text-sm text-white">🧠 Обзор недели от ИИ</h3>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? "ИИ думает…" : data ? "Обновить" : "Сделать обзор"}
        </button>
      </div>
      {data ? (
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <p className="text-white">{data.summary}</p>
          <p className="text-[var(--accent)]">{data.encouragement}</p>
          <p className="text-[var(--muted)]">👉 {data.suggestion}</p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Короткий итог недели и один совет на следующую — по твоей статистике.
        </p>
      )}
    </div>
  );
}
