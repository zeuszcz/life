"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store";

export default function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} text={t.text} icon={t.icon} onDone={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ text, icon, onDone }: { text: string; icon?: string; onDone: () => void }) {
  useEffect(() => {
    const h = setTimeout(onDone, 2800);
    return () => clearTimeout(h);
  }, [onDone]);

  return (
    <div className="toast panel pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm shadow-lg">
      <span className="text-lg">{icon ?? "✨"}</span>
      <span>{text}</span>
    </div>
  );
}
