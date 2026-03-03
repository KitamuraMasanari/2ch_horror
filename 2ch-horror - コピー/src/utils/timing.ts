import { DESIGN } from "../constants/design";
import type { EffectType, PostMetadata } from "../types/episode";

/**
 * エフェクトに応じたパディングフレーム数を返す
 */
export function getPaddingFrames(
  effect: EffectType | null,
  isLast: boolean
): number {
  if (isLast) return 90; // 最後のレス: 3秒の余韻

  switch (effect) {
    case "redflash":
      return 45; // 1.5秒（赤フラッシュ演出含む）
    case "shake":
      return 30; // 1.0秒
    default:
      return 15; // 0.5秒
  }
}

/**
 * 音声のミリ秒からフレーム数（パディング込み）を計算
 */
export function calculateDurationInFrames(
  audioDurationMs: number,
  effect: EffectType | null,
  isLast: boolean,
  fps: number = DESIGN.FPS
): number {
  const audioFrames = Math.ceil((audioDurationMs / 1000) * fps);
  const padding = getPaddingFrames(effect, isLast);
  return audioFrames + padding;
}

/**
 * 指定フレームで何番目のレスまで表示されているかを返す
 */
export function getVisiblePostCount(
  frame: number,
  posts: PostMetadata[],
  titleDuration: number = DESIGN.TITLE_DURATION_FRAMES
): number {
  const adjustedFrame = frame - titleDuration;
  if (adjustedFrame < 0) return 0;

  let count = 0;
  for (const post of posts) {
    if (adjustedFrame >= post.startFrame) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * 指定フレームで現在アクティブなレスのインデックスを返す (-1 = なし)
 */
export function getActivePostIndex(
  frame: number,
  posts: PostMetadata[],
  titleDuration: number = DESIGN.TITLE_DURATION_FRAMES
): number {
  const adjustedFrame = frame - titleDuration;
  if (adjustedFrame < 0) return -1;

  for (let i = posts.length - 1; i >= 0; i--) {
    const post = posts[i];
    if (
      adjustedFrame >= post.startFrame &&
      adjustedFrame < post.startFrame + post.durationInFrames
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * 指定フレームがエフェクト発動中かどうかを判定
 */
export function isEffectActive(
  frame: number,
  post: PostMetadata,
  titleDuration: number = DESIGN.TITLE_DURATION_FRAMES
): boolean {
  if (!post.effect) return false;
  const adjustedFrame = frame - titleDuration;
  const localFrame = adjustedFrame - post.startFrame;
  // エフェクトはレス表示開始から発動
  return localFrame >= 0 && localFrame < post.durationInFrames;
}
