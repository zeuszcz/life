"use client";

import { create } from "zustand";
import type { LocationKey } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";

export type { PlayState, DomainStat } from "@/lib/types";

interface UIStore {
  /** Which location panel is open (null = none). */
  openLocation: LocationKey | null;
  /** Location the player is currently standing next to. */
  nearLocation: LocationKey | null;
  /** Latest snapshot of progression, kept in sync after each mutation. */
  play: PlayState | null;
  /** Transient toast messages (level ups, achievements). */
  toasts: { id: number; text: string; icon?: string }[];

  setOpenLocation: (key: LocationKey | null) => void;
  setNearLocation: (key: LocationKey | null) => void;
  setPlay: (play: PlayState) => void;
  pushToast: (text: string, icon?: string) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;

export const useGameStore = create<UIStore>((set) => ({
  openLocation: null,
  nearLocation: null,
  play: null,
  toasts: [],

  setOpenLocation: (key) => set({ openLocation: key }),
  setNearLocation: (key) => set({ nearLocation: key }),
  setPlay: (play) => set({ play }),
  pushToast: (text, icon) =>
    set((s) => ({ toasts: [...s.toasts, { id: toastSeq++, text, icon }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
