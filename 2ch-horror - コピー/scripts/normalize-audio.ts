import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import ffmpegPath from "ffmpeg-static";

/**
 * YouTube推奨ラウドネス規格に準拠した2パスノーマライズ
 *
 * - ラウドネス基準: -14 LUFS (Integrated Loudness)
 * - トゥルーピーク上限: -1.0 dBTP
 * - ラウドネスレンジ: 最大 11 LRA
 * - リニアモード (linear=true) で音質劣化を防止
 * - 音声サンプルレート: 48000Hz (YouTube推奨)
 */

// YouTube推奨ターゲット値
const TARGET_I = -14;
const TARGET_TP = -1.0;
const TARGET_LRA = 11;

interface LoudnormMeasurement {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  output_i: string;
  output_tp: string;
  output_lra: string;
  output_thresh: string;
  normalization_type: string;
  target_offset: string;
}

function checkFfmpeg(): string {
  if (!ffmpegPath) {
    console.error(
      "エラー: FFmpegバイナリが見つかりません。\n" +
        "ffmpeg-static がインストールされているか確認してください。"
    );
    process.exit(1);
  }
  return ffmpegPath;
}

/**
 * パス1: 入力MP4の現在のラウドネスを測定する
 */
function measureLoudness(ffmpeg: string, inputPath: string): LoudnormMeasurement {
  console.log("  パス1: ラウドネス測定中...");

  const cmd = [
    `"${ffmpeg}"`,
    `-i "${inputPath}"`,
    `-af loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    `-f null -`,
  ].join(" ");

  try {
    // loudnorm の出力は stderr に出る
    const result = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    // stderrを取得するためにspawnSyncを使うべきだが、execSyncでは stderr がキャプチャできない
    // → maxBuffer を大きくして stderr をキャプチャ
  } catch {
    // execSync は stderr のある正常終了でも catch に入る場合がある
  }

  // execSync では stderr を直接取得できないので、spawnSync を使う
  const { spawnSync } = require("child_process");
  const proc = spawnSync(ffmpeg, [
    "-i", inputPath,
    "-af", `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    "-f", "null",
    "-",
  ], {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const stderr = proc.stderr || "";

  // JSON部分を抽出
  const jsonMatch = stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!jsonMatch) {
    console.error("エラー: ラウドネス測定結果のJSONを解析できませんでした。");
    console.error("FFmpeg出力:\n", stderr.slice(-2000));
    process.exit(1);
  }

  const measurement: LoudnormMeasurement = JSON.parse(jsonMatch[0]);

  console.log(`    測定結果:`);
  console.log(`      Integrated Loudness: ${measurement.input_i} LUFS`);
  console.log(`      True Peak:           ${measurement.input_tp} dBTP`);
  console.log(`      Loudness Range:      ${measurement.input_lra} LRA`);

  return measurement;
}

/**
 * パス2: 測定値を使って正確にノーマライズする
 */
function applyNormalization(
  ffmpeg: string,
  inputPath: string,
  outputPath: string,
  measurement: LoudnormMeasurement
): void {
  console.log("  パス2: ノーマライズ適用中...");

  const loudnormFilter = [
    `loudnorm=I=${TARGET_I}`,
    `TP=${TARGET_TP}`,
    `LRA=${TARGET_LRA}`,
    `measured_I=${measurement.input_i}`,
    `measured_TP=${measurement.input_tp}`,
    `measured_LRA=${measurement.input_lra}`,
    `measured_thresh=${measurement.input_thresh}`,
    `linear=true`,
  ].join(":");

  const cmd = [
    `"${ffmpeg}"`,
    "-y",
    `-i "${inputPath}"`,
    `-af "${loudnormFilter}"`,
    "-ar 48000",
    "-c:v copy",
    `"${outputPath}"`,
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit" });
  } catch {
    console.error(`エラー: ノーマライズに失敗しました: ${inputPath}`);
    process.exit(1);
  }
}

/**
 * ノーマライズ後のラウドネスを検証する
 */
function verifyLoudness(ffmpeg: string, outputPath: string): void {
  console.log("  検証: ノーマライズ後のラウドネスを測定中...");

  const { spawnSync } = require("child_process");
  const proc = spawnSync(ffmpeg, [
    "-i", outputPath,
    "-af", `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    "-f", "null",
    "-",
  ], {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const stderr = proc.stderr || "";
  const jsonMatch = stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);

  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0]);
    console.log(`    ノーマライズ後:`);
    console.log(`      Integrated Loudness: ${result.input_i} LUFS (target: ${TARGET_I})`);
    console.log(`      True Peak:           ${result.input_tp} dBTP (limit: ${TARGET_TP})`);
    console.log(`      Loudness Range:      ${result.input_lra} LRA (max: ${TARGET_LRA})`);
  }
}

/**
 * 単一ファイルのノーマライズ処理
 */
export function normalizeFile(inputPath: string, outputPath?: string): string {
  const ffmpeg = checkFfmpeg();
  const resolvedInput = path.resolve(inputPath);

  if (!fs.existsSync(resolvedInput)) {
    console.error(`エラー: ファイルが見つかりません: ${resolvedInput}`);
    process.exit(1);
  }

  // 出力パスの決定
  const ext = path.extname(resolvedInput);
  const baseName = path.basename(resolvedInput, ext);
  const dir = path.dirname(resolvedInput);
  const resolvedOutput = outputPath
    ? path.resolve(outputPath)
    : path.join(dir, `${baseName}_normalized${ext}`);

  console.log(`\n=== ラウドネスノーマライズ ===`);
  console.log(`入力:   ${resolvedInput}`);
  console.log(`出力:   ${resolvedOutput}`);
  console.log(`ターゲット: ${TARGET_I} LUFS / ${TARGET_TP} dBTP / ${TARGET_LRA} LRA\n`);

  // パス1: 測定
  const measurement = measureLoudness(ffmpeg, resolvedInput);

  // パス2: ノーマライズ適用
  applyNormalization(ffmpeg, resolvedInput, resolvedOutput, measurement);

  // 検証
  verifyLoudness(ffmpeg, resolvedOutput);

  console.log(`\n  完了: ${resolvedOutput}\n`);
  return resolvedOutput;
}

/**
 * outフォルダ内の全MP4を一括処理
 */
function normalizeAll(): void {
  const outDir = path.resolve("out");

  if (!fs.existsSync(outDir)) {
    console.error(`エラー: outフォルダが見つかりません: ${outDir}`);
    process.exit(1);
  }

  const mp4Files = fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith(".mp4") && !f.endsWith("_normalized.mp4"))
    .map((f) => path.join(outDir, f));

  if (mp4Files.length === 0) {
    console.error("エラー: outフォルダにMP4ファイルが見つかりません。");
    process.exit(1);
  }

  console.log(`=== 一括ノーマライズ (${mp4Files.length}ファイル) ===\n`);

  for (const file of mp4Files) {
    normalizeFile(file);
  }

  console.log(`\n=== 全ファイルのノーマライズ完了 ===`);
}

// --- メイン ---
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "使用法:\n" +
        "  単体:   npm run normalize -- out/episode_001.mp4\n" +
        "  一括:   npm run normalize -- --all\n"
    );
    process.exit(1);
  }

  if (args.includes("--all")) {
    normalizeAll();
  } else {
    // 引数のファイルを順番に処理
    for (const arg of args) {
      normalizeFile(arg);
    }
  }
}

main().catch((err) => {
  console.error("予期せぬエラー:", err);
  process.exit(1);
});
