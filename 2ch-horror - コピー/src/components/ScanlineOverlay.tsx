import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, DESIGN } from "../constants/design";

interface ScanlineOverlayProps {
  intensityOverride?: number; // 0-1, エフェクト発動時に上書き
  thickLines?: boolean; // エフェクト復帰時用
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
  intensityOverride,
  thickLines = false,
}) => {
  const frame = useCurrentFrame();

  const opacity = intensityOverride ?? 0.4;
  const lineSpacing = thickLines ? 6 : 3;

  // CRT光の帯: 15秒(450フレーム)周期で上から下に流れる
  const cycleFrames = DESIGN.FPS * 15;
  const lightBarProgress = (frame % cycleFrames) / cycleFrames;
  const lightBarY = interpolate(lightBarProgress, [0, 1], [-60, DESIGN.HEIGHT + 60]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* スキャンライン */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            ${COLORS.SCANLINE} 0px,
            ${COLORS.SCANLINE} 1px,
            transparent 1px,
            transparent ${lineSpacing}px
          )`,
          opacity,
        }}
      />
      {/* CRT光の帯 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: lightBarY,
          height: 60,
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.02), transparent)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
