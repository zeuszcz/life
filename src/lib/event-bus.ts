import mitt, { type Emitter } from "mitt";
import type { LocationKey } from "@/lib/game/constants";

export interface RoomItemDTO {
  itemKey: string;
  x: number;
  y: number;
}

// Typed event bus bridging the Phaser world and the React UI.
export type GameEvents = {
  // Overworld
  "near-location": { key: LocationKey };
  "leave-location": { key: LocationKey };
  "game-ready": void;
  "set-input-enabled": { enabled: boolean };

  // Quests
  "open-location": { key: LocationKey };

  // Interiors
  "enter-interior": { key: LocationKey };
  "exit-interior": void;
  "interior-hint": { text: string | null };

  // Interior editor (React -> Phaser)
  "set-edit-mode": { enabled: boolean };
  "place-item": { itemKey: string };
  "remove-selected": void;
  "save-room": void;
  // React -> Phaser: render saved furniture for a room
  "load-room": { key: LocationKey; items: RoomItemDTO[] };
  // Phaser -> React: current furniture layout to persist
  "room-layout": { key: LocationKey; items: RoomItemDTO[] };
};

export const gameBus: Emitter<GameEvents> = mitt<GameEvents>();
