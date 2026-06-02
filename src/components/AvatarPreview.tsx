import type { Appearance } from "@/lib/zod-schemas";

const SKIN: Record<Appearance["body"], string> = {
  light: "#f2c9a0",
  tan: "#d6a06a",
  dark: "#8d5a3b",
};

// A lightweight HTML/CSS approximation of the in-game pixel avatar. Used in the
// HUD and the character creator so the chosen look is visible outside Phaser.
export default function AvatarPreview({
  appearance,
  size = 64,
}: {
  appearance: Appearance;
  size?: number;
}) {
  const u = size / 24; // unit ≈ one "pixel block"
  const skin = SKIN[appearance.body];
  const px = (n: number) => `${n * u}px`;

  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0"
      aria-hidden
    >
      {/* head */}
      <div
        style={{ left: px(7), top: px(2), width: px(10), height: px(9), background: skin }}
        className="absolute rounded-[2px]"
      />
      {/* hair */}
      <div
        style={{
          left: px(6),
          top: px(1),
          width: px(12),
          height: appearance.hair === "buzz" ? px(3) : px(5),
          background: appearance.hairColor,
        }}
        className="absolute rounded-[2px]"
      />
      {appearance.hair === "ponytail" && (
        <div
          style={{ left: px(17), top: px(4), width: px(3), height: px(8), background: appearance.hairColor }}
          className="absolute rounded-[2px]"
        />
      )}
      {/* eyes */}
      <div style={{ left: px(9), top: px(6), width: px(2), height: px(2) }} className="absolute bg-[#222]" />
      <div style={{ left: px(13), top: px(6), width: px(2), height: px(2) }} className="absolute bg-[#222]" />
      {/* torso */}
      <div
        style={{ left: px(6), top: px(11), width: px(12), height: px(9), background: appearance.outfitColor }}
        className="absolute rounded-[2px]"
      />
      {/* arms */}
      <div style={{ left: px(3), top: px(12), width: px(3), height: px(7), background: appearance.outfitColor }} className="absolute rounded-[2px]" />
      <div style={{ left: px(18), top: px(12), width: px(3), height: px(7), background: appearance.outfitColor }} className="absolute rounded-[2px]" />
      {/* legs */}
      <div style={{ left: px(7), top: px(20), width: px(4), height: px(4), background: "#2c3142" }} className="absolute rounded-[1px]" />
      <div style={{ left: px(13), top: px(20), width: px(4), height: px(4), background: "#2c3142" }} className="absolute rounded-[1px]" />
    </div>
  );
}
