import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { normalizeFile } from "./normalize-audio";

if (!ffmpegPath) {
    console.error("ffmpeg binary not found.");
    process.exit(1);
}

// 実行コマンド: npx tsx scripts/concat-episodes.ts episode_001 episode_002 ...

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("使用法: npx tsx scripts/concat-episodes.ts episode_001 episode_002 ...");
        process.exit(1);
    }

    const episodeIds = args;
    const outDir = path.resolve("out");
    const tempDir = path.resolve("out", "temp_concat");

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 1. 各エピソードの存在確認
    for (const epId of episodeIds) {
        const mp4Path = path.join(outDir, `${epId}.mp4`);
        if (!fs.existsSync(mp4Path)) {
            console.error(`エラー: エピソード動画が見つかりません: ${mp4Path}`);
            console.error(`npm run render -- --episode ${epId} を実行してください。`);
            process.exit(1);
        }
    }

    const concatListPath = path.join(tempDir, "concat_list.txt");
    let concatListContent = "";

    // 2. 処理ループ
    for (let i = 0; i < episodeIds.length; i++) {
        const epId = episodeIds[i];
        const mp4Path = path.join(outDir, `${epId}.mp4`);



        // 本編を追加
        concatListContent += `file '${mp4Path}'\n`;
    }

    fs.writeFileSync(concatListPath, concatListContent, "utf-8");

    // 3. 結合 (ffmpeg concat)
    const concatOutPath = path.join(tempDir, "concatenated_raw.mp4");
    // ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4
    // 注意: エンコード形式が異なると copy は失敗する可能性があるが、
    // 全部Remotionでh264生成しているので copy でいけるはず
    const ffmpegConcatCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatListPath}" -c copy "${concatOutPath}"`;

    console.log("\n=== 動画結合中 ===");
    try {
        execSync(ffmpegConcatCmd, { stdio: "inherit" });
    } catch (e) {
        console.error("動画結合に失敗しました。");
        process.exit(1);
    }

    // 4. 2パスラウドネスノーマライズ (YouTube推奨: -14 LUFS)
    const compilationName = `compilation_${episodeIds.join("_")}`;
    const rawOutPath = path.join(outDir, `${compilationName}.mp4`);

    // まず結合結果を最終名にリネーム
    fs.renameSync(concatOutPath, rawOutPath);

    console.log("\n=== 2パスラウドネスノーマライズ (YouTube推奨規格) ===");
    const normalizedPath = normalizeFile(rawOutPath);

    console.log(`\n=== 完了 ===`);
    console.log(`結合ファイル (未ノーマライズ): ${rawOutPath}`);
    console.log(`最終出力 (ノーマライズ済み):   ${normalizedPath}`);

    // 一時ファイル削除
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
        // 削除失敗は無視
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
