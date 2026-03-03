export interface EpisodeData {
  title: string;
  board: string;
  bgm?: string;
  volume?: {
    bgm?: number;
    voice?: number;
    se?: number;
  };
  threads: ThreadPost[];
}

export interface ThreadPost {
  number: number;
  name: string;
  id: string;
  date: string;
  text: string;        // 画面表示用（漢字あり）
  reading?: string;    // VOICEVOX用の読み（省略可）
  effect: EffectType | null;
}

export type EffectType = "glitch" | "shake" | "redflash" | "redtext" | "slowtype";

export interface EpisodeMetadata {
  episodeId: string;
  totalDurationInFrames: number;
  fps: number;
  posts: PostMetadata[];
}

export interface PostMetadata {
  number: number;
  audioFile: string;
  audioDurationMs: number;
  startFrame: number;
  durationInFrames: number;
  effect: EffectType | null;
  speakerId: number;
}
