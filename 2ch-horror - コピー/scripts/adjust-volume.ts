import * as fs from "fs";
import * as path from "path";

// 使用法: npx tsx scripts/adjust-volume.ts --episode episode_001 --bgm 0.8 --voice 1.2 --se 0.5

const args = process.argv.slice(2);
const episodeIdx = args.indexOf("--episode");

if (episodeIdx === -1 || !args[episodeIdx + 1]) {
    console.error("使用法: npx tsx scripts/adjust-volume.ts --episode episode_001 [--bgm 0.1] [--voice 1.0] [--se 0.5]");
    process.exit(1);
}

const episodeId = args[episodeIdx + 1];
const filePath = path.resolve(`data/episodes/${episodeId}.json`);

if (!fs.existsSync(filePath)) {
    console.error(`エラー: ファイルが見つかりません: ${filePath}`);
    process.exit(1);
}

const getArgValue = (flag: string): number | undefined => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
        const val = parseFloat(args[idx + 1]);
        if (!isNaN(val)) return val;
    }
    return undefined;
};

const bgmVol = getArgValue("--bgm");
const voiceVol = getArgValue("--voice");
const seVol = getArgValue("--se");

if (bgmVol === undefined && voiceVol === undefined && seVol === undefined) {
    console.log("変更するパラメータが指定されていません。");
    process.exit(0);
}

try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!data.volume) {
        data.volume = {};
    }

    if (bgmVol !== undefined) {
        console.log(`BGMボリュームを更新: ${data.volume.bgm ?? "default"} -> ${bgmVol}`);
        data.volume.bgm = bgmVol;
    }
    if (voiceVol !== undefined) {
        console.log(`ボイスボリュームを更新: ${data.volume.voice ?? "default"} -> ${voiceVol}`);
        data.volume.voice = voiceVol;
    }
    if (seVol !== undefined) {
        console.log(`SEボリュームを更新: ${data.volume.se ?? "default"} -> ${seVol}`);
        data.volume.se = seVol;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`\n更新完了: ${filePath}`);
    console.log("反映するには再レンダリングが必要です: npm run render -- --episode " + episodeId);

} catch (e) {
    console.error("エラーが発生しました:", e);
    process.exit(1);
}
