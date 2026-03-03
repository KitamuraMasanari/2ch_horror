import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Board } from "../components/Board";
import { TitleScreen } from "../components/TitleScreen";
import { EndingScreen } from "../components/EndingScreen";
import { RedflashEffect } from "../components/effects/RedflashEffect";
import { DESIGN, COLORS } from "../constants/design";
import type { EpisodeData, EpisodeMetadata } from "../types/episode";

export interface ThreadVideoProps {
  episodeId: string;
  episode: EpisodeData;
  metadata: EpisodeMetadata;
}

export const ThreadVideo: React.FC<ThreadVideoProps> = ({
  episodeId,
  episode,
  metadata,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleDuration = DESIGN.TITLE_DURATION_FRAMES;
  const endingStart = durationInFrames - DESIGN.ENDING_DURATION_FRAMES;

  // BGMボリューム（2段階：タイトルカード → 本編以降は一律固定）
  // エフェクト（glitch, redflash, redtext等）による音量変化は行わない
  const titleVolume = episode.volume?.bgm ?? DESIGN.BGM_VOLUME;
  const mainVolume = DESIGN.BGM_VOLUME_MAIN;
  const titleCardEndFrame = titleDuration;
  const bgmVolume = (() => {
    if (frame < titleCardEndFrame) {
      return titleVolume; // タイトル画面：現状維持
    }
    if (frame < titleCardEndFrame + 15) {
      // 0.5秒（15フレーム@30fps）かけてフェードダウン
      return interpolate(
        frame,
        [titleCardEndFrame, titleCardEndFrame + 15],
        [titleVolume, mainVolume],
        { extrapolateRight: "clamp" }
      );
    }
    return mainVolume; // 本編以降：一律固定
  })();

  const bgmFile = episode.bgm || "horror_ambient.mp3";

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BG_PRIMARY }}>
      {/* BGM（フレーム0から開始） */}
      <Sequence from={0}>
        <Audio
          src={staticFile(`bgm/${bgmFile}`)}
          volume={bgmVolume}
          loop
        />
      </Sequence>

      {/* === タイトルシーケンス === */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <TitleScreen title={episode.title} board={episode.board} />
      </Sequence>

      {/* === メインコンテンツ（モダンホラー風ボード） === */}
      <Sequence from={titleDuration} durationInFrames={endingStart - titleDuration}>
        <Board episodeId={episodeId} episode={episode} posts={metadata.posts} />
      </Sequence>

      {/* レス音声 - 絶対フレームで個別配置 */}
      {metadata.posts.map((post) => {
        const absoluteStart = titleDuration + post.startFrame;
        return (
          <Sequence
            key={`audio-${post.number}`}
            from={absoluteStart}
            durationInFrames={post.durationInFrames}
          >
            <Audio
              src={staticFile(post.audioFile)}
              volume={episode.volume?.voice ?? DESIGN.RES_AUDIO_VOLUME}
            />
            <Audio
              src={staticFile("se/res_appear.mp3")}
              volume={episode.volume?.se ?? DESIGN.RES_APPEAR_SE_VOLUME}
            />
          </Sequence>
        );
      })}

      {/* レッドフラッシュエフェクト */}
      {metadata.posts
        .filter((p) => p.effect === "redflash")
        .map((post) => (
          <RedflashEffect
            key={`redflash-${post.number}`}
            startFrame={titleDuration + post.startFrame}
            durationInFrames={post.durationInFrames}
          />
        ))}

      {/* === エンディング === */}
      <Sequence from={endingStart} durationInFrames={DESIGN.ENDING_DURATION_FRAMES}>
        <EndingScreen />
      </Sequence>
    </AbsoluteFill>
  );
};
