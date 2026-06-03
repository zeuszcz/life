"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { gameBus, type RoomItemDTO } from "@/lib/event-bus";
import { useGameStore } from "@/lib/store";
import { LOCATION_META, type LocationKey } from "@/lib/game/constants";
import type { PlayState } from "@/lib/types";
import type { Appearance } from "@/lib/zod-schemas";
import { getRoom, saveRoom } from "@/server/actions/rooms";
import { getDailyState } from "@/server/actions/daily";
import Hud from "./Hud";
import TodayModal from "./TodayModal";
import Toasts from "./Toasts";
import LocationPanel from "./LocationPanel";
import GoalsModal from "./GoalsModal";
import ShopModal from "./ShopModal";
import LogRealModal from "./LogRealModal";
import ProfileModal from "./ProfileModal";
import DecorateBar from "./DecorateBar";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
      Загружаем мир…
    </div>
  ),
});

type Modal = "today" | "goals" | "shop" | "log" | "profile" | null;

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
  const pushToast = useGameStore((s) => s.pushToast);
  const nearLocation = useGameStore((s) => s.nearLocation);
  const openLocation = useGameStore((s) => s.openLocation);
  const [modal, setModal] = useState<Modal>(null);
  const [inside, setInside] = useState<LocationKey | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setPlay(initialPlay);
  }, [initialPlay, setPlay]);

  // Daily check-in: auto-open "Today" on the first visit of the day.
  useEffect(() => {
    getDailyState()
      .then((s) => {
        if (!s.claimedToday) setModal("today");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onNear = ({ key }: { key: LocationKey }) => setNear(key);
    const onLeave = () => setNear(null);
    const onOpen = ({ key }: { key: LocationKey }) => setOpen(key);
    const onEnter = ({ key }: { key: LocationKey }) => {
      setInside(key);
      setNear(null);
      setHint(null);
      getRoom(key)
        .then((items) => gameBus.emit("load-room", { key, items }))
        .catch(() => {});
    };
    const onExit = () => {
      setInside(null);
      setEditMode(false);
      setHint(null);
      setOpen(null);
    };
    const onHint = ({ text }: { text: string | null }) => setHint(text);
    const onLayout = ({ key, items }: { key: LocationKey; items: RoomItemDTO[] }) => {
      saveRoom(key, items)
        .then(() => pushToast("Интерьер сохранён", "💾"))
        .catch(() => {});
    };

    gameBus.on("near-location", onNear);
    gameBus.on("leave-location", onLeave);
    gameBus.on("open-location", onOpen);
    gameBus.on("enter-interior", onEnter);
    gameBus.on("exit-interior", onExit);
    gameBus.on("interior-hint", onHint);
    gameBus.on("room-layout", onLayout);
    return () => {
      gameBus.off("near-location", onNear);
      gameBus.off("leave-location", onLeave);
      gameBus.off("open-location", onOpen);
      gameBus.off("enter-interior", onEnter);
      gameBus.off("exit-interior", onExit);
      gameBus.off("interior-hint", onHint);
      gameBus.off("room-layout", onLayout);
    };
  }, [setNear, setOpen, pushToast]);

  // Freeze movement while a quest/shop panel is open. (Edit mode handles its own
  // input gating inside Phaser and still needs pointer events for dragging.)
  const overlayOpen = !!openLocation || modal !== null;
  useEffect(() => {
    gameBus.emit("set-input-enabled", { enabled: !overlayOpen });
  }, [overlayOpen]);

  function startEdit() {
    setEditMode(true);
    gameBus.emit("set-edit-mode", { enabled: true });
  }
  function finishEdit(save: boolean) {
    if (save) gameBus.emit("save-room");
    setEditMode(false);
    gameBus.emit("set-edit-mode", { enabled: false });
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <GameCanvas appearance={appearance} />
      </div>

      {!editMode && (
        <Hud
          appearance={appearance}
          onOpenToday={() => setModal("today")}
          onOpenGoals={() => setModal("goals")}
          onOpenShop={() => setModal("shop")}
          onOpenLog={() => setModal("log")}
          onOpenProfile={() => setModal("profile")}
        />
      )}

      {/* Overworld: enter-building prompt */}
      {!inside && nearLocation && !openLocation && modal === null && (
        <Prompt>
          Нажми <Key>E</Key> — войти в{" "}
          <b>
            {LOCATION_META[nearLocation].icon} {LOCATION_META[nearLocation].label}
          </b>
        </Prompt>
      )}

      {/* Interior: interaction hint + decorate button */}
      {inside && !editMode && !openLocation && modal === null && (
        <>
          {hint && (
            <Prompt>
              Нажми <Key>E</Key> {hint.includes("задания") ? "— задания" : "— выйти"}
            </Prompt>
          )}
          <div className="pointer-events-none absolute bottom-20 left-3 z-30">
            <button className="btn pointer-events-auto" onClick={startEdit}>
              🛋 Обставить
            </button>
          </div>
        </>
      )}

      {editMode && (
        <DecorateBar
          onPlace={(k) => gameBus.emit("place-item", { itemKey: k })}
          onRemove={() => gameBus.emit("remove-selected")}
          onSave={() => finishEdit(true)}
          onCancel={() => finishEdit(false)}
        />
      )}

      {openLocation && <LocationPanel locationKey={openLocation} onClose={() => setOpen(null)} />}
      {modal === "today" && <TodayModal onClose={() => setModal(null)} />}
      {modal === "goals" && <GoalsModal onClose={() => setModal(null)} />}
      {modal === "shop" && <ShopModal onClose={() => setModal(null)} />}
      {modal === "log" && <LogRealModal onClose={() => setModal(null)} />}
      {modal === "profile" && <ProfileModal appearance={appearance} onClose={() => setModal(null)} />}

      <Toasts />
    </div>
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-30 flex justify-center">
      <div className="panel px-4 py-2 text-sm">{children}</div>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="pixel rounded bg-[var(--surface-2)] px-1.5">{children}</kbd>;
}
