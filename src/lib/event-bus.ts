import mitt, { type Emitter } from "mitt";
import type { LocationKey } from "@/lib/game/constants";

// Typed event bus bridging the Phaser world and the React UI. The Phaser scene
// emits world events; React listens and opens panels, and vice versa.
export type GameEvents = {
  /** Player walked into a building's trigger zone. */
  "near-location": { key: LocationKey };
  /** Player left the trigger zone. */
  "leave-location": { key: LocationKey };
  /** Player pressed the interact key while near a building. */
  "open-location": { key: LocationKey };
  /** Phaser finished booting the world. */
  "game-ready": void;
  /** React asks Phaser to (un)pause input (e.g. while a modal is open). */
  "set-input-enabled": { enabled: boolean };
};

export const gameBus: Emitter<GameEvents> = mitt<GameEvents>();
