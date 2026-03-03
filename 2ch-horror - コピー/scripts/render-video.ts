import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function main() {
  // コマンドライン引数からepisode名を取得
  const args = process.argv.slice(2);
  const episodeIdx = args.indexOf("--episode");
  if (episodeIdx === -1 || !args[episodeIdx + 1]) {
    console.error(
      "使い方: npx tsx scripts/render-video.ts --episode episode_001"
    );
    process.exit(1);
  }
  const episodeId = args[episodeIdx + 1];

  // メタデータの存在確認
  const metaPath = path.resolve(`data/metadata/${episodeId}_meta.json`);
  if (!fs.existsSync(metaPath)) {
    console.error(
      `エラー: メタデータファイルが見つかりません: ${metaPath}\n` +
        `先に generate-metadata.ts を実行してください。`
    );
    process.exit(1);
  }

  // 出力ディレクトリの作成
  const outDir = path.resolve("out");
  fs.mkdirSync(outDir, { recursive: true });
  const outputPath = path.join(outDir, `${episodeId}.mp4`);

  // Windows対策: propsを一時JSONファイル経由で渡す
  const propsFile = path.resolve("out", `${episodeId}_props.json`);
  fs.writeFileSync(propsFile, JSON.stringify({ episodeId }), "utf-8");

  console.log(`=== レンダリング開始 ===`);
  console.log(`エピソード: ${episodeId}`);
  console.log(`出力先: ${outputPath}\n`);

  const command = [
    "npx remotion render",
    "src/index.ts",
    "ThreadVideo",
    `--props="${propsFile}"`,
    `--output="${outputPath}"`,
    "--codec=h264",
    "--image-format=jpeg",
    "--jpeg-quality=80",
  ].join(" ");

  console.log(`実行: ${command}\n`);

  try {
    execSync(command, {
      stdio: "inherit",
      cwd: path.resolve("."),
    });
    console.log(`\n=== レンダリング完了 ===`);
    console.log(`出力ファイル: ${outputPath}`);
  } catch (error) {
    console.error("\nレンダリングに失敗しました。");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("予期せぬエラー:", error);
  process.exit(1);
});
