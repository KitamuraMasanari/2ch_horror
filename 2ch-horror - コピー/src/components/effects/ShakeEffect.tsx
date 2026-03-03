import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface ShakeEffectProps {
  startFrame: number;
  durationFrames?: number;
  children: React.ReactNode;
}

/**
 * リッチなシェイクエフェクト
 * - 画面振動
 * - brightness振動
 */
export const ShakeEffect: React.FC<ShakeEffectProps> = ({
  startFrame,
  durationFrames = 18,
  children,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationFrames) {
    return <>{children}</>;
  }

  const progress = localFrame / durationFrames;
  const envelope = Math.sin(progress * Math.PI);

  // 振動
  const shakeX = interpolate(
    localFrame % 4,
    [0, 1, 2, 3],
    [0, -8, 5, -3]
  ) * envelope;
  const shakeY = interpolate(
    localFrame % 4,
    [0, 1, 2, 3],
    [0, 4, -6, 2]
  ) * envelope;

  // brightness振動
  const brightness = interpolate(
    localFrame % 3,
    [0, 1, 2],
    [0.95, 1.1, 0.9]
  );

  return (
    <div
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px)`,
        filter: `brightness(${brightness})`,
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
};
