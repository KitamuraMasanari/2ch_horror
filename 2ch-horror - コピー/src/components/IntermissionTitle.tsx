import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, DESIGN } from "../constants/design";
import { NoiseOverlay } from "./NoiseOverlay";
import { VignetteOverlay } from "./VignetteOverlay";

interface IntermissionTitleProps {
  title: string;
  board: string;
}

/**
 * エピソード間の区切り画面。
 * 2秒間の黒背景に次の話のタイトルを白文字でフェードイン→フェードアウト。
 */
export const IntermissionTitle: React.FC<IntermissionTitleProps> = ({
  title,
  board,
}) => {
  const frame = useCurrentFrame();

  // 60フレーム（2秒）の構成
  // 0-5: Black
  // 5-20: Title fade in
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 40-55: Fade out
  const fadeOut = interpolate(frame, [40, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const combinedOpacity = Math.min(titleOpacity, fadeOut);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BG_PRIMARY }}>
      <NoiseOverlay opacityOverride={0.03} />
      <VignetteOverlay strength={1.0} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          opacity: combinedOpacity,
        }}
      >
        <div
          style={{
            color: COLORS.TEXT_TITLE,
            fontSize: 48,
            fontWeight: 700,
            fontFamily: DESIGN.FONT_FAMILY,
            textShadow:
              "0 0 20px rgba(255,255,255,0.15), 0 0 40px rgba(255,255,255,0.05)",
            textAlign: "center",
            maxWidth: "85%",
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
