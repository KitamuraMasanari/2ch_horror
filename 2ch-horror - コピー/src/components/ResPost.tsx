import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { EffectType } from "../types/episode";
import { COLORS, DESIGN } from "../constants/design";
import { ResBody } from "./ResBody";
import { idToBorderColor, idToTextColor } from "../utils/color";

// テキストボックスの最大高さ（画面高さの60%）
const TEXTBOX_MAX_HEIGHT = Math.floor(
  (DESIGN.HEIGHT * DESIGN.TEXTBOX_MAX_HEIGHT_PERCENT) / 100
);
// padding上下 + ヘッダー行(約48px) + margin(18px) を引いた本文の可視領域
const VISIBLE_HEIGHT = TEXTBOX_MAX_HEIGHT - 80 - 66; // padding 40*2 + header~48+18

// === テキスト高さ推定用の定数 ===
const LINE_HEIGHT_PX = DESIGN.BODY_FONT_SIZE * DESIGN.BODY_LINE_HEIGHT; // 34 * 1.9 = 64.6
const BOX_WIDTH_PX = DESIGN.WIDTH * (DESIGN.TEXTBOX_WIDTH_PERCENT / 100); // 1382.4
const PADDING_LR = 50; // TEXTBOX_PADDING '40px 50px' の左右
const CONTENT_WIDTH = BOX_WIDTH_PX - PADDING_LR * 2; // 1282.4
const CHARS_PER_LINE = Math.floor(CONTENT_WIDTH / DESIGN.BODY_FONT_SIZE); // ≈37

/**
 * テキストの行数を推定する（改行 + 折り返し考慮）。
 */
function estimateLineCount(t: string): number {
  return t.split('\n').reduce((count, line) => {
    if (line === '') return count + 1;
    return count + Math.ceil(Math.max(1, line.length) / CHARS_PER_LINE);
  }, 0);
}

interface ResPostProps {
  number: number;
  name: string;
  id: string;
  date: string;
  text: string;
  effect: EffectType | null;
  durationInFrames: number;
  isOp: boolean;
}

/**
 * モダンホラー風レス表示コンポーネント。
 *
 * - ヘッダー行はテキストボックス内部（2ch掲示板準拠レイアウト）
 * - スライドインで出現、フェードアウトで消去
 * - shake / slowtype は廃止（無視）
 */
export const ResPost: React.FC<ResPostProps> = ({
  number: resNumber,
  name,
  id,
  date,
  text,
  effect,
  durationInFrames,
  isOp,
}) => {
  const frame = useCurrentFrame();

  // slowtype, shake は廃止 → 無視
  const activeEffect =
    effect === "slowtype" || effect === "shake" ? null : effect;

  // ID固有色
  const borderColor = idToBorderColor(id);
  const idColor = idToTextColor(id);

  // スライドインで出現（下から上へ）
  const slideIn = interpolate(
    frame,
    [0, 12],
    [80, 0],
    { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );
  const fadeIn = interpolate(
    frame,
    [0, 8],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // フェードアウト（末尾 8 フレーム）
  const fadeOutStart = durationInFrames - DESIGN.RES_FADE_OUT_FRAMES;
  const fadeOut = interpolate(
    frame,
    [fadeOutStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // === 長文自動スクロール（計算ベース・音声同期） ===
  // テキスト高さを推定し、可視領域を超えた瞬間からスクロール開始。
  // 音声の読み上げペースに合わせて線形にスクロールし、90%地点で完了。
  const scrollParams = useMemo(() => {
    const totalLineCount = estimateLineCount(text);
    const totalTextHeight = totalLineCount * LINE_HEIGHT_PX;
    const needsScroll = totalTextHeight > VISIBLE_HEIGHT;
    const maxScroll = Math.max(0, totalTextHeight - VISIBLE_HEIGHT);

    // タイピング完了フレーム（70%地点）
    const typingEndFrame = Math.floor(durationInFrames * 0.7);

    // スクロール開始フレーム: テキスト高さが可視領域を超えた瞬間
    let scrollStartFrame = typingEndFrame;
    if (needsScroll) {
      const maxVisibleLines = Math.floor(VISIBLE_HEIGHT / LINE_HEIGHT_PX);
      const visibleRatio = maxVisibleLines / totalLineCount;
      scrollStartFrame = Math.floor(typingEndFrame * Math.min(1, visibleRatio));
    }

    // スクロール終了フレーム: durationの90%（残り10%は全文静止表示）
    const scrollEndFrame = Math.floor(durationInFrames * 0.90);

    return { needsScroll, maxScroll, scrollStartFrame, scrollEndFrame };
  }, [text, durationInFrames]);

  // スクロール量（小数のまま渡す — サブピクセルレンダリングで滑らか）
  const scrollTranslateY =
    scrollParams.needsScroll && frame >= scrollParams.scrollStartFrame
      ? -interpolate(
          frame,
          [scrollParams.scrollStartFrame, scrollParams.scrollEndFrame],
          [0, scrollParams.maxScroll],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        )
      : 0;

  // Glitch エフェクト（0.5〜1秒間隔で0.1秒間グリッチ）
  const glitchCycle = Math.floor(frame / 20) % 3;
  const glitchLocalFrame = frame % 20;
  const isGlitching =
    activeEffect === "glitch" && glitchCycle === 0 && glitchLocalFrame < 3;
  const glitchSkew = isGlitching
    ? `skewX(${Math.sin(frame * 3) * 2}deg)`
    : "";

  // Redtext スタイル
  const isRedtext = activeEffect === "redtext";
  const boxBg = isRedtext ? COLORS.REDTEXT_BG : COLORS.TEXTBOX_BG;
  const boxBorder = isRedtext
    ? `2px solid ${COLORS.REDTEXT_BORDER}`
    : `2px solid ${COLORS.TEXTBOX_BORDER}`;
  const textColor = isRedtext ? COLORS.REDTEXT_COLOR : COLORS.TEXT_PRIMARY;

  const boxWidth = `${DESIGN.TEXTBOX_WIDTH_PERCENT}%`;
  const displayName = name || "名無しさん＠おーぷん";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `translateY(${slideIn}px) ${glitchSkew}`,
        pointerEvents: "none",
      }}
    >
      {/* テキストボックス（ヘッダー内部） */}
      <div
        style={{
          width: boxWidth,
          maxHeight: TEXTBOX_MAX_HEIGHT,
          background: boxBg,
          borderRadius: DESIGN.TEXTBOX_BORDER_RADIUS,
          border: boxBorder,
          boxShadow: COLORS.TEXTBOX_SHADOW,
          padding: DESIGN.TEXTBOX_PADDING,
          overflow: "hidden",
          position: "relative",
          borderLeft: `4px solid ${borderColor}`,
        }}
      >
        {/* Glitch: RGBずれオーバーレイ */}
        {isGlitching && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,0,0,0.05)",
                transform: `translateX(${Math.sin(frame * 2.7) * 4}px)`,
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,255,255,0.05)",
                transform: `translateX(${-Math.sin(frame * 2.7) * 4}px)`,
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* ヘッダー行（テキストボックス内部、2ch掲示板準拠） */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 0,
            marginBottom: 18,
            flexShrink: 0,
            fontFamily: DESIGN.FONT_FAMILY,
            flexWrap: "wrap",
          }}
        >
          {/* レス番号 — ID固有色・太字 */}
          <span
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: idColor,
              marginRight: 16,
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {resNumber}
          </span>

          {/* 名前 — 緑・太字 */}
          <span
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: "#6B9F6B",
              marginRight: 16,
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {displayName}
          </span>

          {/* 日付 — グレー */}
          <span
            style={{
              fontSize: 23,
              fontWeight: 400,
              color: "rgba(255,255,255,0.45)",
              marginRight: 16,
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {date}
          </span>

          {/* ID — ID固有色 */}
          <span
            style={{
              fontSize: 23,
              fontWeight: 400,
              color: idColor,
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            ID:{id}
          </span>
        </div>

        {/* テキスト表示エリア */}
        <div style={{ maxHeight: VISIBLE_HEIGHT, overflow: "hidden" }}>
          <div
            style={{
              transform: `translateY(${scrollTranslateY}px)`,
              willChange: "transform",
            }}
          >
            <ResBody
              text={text}
              effect={activeEffect}
              localFrame={frame}
              durationInFrames={durationInFrames}
              textColor={textColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
