import React from "react";
import type { EffectType } from "../types/episode";
import { DESIGN } from "../constants/design";

interface ResBodyProps {
  text: string;
  effect: EffectType | null;
  localFrame: number;
  durationInFrames: number;
  textColor: string;
}

/**
 * レス本文コンポーネント — モダンホラー版。
 *
 * 全レスにタイピングアニメーションを適用。
 * - 句読点・改行で自然な一時停止
 * - 音声長に合わせた速度調整
 * - カーソル表示なし
 * - 安価リンク（>>数字）のハイライト
 * - 数字部分は太字
 */
export const ResBody: React.FC<ResBodyProps> = ({
  text,
  effect,
  localFrame,
  durationInFrames,
  textColor,
}) => {
  // テキストをパースして安価リンクと数字をハイライト
  const renderText = (content: string) => {
    const parts = content.split(/(>>?\d+)/g);
    return parts.map((part, i) => {
      if (/^>>?\d+$/.test(part)) {
        return (
          <span key={i} style={{ color: "#5c8cc6", textDecoration: "underline" }}>
            {part}
          </span>
        );
      }
      // 数字部分を太字にする
      const subParts = part.split(/(\d+)/g);
      return subParts.map((sub, j) => {
        if (/^\d+$/.test(sub)) {
          return (
            <span key={`${i}-${j}`} style={{ fontWeight: 700 }}>
              {sub}
            </span>
          );
        }
        return <React.Fragment key={`${i}-${j}`}>{sub}</React.Fragment>;
      });
    });
  };

  // ===== 全レス共通: タイピングアニメーション =====
  // シンプルに先頭から末尾まで一方向にタイピング（単調増加のみ、絶対に減らない）
  const totalChars = text.length;

  // 音声の70%時点で全文字を打ち終わり、残り30%は全文表示で静止
  const typingDuration = Math.floor(durationInFrames * 0.7);

  // Math.floorで単調増加を保証（Math.roundは値が前後する可能性あり）
  const visibleCharCount = Math.min(
    totalChars,
    Math.floor((localFrame / typingDuration) * totalChars)
  );
  const displayText = text.slice(0, visibleCharCount);

  return (
    <div
      style={{
        fontFamily: DESIGN.FONT_FAMILY,
        fontSize: DESIGN.BODY_FONT_SIZE,
        lineHeight: DESIGN.BODY_LINE_HEIGHT,
        fontWeight: DESIGN.BODY_FONT_WEIGHT,
        color: textColor,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        letterSpacing: "0.5px",
        textShadow: "2px 2px 4px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.5)",
      }}
    >
      {renderText(displayText)}
    </div>
  );
};

