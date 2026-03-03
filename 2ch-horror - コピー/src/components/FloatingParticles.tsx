import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { DESIGN } from "../constants/design";

interface Particle {
  x: number;
  startY: number;
  size: number;
  opacity: number;
  speed: number;
}

/**
 * 浮遊パーティクル — ほこり/オーブ風の小さな光の粒。
 * ゆっくり上方向に漂うアニメーション。
 */
export const FloatingParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const particles = useMemo<Particle[]>(() => {
    const count = DESIGN.PARTICLE_COUNT;
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      // 擬似ランダム（seedベース）
      const seed = i * 137.5;
      result.push({
        x: ((seed * 7.3) % 100),
        startY: 60 + ((seed * 3.7) % 40),
        size: 2 + ((seed * 1.3) % 3),
        opacity: 0.1 + ((seed * 0.7) % 0.2),
        speed: 150 + ((seed * 2.1) % 100),
      });
    }
    return result;
  }, []);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const yOffset = interpolate(
          frame,
          [0, durationInFrames],
          [0, -p.speed],
          { extrapolateRight: "clamp" }
        );

        // 横方向の微揺れ
        const xWobble = Math.sin(frame * 0.02 + i * 2) * 15;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.startY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              opacity: p.opacity,
              transform: `translate(${xWobble}px, ${yOffset}px)`,
              boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,0.3)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
