import React from "react";
import styles from "../styles/board.module.css";
import { DESIGN } from "../constants/design";

interface ThreadHeaderProps {
  title: string;
  board: string;
}

/**
 * タイトル文字数に応じてフォントサイズを自動計算し、
 * 必ず1行に収まるようにする。
 *
 * CJK文字は約 1em 幅、半角文字は約 0.6em 幅として
 * 実効文字幅を算出し、コンテナ幅から最適サイズを逆算する。
 */
function calcTitleFontSize(title: string): number {
  const MAX_SIZE = 44;
  const MIN_SIZE = 22;

  // コンテナ幅 = 画面幅（boardInner 100%）- threadTitleWrap の左右padding 80px
  const containerWidth = DESIGN.WIDTH - 80;

  // 実効文字幅を計算（CJK=1.0, ASCII/半角=0.55）
  let effectiveChars = 0;
  for (const ch of title) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x7f) {
      effectiveChars += 1.0;  // 全角（日本語・記号）
    } else {
      effectiveChars += 0.55; // 半角（英数字）
    }
  }

  // font-weight:700 + letter-spacing:1px の補正係数
  const boldFactor = 1.08;
  const calculated = Math.floor(containerWidth / (effectiveChars * boldFactor));

  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, calculated));
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({ title, board }) => {
  const fontSize = calcTitleFontSize(title);

  return (
    <>
      <div className={styles.headerBar}>
        <span className={styles.boardName}>{board}</span>
      </div>
      <div className={styles.threadTitleWrap}>
        <div
          className={styles.threadTitle}
          style={{ fontSize }}
        >
          {title}
        </div>
      </div>
    </>
  );
};
