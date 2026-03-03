import React from "react";
import { AbsoluteFill } from "remotion";

interface VignetteOverlayProps {
  strength?: number;
}

/**
 * ビネットオーバーレイ — 画面の四隅と端を暗くする。
 * radial-gradient で中央は透明、端は暗い。
 */
export const VignetteOverlay: React.FC<VignetteOverlayProps> = ({
  strength = 1.0,
}) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center, rgba(0, 0, 0, ${0.2 * strength}) 0%, rgba(0, 0, 0, ${0.55 * strength}) 50%, rgba(0, 0, 0, ${0.9 * strength}) 100%)`,
      }}
    />
  );
};
