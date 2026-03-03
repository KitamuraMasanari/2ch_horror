import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ThreadPost {
  number: number;
  name: string;
  id: string;
  date: string;
  text: string;
  effect: string | null;
}

interface EpisodeData {
  title: string;
  board: string;
  bgm?: string;
  threads: ThreadPost[];
}

interface PostMetadata {
  number: number;
  audioFile: string;
  audioDurationMs: number;
  startFrame: number;
  durationInFrames: number;
  effect: string | null;
  speakerId: number;
}

interface EpisodeMetadata {
  episodeId: string;
  bgm: string;
  totalDurationInFrames: number;
  fps: number;
  posts: PostMetadata[];
}

const FPS = 30;
const ROTATION_SPEAKERS = [10, 11, 14, 16, 20, 21];

/**
 * ffprobeが利用可能かチェック
 */
function hasFFprobe(): boolean {
  try {
    execSync("ffprobe -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * ffprobeを使って正確な音声durationを取得する (ms)
 */
function getAudioDurationMsFFprobe(filePath: string): number {
  const result = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  )
    .toString()
    .trim();
  return Math.round(parseFloat(result) * 1000);
}

/**
 * WAVファイルのヘッダーを正確にパースしてduration(ms)を取得する
 * byteRateを使って計算し、丸め誤差を最小化
 */
function getAudioDurationMsWav(filePath: string): number {
  const buffer = fs.readFileSync(filePath);

  const riff = buffer.toString("ascii", 0, 4);
  const wave = buffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error(`Invalid WAV file: ${filePath}`);
  }

  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === "fmt ") {
      // byteRate（offset+16から4バイト）が最も正確
      byteRate = buffer.readUInt32LE(offset + 16);
    } else if (chunkId === "data") {
      dataSize = chunkSize;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (byteRate === 0) {
    throw new Error(`Could not parse WAV header (byteRate): ${filePath}`);
  }
  if (dataSize === 0) {
    throw new Error(`Could not parse WAV header (dataSize): ${filePath}`);
  }

  // dataSize / byteRate = 秒数（浮動小数点で正確に）
  const durationSec = dataSize / byteRate;
  return Math.round(durationSec * 1000);
}

// ffprobeが使えるか起動時に判定
const USE_FFPROBE = hasFFprobe();

/**
 * 音声ファイルのdurationを取得（ffprobe優先、なければWAVパース）
 */
function getAudioDurationMs(filePath: string): number {
  if (USE_FFPROBE) {
    return getAudioDurationMsFFprobe(filePath);
  }
  return getAudioDurationMsWav(filePath);
}

/**
 * エフェクトに応じたパディング時間をミリ秒で返す
 */
function getPaddingMs(effect: string | null, isLast: boolean): number {
  if (isLast) return 3000; // 3秒の余韻

  switch (effect) {
    case "redflash":
      return 1500; // 1.5秒
    case "shake":
      return 1000; // 1.0秒
    default:
      return 500; // 0.5秒
  }
}

/**
 * speaker_idの割り当て
 */
function assignSpeakers(threads: ThreadPost[]): Map<string, number> {
  const idToSpeaker = new Map<string, number>();
  const mainId = threads[0]?.id;
  let residentIndex = 0;
  const residentSpeakers = [3, 2, 8];

  for (const post of threads) {
    if (idToSpeaker.has(post.id)) continue;

    if (post.id === mainId) {
      idToSpeaker.set(post.id, 13);
    } else if (residentIndex < residentSpeakers.length) {
      idToSpeaker.set(post.id, residentSpeakers[residentIndex]);
      residentIndex++;
    } else {
      const rotIdx = (residentIndex - residentSpeakers.length) % ROTATION_SPEAKERS.length;
      idToSpeaker.set(post.id, ROTATION_SPEAKERS[rotIdx]);
      residentIndex++;
    }
  }

  return idToSpeaker;
}

async function main() {
  // コマンドライン引数からepisode名を取得
  const args = process.argv.slice(2);
  const episodeIdx = args.indexOf("--episode");
  if (episodeIdx === -1 || !args[episodeIdx + 1]) {
    console.error(
      "使い方: npx tsx scripts/generate-metadata.ts --episode episode_001"
    );
    process.exit(1);
  }
  const episodeId = args[episodeIdx + 1];

  // 台本JSONの読み込み
  const episodePath = path.resolve(`data/episodes/${episodeId}.json`);
  if (!fs.existsSync(episodePath)) {
    console.error(`エラー: 台本ファイルが見つかりません: ${episodePath}`);
    process.exit(1);
  }

  const episode: EpisodeData = JSON.parse(
    fs.readFileSync(episodePath, "utf-8")
  );

  // 音声ファイルディレクトリの確認
  const audioDir = path.resolve(`public/audio/${episodeId}`);
  if (!fs.existsSync(audioDir)) {
    console.error(
      `エラー: 音声ファイルディレクトリが見つかりません: ${audioDir}\n` +
        `先に generate-audio.ts を実行してください。`
    );
    process.exit(1);
  }

  // speaker_idの割り当て
  const speakerMap = assignSpeakers(episode.threads);

  console.log(`台本: "${episode.title}" (${episode.threads.length}レス)`);
  console.log(`音声ディレクトリ: ${audioDir}\n`);

  // 各レスのメタデータを計算
  // 累積誤差を防ぐため、ミリ秒ベースでstartFrameを直接計算する
  const posts: PostMetadata[] = [];
  let cumulativeMs = 0; // レス部分の累積ミリ秒（タイトル分はRemotion側で加算）

  for (let i = 0; i < episode.threads.length; i++) {
    const post = episode.threads[i];
    const paddedNum = String(post.number).padStart(3, "0");
    const audioFileName = `res_${paddedNum}.wav`;
    const audioFilePath = path.join(audioDir, audioFileName);
    const audioRelPath = `audio/${episodeId}/${audioFileName}`;

    if (!fs.existsSync(audioFilePath)) {
      console.error(`警告: 音声ファイルが見つかりません: ${audioFilePath}`);
      continue;
    }

    const audioDurationMs = getAudioDurationMs(audioFilePath);
    const isLast = i === episode.threads.length - 1;
    const paddingMs = getPaddingMs(post.effect, isLast);
    const speakerId = speakerMap.get(post.id) || 13;

    // ミリ秒から直接フレームに変換（累積誤差なし）
    const startFrame = Math.round((cumulativeMs / 1000) * FPS);
    cumulativeMs += audioDurationMs + paddingMs;
    const endFrame = Math.round((cumulativeMs / 1000) * FPS);
    const durationInFrames = endFrame - startFrame;

    console.log(
      `  レス${post.number}: ${audioDurationMs}ms + padding:${paddingMs}ms → ` +
        `start:${startFrame} dur:${durationInFrames}frames speaker:${speakerId}` +
        (post.effect ? ` [${post.effect}]` : "")
    );

    posts.push({
      number: post.number,
      audioFile: audioRelPath,
      audioDurationMs,
      startFrame,
      durationInFrames,
      effect: post.effect,
      speakerId,
    });
  }

  // 全体のduration計算（ミリ秒ベースで最終フレームを算出）
  const totalDurationInFrames = Math.round((cumulativeMs / 1000) * FPS);

  const metadata: EpisodeMetadata = {
    episodeId,
    bgm: episode.bgm || "horror_ambient.mp3",
    totalDurationInFrames,
    fps: FPS,
    posts,
  };

  // メタデータを出力
  const outputDir = path.resolve("data/metadata");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${episodeId}_meta.json`);
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), "utf-8");

  console.log(`\n=== メタデータ生成完了 ===`);
  console.log(`出力: ${outputPath}`);
  console.log(`レス部分合計: ${totalDurationInFrames}frames (${(totalDurationInFrames / FPS).toFixed(1)}秒)`);
  console.log(
    `動画全体: ${totalDurationInFrames + 300}frames (${((totalDurationInFrames + 300) / FPS).toFixed(1)}秒) ` +
      `※タイトル5秒+エンディング5秒含む`
  );
}

main().catch((error) => {
  console.error("予期せぬエラー:", error);
  process.exit(1);
});
