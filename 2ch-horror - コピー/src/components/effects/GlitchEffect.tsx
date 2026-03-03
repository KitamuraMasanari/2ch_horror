import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface GlitchEffectProps {
  startFrame: number;
  durationFrames?: number;
}

/**
 * リッチなグリッチエフェクト
 * - RGBチャンネル分離（SVGフィルタ）
 * - ノイズバー
 * - 赤い微フラッシュ
 */
export const GlitchEffect: React.FC<GlitchEffectProps> = ({
  startFrame,
  durationFrames = 15,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame >= durationFrames) return null;

  const intensity = Math.sin((localFrame / durationFrames) * Math.PI);

  // RGB分離量
  const splitAmount = 6 * intensity;
  const offsetR = Math.sin(localFrame * 2.7) * splitAmount;
  const offsetG = Math.cos(localFrame * 3.1) * splitAmount * 0.7;
  const offsetB = Math.sin(localFrame * 1.9) * splitAmount * 1.2;

  // ジッター（画面のぶれ）
  const jitterX = Math.sin(localFrame * 7.3) * 2 * intensity;
  const jitterY = Math.cos(localFrame * 5.1) * 2 * intensity;

  // ノイズバー
  const bars = Array.from({ length: 8 }, (_, i) => ({
    top: ((localFrame * 37 + i * 197) % 100),
    height: 1 + (i % 4) * 2,
    opacity: (0.15 + (i % 3) * 0.1) * intensity,
    offset: Math.sin(localFrame * 3 + i) * 20,
  }));

  // 赤い微フラッシュ（エフェクト開始直後に強い）
  const flashOpacity = interpolate(localFrame, [0, 3, durationFrames], [0.08, 0.05, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 100,
        transform: `translate(${jitterX}px, ${jitterY}px)`,
      }}
    >
      {/* RGB channel shift overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,0,0,0.06)",
          transform: `translateX(${offsetR}px)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,255,0,0.04)",
          transform: `translateX(${offsetG}px)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,255,0.06)",
          transform: `translateX(${offsetB}px)`,
          mixBlendMode: "screen",
        }}
      />

      {/* Noise bars */}
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${bar.top}%`,
            left: bar.offset,
            right: -bar.offset,
            height: `${bar.height}px`,
            backgroundColor: `rgba(255,255,255,${bar.opacity})`,
          }}
        />
      ))}

      {/* 赤い微フラッシュ */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(200, 0, 0, ${flashOpacity})`,
        }}
      />
    </AbsoluteFill>
  );
};
