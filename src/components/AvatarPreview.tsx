"use client";

import { useEffect, useState } from "react";
import { layerUrls, LAYER_ORDER, FRAME, WALK_ROWS, type AvatarConfig, type Dir } from "@/lib/game/avatar";

// Renders the real LPC pixel avatar by stacking the layer spritesheets and
// showing a single frame via CSS background-position. `animated` cycles the
// walk frames for a lively character-creator preview.
export default function AvatarPreview({
  appearance,
  size = 96,
  dir = "down",
  animated = false,
}: {
  appearance: AvatarConfig;
  size?: number;
  dir?: Dir;
  animated?: boolean;
}) {
  const urls = layerUrls(appearance);
  const scale = size / FRAME;
  const row = WALK_ROWS[dir];
  const [col, setCol] = useState(0); // 0 = idle, 1..8 = walk cycle

  useEffect(() => {
    if (!animated) {
      setCol(0);
      return;
    }
    let raf = 0;
    let last = 0;
    let step = 0;
    const loop = (t: number) => {
      if (t - last > 130) {
        last = t;
        step = (step + 1) % 8;
        setCol(1 + step);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animated, dir]);

  const bgX = -col * FRAME;
  const bgY = -row * FRAME;

  return (
    <div style={{ width: size, height: size }} className="relative shrink-0" aria-hidden>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME,
          height: FRAME,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {LAYER_ORDER.map((layer, i) => (
          <div
            key={layer}
            style={{
              position: "absolute",
              inset: 0,
              width: FRAME,
              height: FRAME,
              backgroundImage: `url(${urls[layer]})`,
              backgroundPosition: `${bgX}px ${bgY}px`,
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
              zIndex: i,
            }}
          />
        ))}
      </div>
    </div>
  );
}
