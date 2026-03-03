import React from "react";
import { useCurrentFrame } from "remotion";
import styles from "../styles/board.module.css";
import type { PostMetadata } from "../types/episode";
import type { EpisodeData } from "../types/episode";
import { ResPost } from "./ResPost";

interface ScrollContainerProps {
  episode: EpisodeData;
  posts: PostMetadata[];
}

/**
 * チャットエリア。
 * chatLane は中央に幅制限（82% / max 1050px）された「道」で、
 * 各レスが Flexbox の align-self で左右に振り分けられる。
 * position: absolute + bottom: 0 で新着レスが下から積み上がる。
 */
export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  episode,
  posts,
}) => {
  const frame = useCurrentFrame();

  // スレ主のIDを特定（最初のレスの投稿者）
  const opId = episode.threads[0]?.id ?? "";

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.chatLane}>
        {episode.threads.map((thread, index) => {
          const postMeta = posts[index];
          if (!postMeta) return null;

          return (
            <ResPost
              key={thread.number}
              number={thread.number}
              name={thread.name}
              id={thread.id}
              date={thread.date}
              text={thread.text}
              effect={thread.effect}
              appearFrame={postMeta.startFrame}
              durationInFrames={postMeta.durationInFrames}
              isOp={thread.id === opId}
            />
          );
        })}
      </div>
    </div>
  );
};
