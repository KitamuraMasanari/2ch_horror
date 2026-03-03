import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, DESIGN } from "../constants/design";
import { VignetteOverlay } from "./VignetteOverlay";
import { TVStatic } from "./TVStatic";

/**
 * エンディング画面 — モダンホラー版。
 * 砂嵐＋走査線付き。「続きはまた…」は赤文字。
 */
export const EndingScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  // テキスト表示: フレーム 15-30でフェードイン、110-130でフェードアウト
  const textOpacity = interpolate(
    frame,
    [15, 30, 110, 130],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // フレーム 120-150: 画面が暗くなる → 完全な黒
  const darkOverlay = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 走査線: 上から下に移動
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
      <VignetteOverlay strength={1.3} />

      {/* テキスト（砂嵐の上） */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            color: COLORS.ACCENT_RED,
            fontSize: 42,
            fontFamily: DESIGN.FONT_FAMILY,
            fontWeight: 700,
            textShadow:
              "0 0 10px rgba(200, 0, 0, 0.5), 0 0 30px rgba(200, 0, 0, 0.2)",
          }}
        >
          続きはまた…
        </div>
        <div
          style={{
            color: COLORS.TEXT_SECONDARY,
            fontSize: 26,
            fontFamily: DESIGN.FONT_FAMILY,
          }}
        >
          チャンネル登録・高評価お願いします
        </div>
      </AbsoluteFill>

      {/* 暗転オーバーレイ */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.BG_PRIMARY,
          opacity: darkOverlay,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
