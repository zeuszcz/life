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

    return () => {
      destroyed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [appearance]);

  return <div ref={containerRef} className="h-full w-full touch-none select-none" />;
}
