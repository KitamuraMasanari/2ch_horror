import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { EpisodeData, PostMetadata } from "../types/episode";
import { ResPost } from "./ResPost";
import { BackgroundImage } from "./BackgroundImage";
import { VignetteOverlay } from "./VignetteOverlay";
import { NoiseOverlay } from "./NoiseOverlay";
import { FloatingParticles } from "./FloatingParticles";
import { COLORS, DESIGN } from "../constants/design";

interface BoardProps {
  episodeId: string;
  episode: EpisodeData;
  posts: PostMetadata[];
}

/**
 * モダンホラー風ボード — 「進化したまーくん」スタイル。
 *
 * レイヤー構成:
 * 1. モノクロ背景画像（静止）
 * 2. ビネット
 * 3. ノイズオーバーレイ
 * 4. 浮遊パーティクル
 * 5. 左上タイトルラベル
 * 6. 中央テキストボックス（ResPost）
 * 7. レス情報ヘッダー（ResPost内）
 */
export const Board: React.FC<BoardProps> = ({ episodeId, episode, posts }) => {
  const opId = episode.threads.length > 0 ? episode.threads[0].id : "";

  return (
    <AbsoluteFill>
      {/* Layer 1: モノクロ背景画像 */}
      <BackgroundImage episodeId={episodeId} />

      {/* Layer 2: ビネット */}
      <VignetteOverlay />

      {/* Layer 3: ノイズオーバーレイ */}
      <NoiseOverlay />

      {/* Layer 4: 浮遊パーティクル */}
      <FloatingParticles />

      {/* Layer 5: 左上タイトルラベル */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          padding: "8px 16px",
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: 6,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: DESIGN.FONT_FAMILY,
            fontSize: DESIGN.TITLE_FONT_SIZE,
            fontWeight: 700,
            color: COLORS.TEXT_TITLE,
            textShadow: "0 0 8px rgba(200, 0, 0, 0.4)",
          }}
        >
          {episode.title}
        </span>
      </div>

      {/* Layer 6 & 7: 各レスをSequenceで1つずつ表示 */}
      {episode.threads.map((thread, index) => {
        const postMeta = posts[index];
        if (!postMeta) return null;

        return (
          <Sequence
            key={thread.number}
            from={postMeta.startFrame}
            durationInFrames={postMeta.durationInFrames}
          >
            <ResPost
              number={thread.number}
              name={thread.name}
              id={thread.id}
              date={thread.date}
              text={thread.text}
              effect={thread.effect}
              durationInFrames={postMeta.durationInFrames}
              isOp={thread.id === opId}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
