import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, DESIGN } from "../constants/design";
import { NoiseOverlay } from "./NoiseOverlay";
import { VignetteOverlay } from "./VignetteOverlay";
import { TVStatic } from "./TVStatic";

interface TitleScreenProps {
  title: string;
  board: string;
}

/**
 * オープニングタイトル画面 — モダンホラー版。
 * 黒背景に砂嵐＋走査線＋ビネットを重ね、タイトルを赤文字でフェードイン。
 */
export const TitleScreen: React.FC<TitleScreenProps> = ({ title, board }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  // フレーム 60-100: スレタイトルがフェードイン
  const titleOpacity = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 微かなスケールアニメーション
  const titleScale = interpolate(frame, [60, 100], [1.02, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // フレーム 100-140: 板名が表示
  const boardOpacity = interpolate(frame, [100, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // フレーム 200-240: 全体がフェードアウト
  const fadeOut = interpolate(frame, [200, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 走査線: 上から下に移動（約3.5秒で1ループ）
  const scanlineY = (frame * 3) % (height + 100);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BG_PRIMARY }}>
      {/* 砂嵐ノイズ（テキストの下） */}
      <TVStatic opacity={0.15} />

      {/* 走査線エフェクト */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: scanlineY - 100,
          height: 100,
          background:
            "linear-gradient(180deg, transparent, rgba(255,255,255,0.04) 50%, transparent)",
          pointerEvents: "none",
        }}
      />

      {/* ビネット */}
      <VignetteOverlay strength={1.2} />

      {/* コンテンツ（砂嵐の上） */}
      <AbsoluteFill
        style={{
          opacity: fadeOut,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* 板名 */}
        <div
          style={{
            opacity: boardOpacity,
            color: COLORS.ACCENT_RED,
            fontSize: 28,
            fontFamily: DESIGN.FONT_FAMILY,
            textShadow:
              "0 0 10px rgba(200, 0, 0, 0.5), 0 0 30px rgba(200, 0, 0, 0.2)",
          }}
        >
          {board}板
        </div>

        {/* スレタイトル */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            color: COLORS.TEXT_TITLE,
            fontSize: 48,
            fontWeight: 700,
            fontFamily: DESIGN.FONT_FAMILY,
            textShadow:
              "0 0 10px rgba(200, 0, 0, 0.5), 0 0 30px rgba(200, 0, 0, 0.2)",
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
