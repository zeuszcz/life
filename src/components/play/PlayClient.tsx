"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { gameBus } from "@/lib/event-bus";
import { useGameStore } from "@/lib/store";
import { LOCATION_META } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";
import type { Appearance } from "@/lib/zod-schemas";
import Hud from "./Hud";
import Toasts from "./Toasts";
import LocationPanel from "./LocationPanel";
import RoadmapModal from "./RoadmapModal";
import ShopModal from "./ShopModal";
import LogRealModal from "./LogRealModal";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
      Загружаем мир…
    </div>
  ),
});

type Modal = "roadmap" | "shop" | "log" | null;

export default function PlayClient({
  initialPlay,
  appearance,
}: {
  initialPlay: PlayState;
  appearance: Appearance;
}) {
  const setPlay = useGameStore((s) => s.setPlay);
  const setNear = useGameStore((s) => s.setNearLocation);
  const setOpen = useGameStore((s) => s.setOpenLocation);
  const nearLocation = useGameStore((s) => s.nearLocation);
  const openLocation = useGameStore((s) => s.openLocation);
  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => {
    setPlay(initialPlay);
  }, [initialPlay, setPlay]);

  useEffect(() => {
    const onNear = ({ key }: { key: keyof typeof LOCATION_META }) => setNear(key);
    const onLeave = () => setNear(null);
    const onOpen = ({ key }: { key: keyof typeof LOCATION_META }) => setOpen(key);
    gameBus.on("near-location", onNear);
    gameBus.on("leave-location", onLeave);
    gameBus.on("open-location", onOpen);
    return () => {
      gameBus.off("near-location", onNear);
      gameBus.off("leave-location", onLeave);
      gameBus.off("open-location", onOpen);
    };
  }, [setNear, setOpen]);

  // Freeze the avatar while any overlay is open.
  const overlayOpen = !!openLocation || modal !== null;
  useEffect(() => {
    gameBus.emit("set-input-enabled", { enabled: !overlayOpen });
  }, [overlayOpen]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <GameCanvas appearance={appearance} />
      </div>

      <Hud
        appearance={appearance}
        onOpenRoadmap={() => setModal("roadmap")}
        onOpenShop={() => setModal("shop")}
        onOpenLog={() => setModal("log")}
      />

      {nearLocation && !openLocation && modal === null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-30 flex justify-center">
          <div className="panel px-4 py-2 text-sm">
            Нажми <kbd className="pixel rounded bg-[var(--surface-2)] px-1.5">E</kbd> — войти в{" "}
            <b>
              {LOCATION_META[nearLocation].icon} {LOCATION_META[nearLocation].label}
            </b>
          </div>
        </div>
      )}

      {openLocation && <LocationPanel locationKey={openLocation} onClose={() => setOpen(null)} />}
      {modal === "roadmap" && <RoadmapModal onClose={() => setModal(null)} />}
      {modal === "shop" && <ShopModal onClose={() => setModal(null)} />}
      {modal === "log" && <LogRealModal onClose={() => setModal(null)} />}

      <Toasts />
    </div>
  );
}
