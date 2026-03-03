import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../constants/design";

interface NoiseOverlayProps {
  opacityOverride?: number;
}

/**
 * フィルムグレイン風ノイズオーバーレイ。
 * SVG feTurbulence でノイズを生成し、mix-blend-mode: overlay で合成。
 */
export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({
  opacityOverride,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3);
  const opacity = opacityOverride ?? COLORS.NOISE_OPACITY;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id={`noise-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            seed={seed}
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#noise-${seed})`}
        />
      </svg>
    </AbsoluteFill>
  );
};
