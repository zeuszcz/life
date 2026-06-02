"use client";

import { useEffect, useRef } from "react";
import type PhaserNS from "phaser";
import type { Appearance } from "@/lib/zod-schemas";

// Mounts the Phaser world. Phaser (and the scenes that import it) are loaded
// lazily inside the effect so nothing browser-only is evaluated on the server.
export default function GameCanvas({ appearance }: { appearance: Appearance }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserNS.Game | null>(null);

  useEffect(() => {
    let destroyed = false;

    (async () => {
      const { createGame } = await import("@/game/createGame");
      if (destroyed || !containerRef.current || gameRef.current) return;
      gameRef.current = createGame(containerRef.current, appearance);
    })();

    // The game never captures keys (so typing in HTML inputs always works).
    // The only side effect is that Space / Arrows could scroll the page during
    // play — prevent that, but ONLY when no form field is focused. When the user
    // is typing in an input/textarea/select/contentEditable we do nothing, so
    // every key (incl. Space and the WASD/фцыв letters) reaches the field.
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.code === "Space" || e.key.startsWith("Arrow")) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      destroyed = true;
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [appearance]);

  return <div ref={containerRef} className="h-full w-full touch-none select-none" />;
}
