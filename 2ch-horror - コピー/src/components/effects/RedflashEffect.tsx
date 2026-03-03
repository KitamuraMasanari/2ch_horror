import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface RedflashEffectProps {
  startFrame: number;
  durationInFrames: number;
}

/**
 * レッドフラッシュエフェクト。
 * レス開始時に1回、中間で1回の計2回フラッシュ。
 */
export const RedflashEffect: React.FC<RedflashEffectProps> = ({
  startFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  // 1回目のフラッシュ: レス開始時
  const flash1 = interpolate(
    localFrame,
    [0, 5, 15],
    [0, 0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 2回目のフラッシュ: 中間
  const midPoint = Math.floor(durationInFrames / 2);
  const flash2 = interpolate(
    localFrame,
    [midPoint, midPoint + 5, midPoint + 15],
    [0, 0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.max(flash1, flash2);
  if (opacity <= 0) return null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(255, 0, 0, ${opacity})`,
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
};
