import React from "react";
import { IntermissionTitle } from "./components/IntermissionTitle";
import { Composition } from "remotion";
import { ThreadVideo, ThreadVideoProps } from "./compositions/ThreadVideo";
import { DESIGN } from "./constants/design";
import type { EpisodeData, EpisodeMetadata } from "./types/episode";

// デフォルトのサンプルメタデータ（Studioプレビュー用）
const sampleEpisode: EpisodeData = {
  title: "【閲覧注意】引っ越した先の部屋が明らかにおかしい",
  board: "オカルト超常現象",
  threads: [
    {
      number: 1,
      name: "名無しさん@おーぷん",
      id: "aB3xK9pQ",
      date: "2024/11/15(金) 23:14:02",
      text: "先月引っ越したんだけど、この部屋なんかおかしい。\n夜中になると壁の向こうから音がするんだが\n隣は空室のはずなんだよ。",
      effect: null,
    },
    {
      number: 2,
      name: "名無しさん@おーぷん",
      id: "xP7mR2wL",
      date: "2024/11/15(金) 23:16:45",
      text: ">>1\nどんな音？ラップ音とか？",
      effect: null,
    },
    {
      number: 3,
      name: "名無しさん@おーぷん",
      id: "aB3xK9pQ",
      date: "2024/11/15(金) 23:18:30",
      text: ">>2\nいや、なんか…引っ掻くような音。\nコリコリコリコリって、ずっと。\n最初はネズミかと思ったんだけど、管理会社に聞いたら\n隣は半年以上空室で、害虫駆除も済んでるって言われた。",
      effect: null,
    },
    {
      number: 4,
      name: "名無しさん@おーぷん",
      id: "qN5tY8kD",
      date: "2024/11/15(金) 23:20:11",
      text: "事故物件じゃないの？\n調べた？",
      effect: null,
    },
    {
      number: 5,
      name: "名無しさん@おーぷん",
      id: "aB3xK9pQ",
      date: "2024/11/15(金) 23:25:03",
      text: ">>4\n契約時に確認したけど告知事項なしだった。\nでも昨日、もっとやばいことがあった。\n\n夜中の3時に目が覚めて、いつもの音がしてたんだけど\n音の場所が…壁じゃなくて\n\n天井の真上だった。",
      effect: "shake",
    },
  ],
};

// Studioプレビュー用の仮メタデータ
const sampleMetadata: EpisodeMetadata = {
  episodeId: "episode_001",
  totalDurationInFrames: 750,
  fps: 30,
  posts: [
    {
      number: 1,
      audioFile: "audio/episode_001/res_001.wav",
      audioDurationMs: 3500,
      startFrame: 0,
      durationInFrames: 120,
      effect: null,
      speakerId: 13,
    },
    {
      number: 2,
      audioFile: "audio/episode_001/res_002.wav",
      audioDurationMs: 1500,
      startFrame: 120,
      durationInFrames: 60,
      effect: null,
      speakerId: 3,
    },
    {
      number: 3,
      audioFile: "audio/episode_001/res_003.wav",
      audioDurationMs: 5000,
      startFrame: 180,
      durationInFrames: 165,
      effect: null,
      speakerId: 13,
    },
    {
      number: 4,
      audioFile: "audio/episode_001/res_004.wav",
      audioDurationMs: 1500,
      startFrame: 345,
      durationInFrames: 60,
      effect: null,
      speakerId: 2,
    },
    {
      number: 5,
      audioFile: "audio/episode_001/res_005.wav",
      audioDurationMs: 6000,
      startFrame: 405,
      durationInFrames: 210,
      effect: "shake",
      speakerId: 13,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ThreadVideo"
        component={ThreadVideo}
        durationInFrames={
          DESIGN.TITLE_DURATION_FRAMES +
          sampleMetadata.totalDurationInFrames +
          DESIGN.ENDING_DURATION_FRAMES
        }
        fps={DESIGN.FPS}
        width={DESIGN.WIDTH}
        height={DESIGN.HEIGHT}
        defaultProps={{
          episodeId: "episode_001",
          episode: sampleEpisode,
          metadata: sampleMetadata,
        }}
        calculateMetadata={async ({ props }) => {
          // レンダリング時はメタデータJSONから読み込む
          // Studioプレビュー時はdefaultPropsを使用
          try {
            const metaModule = await import(
              `../data/metadata/${props.episodeId}_meta.json`
            );
            const metadata: EpisodeMetadata = metaModule.default;
            const episodeModule = await import(
              `../data/episodes/${props.episodeId}.json`
            );
            const episode: EpisodeData = episodeModule.default;

            return {
              durationInFrames:
                DESIGN.TITLE_DURATION_FRAMES +
                metadata.totalDurationInFrames +
                DESIGN.ENDING_DURATION_FRAMES,
              props: {
                ...props,
                episode,
                metadata,
              },
            };
          } catch {
            // メタデータが見つからない場合はdefaultPropsを使用
            return {
              durationInFrames:
                DESIGN.TITLE_DURATION_FRAMES +
                sampleMetadata.totalDurationInFrames +
                DESIGN.ENDING_DURATION_FRAMES,
            };
          }
        }}
      />
      <Composition
        id="TitleOnly"
        component={IntermissionTitle}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "タイトル",
          board: "オカルト超常現象",
        }}
      />
    </>
  );
};
