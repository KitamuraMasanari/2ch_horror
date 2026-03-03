import * as fs from "fs";
import * as path from "path";
import { syncDictionary } from "./sync-dictionary";

interface ThreadPost {
  number: number;
  name: string;
  id: string;
  date: string;
  text: string;        // 画面表示用（漢字あり）
  reading?: string;    // VOICEVOX用の読み（省略可）
  effect: string | null;
}

interface EpisodeData {
  title: string;
  board: string;
  bgm?: string;
  threads: ThreadPost[];
}

const VOICEVOX_URL = "http://localhost:50021";

// speaker_idのローテーション用プール（住民4人目以降）
const ROTATION_SPEAKERS = [10, 11, 14, 16, 20, 21];

// AudioQueryの調整パラメータ
const DEFAULT_PARAMS = {
  speedScale: 1.1,
  pitchScale: 0.0,
  intonationScale: 1.2,
  volumeScale: 1.0,
  prePhonemeLength: 0.1,
  postPhonemeLength: 0.2,
};

const SLOWTYPE_PARAMS = {
  speedScale: 0.95,
  pitchScale: 0.0,
  intonationScale: 0.9,
  volumeScale: 1.0,
  prePhonemeLength: 0.1,
  postPhonemeLength: 0.2,
};

async function checkVoicevox(): Promise<boolean> {
  try {
    const res = await fetch(`${VOICEVOX_URL}/version`);
    if (res.ok) {
      const version = await res.text();
      console.log(`VOICEVOX ENGINE detected: v${version}`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function assignSpeakers(threads: ThreadPost[]): Map<string, number> {
  const idToSpeaker = new Map<string, number>();
  const mainId = threads[0]?.id;
  let residentIndex = 0;
  const residentSpeakers = [3, 2, 8]; // 住民1〜3

  for (const post of threads) {
    if (idToSpeaker.has(post.id)) continue;

    if (post.id === mainId) {
      // スレ主
      idToSpeaker.set(post.id, 13);
    } else if (residentIndex < residentSpeakers.length) {
      // 住民1〜3
      idToSpeaker.set(post.id, residentSpeakers[residentIndex]);
      residentIndex++;
    } else {
      // 住民4人目以降
      const rotIdx = (residentIndex - residentSpeakers.length) % ROTATION_SPEAKERS.length;
      idToSpeaker.set(post.id, ROTATION_SPEAKERS[rotIdx]);
      residentIndex++;
    }
  }

  return idToSpeaker;
}

/**
 * 辞書ファイル（data/dictionary.json）による自動置換
 * 長いキーから先に置換して部分一致の誤置換を防ぐ
 */
function loadDictionary(): Record<string, string> {
  const dictPath = path.resolve("data/dictionary.json");
  if (!fs.existsSync(dictPath)) {
    console.log("辞書ファイルなし: data/dictionary.json（スキップ）");
    return {};
  }
  const dict = JSON.parse(fs.readFileSync(dictPath, "utf-8"));
  console.log(`辞書ロード: ${Object.keys(dict).length}件の置換ルール`);
  return dict;
}

function applyDictionary(text: string, dictionary: Record<string, string>): string {
  let result = text;
  // 長いキーから先に置換（部分一致の誤置換を防ぐ）
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    result = result.replaceAll(key, dictionary[key]);
  }
  return result;
}

/**
 * VOICEVOX向けの読み仮名置換ルール（エピソード固有）
 * 辞書で対応しきれない個別ケースに使用
 */
const GLOBAL_PRONUNCIATION: [string | RegExp, string][] = [
  // 「今年」「今日」「今度」→ 先に置換してから、残った単独の「今」→「イマ」
  ["今年", "コトシ"],
  ["今日", "キョオ"],
  ["今度", "コンド"],
  ["今", "イマ"],
  ["3日前", "ミッカマエ"],
  ["Wifi", "ワイファイ"],
  ["WiFi", "ワイファイ"],
  ["wifi", "ワイファイ"],
  ["WIFI", "ワイファイ"],
  ["tasukete", "タスケテ"],
  ["TASUKETE", "タスケテ"],
  ["SSID", "エスエスアイディー"],
];

const PER_RES_PRONUNCIATION: Record<number, [string | RegExp, string][]> = {
  1:  [["何なんだ", "ナンナンダ"]],
  3:  [["声", "コエ"]],
  9:  [["空室", "クウシツ"]],
  15: [["言ってくれる人", "イッテクレルヒト"]],
  20: [["何なんだろうな", "ナンナンダロウナ"]],
  22: [["洒落", "シャレ"]],
  40: [["なんか人", "ナンカヒト"]],
  41: [["何だよ", "ナンダヨ"]],
  54: [["話", "ハナシ"]],
  66: [["出ろ", "デロ"]],
  67: [["トントン音", "トントンオン"]],
  70: [["声", "コエ"]],
  75: [["止めろ", "トメロ"]],
  76: [["何か", "ナンカ"]],
  81: [["何もない", "ナンモナイ"]],
};

function applyPronunciation(text: string, resNumber: number): string {
  let result = text;

  // 全体共通の置換
  for (const [from, to] of GLOBAL_PRONUNCIATION) {
    if (typeof from === "string") {
      result = result.split(from).join(to);
    } else {
      result = result.replace(from, to);
    }
  }

  // レス番号固有の置換
  const perRes = PER_RES_PRONUNCIATION[resNumber];
  if (perRes) {
    for (const [from, to] of perRes) {
      if (typeof from === "string") {
        result = result.split(from).join(to);
      } else {
        result = result.replace(from, to);
      }
    }
  }

  return result;
}

/**
 * VOICEVOX に渡すテキストの前処理
 *
 * VOICEVOXの /audio_query は渡されたテキストを内部で再解析するため、
 * ひらがなで書いても数字や一部の漢字が意図しない読みに変換されることがある。
 * この関数で事前にカタカナに置換することで読み間違いを防ぐ。
 */
function preprocessForVoicevox(
  text: string,
  dictionary: Record<string, string>
): string {
  let result = text;

  // 1. dictionary.json による置換（カタカナで）
  result = applyDictionary(result, dictionary);

  // 2. 数字+月 の読み変換（VOICEVOXが特に苦手）
  const monthMap: Record<string, string> = {
    "1月": "イチガツ",
    "2月": "ニガツ",
    "3月": "サンガツ",
    "4月": "シガツ",
    "5月": "ゴガツ",
    "6月": "ロクガツ",
    "7月": "シチガツ",
    "8月": "ハチガツ",
    "9月": "クガツ",
    "10月": "ジュウガツ",
    "11月": "ジュウイチガツ",
    "12月": "ジュウニガツ",
  };
  for (const [kanji, kana] of Object.entries(monthMap)) {
    result = result.replaceAll(kanji, kana);
  }

  // 3. 数字+日 の読み変換（よくある日付）
  const dayMap: Record<string, string> = {
    "1日": "ツイタチ",
    "2日": "フツカ",
    "3日": "ミッカ",
    "4日": "ヨッカ",
    "5日": "イツカ",
    "6日": "ムイカ",
    "7日": "ナノカ",
    "8日": "ヨウカ",
    "9日": "ココノカ",
    "10日": "トオカ",
    "14日": "ジュウヨッカ",
    "20日": "ハツカ",
    "24日": "ニジュウヨッカ",
  };
  for (const [kanji, kana] of Object.entries(dayMap)) {
    result = result.replaceAll(kanji, kana);
  }

  // 4. 数字+時 の読み変換
  const hourMap: Record<string, string> = {
    "4時": "ヨジ",
    "7時": "シチジ",
    "9時": "クジ",
  };
  for (const [kanji, kana] of Object.entries(hourMap)) {
    result = result.replaceAll(kanji, kana);
  }

  // 5. 感嘆・驚愕の「は」「はあ」をカタカナに変換
  //    VOICEVOXは助詞の「は」を「わ」と読むが、感嘆表現では「は(ha)」と読ませたい
  //    パターン: 文頭/句点後の「はあ？」「は？」「は！？」「は。」など単独使用
  result = result.replace(/(?:^|(?<=[。、！？!?…\s]))はあ(?=[？！?!\s。]|$)/g, "ハァ");
  result = result.replace(/(?:^|(?<=[。、！？!?…\s]))は(?=[？！?!\s。]|$)/g, "ハッ");

  // 6. 残った漢字はそのまま（VOICEVOXの解析に任せる）

  return result;
}

/**
 * readingテキスト冒頭のアンカー記法を除去する
 *
 * 削除対象（冒頭のみ）:
 *   >>数字, >>数字-数字, <<数字, <<数字-数字
 *   ＞＞数字, ＞＞数字-数字, ＜＜数字, ＜＜数字-数字
 *   冒頭に複数連続する場合もすべて削除
 *
 * 文章途中のアンカーは削除しない
 */
function cleanLeadingAnchors(text: string): string {
  let result = text;
  while (true) {
    const before = result;
    result = result.replace(
      /^[\s\n]*(>{1,2}|＞{1,2}|<{1,2}|＜{1,2})\d+(?:\s*-\s*\d+)?[\s\n]*/,
      ""
    );
    if (result === before) break;
  }
  return result.trim();
}

/**
 * VOICEVOX用テキストを決定する
 * 優先順位: 1. reading(最優先) → 2. textそのまま
 *
 * どちらの場合も cleanLeadingAnchors + preprocessForVoicevox + applyPronunciation を適用
 */
function resolveVoicevoxText(
  post: ThreadPost,
  dictionary: Record<string, string>
): string {
  const source = post.reading || post.text;
  let result = cleanLeadingAnchors(source);
  result = preprocessForVoicevox(result, dictionary);
  result = applyPronunciation(result, post.number);

  return result;
}

async function generateAudioForPost(
  text: string,
  speakerId: number,
  effect: string | null,
  outputPath: string
): Promise<boolean> {
  // 1. AudioQueryを取得
  const queryUrl = `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`;
  const queryRes = await fetch(queryUrl, { method: "POST" });

  if (!queryRes.ok) {
    throw new Error(
      `audio_query failed: ${queryRes.status} ${await queryRes.text()}`
    );
  }

  const audioQuery = await queryRes.json();

  // 2. パラメータを上書き
  const params = effect === "slowtype" ? SLOWTYPE_PARAMS : DEFAULT_PARAMS;
  Object.assign(audioQuery, params);

  // 3. 音声合成
  const synthUrl = `${VOICEVOX_URL}/synthesis?speaker=${speakerId}`;
  const synthRes = await fetch(synthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(audioQuery),
  });

  if (!synthRes.ok) {
    throw new Error(
      `synthesis failed: ${synthRes.status} ${await synthRes.text()}`
    );
  }

  // 4. WAVバイナリを保存
  const buffer = await synthRes.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  return true;
}

async function generateWithRetry(
  text: string,
  speakerId: number,
  effect: string | null,
  outputPath: string,
  retries = 1
): Promise<boolean> {
  try {
    return await generateAudioForPost(text, speakerId, effect, outputPath);
  } catch (error) {
    if (retries > 0) {
      console.log(`  リトライ中（3秒後）...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return generateWithRetry(text, speakerId, effect, outputPath, retries - 1);
    }
    throw error;
  }
}

async function main() {
  // コマンドライン引数からepisode名を取得
  const args = process.argv.slice(2);
  const episodeIdx = args.indexOf("--episode");
  if (episodeIdx === -1 || !args[episodeIdx + 1]) {
    console.error("使い方: npx tsx scripts/generate-audio.ts --episode episode_001");
    process.exit(1);
  }
  const episodeId = args[episodeIdx + 1];

  // VOICEVOXの起動確認
  const isRunning = await checkVoicevox();
  if (!isRunning) {
    console.error(
      "エラー: VOICEVOX ENGINE が起動していません。\n" +
        "VOICEVOX ENGINE を http://localhost:50021 で起動してから再実行してください。"
    );
    process.exit(1);
  }

  // 1. VOICEVOXの辞書を同期
  await syncDictionary();

  // 台本JSONの読み込み
  const episodePath = path.resolve(`data/episodes/${episodeId}.json`);
  if (!fs.existsSync(episodePath)) {
    console.error(`エラー: 台本ファイルが見つかりません: ${episodePath}`);
    process.exit(1);
  }

  const episode: EpisodeData = JSON.parse(
    fs.readFileSync(episodePath, "utf-8")
  );
  console.log(`台本: "${episode.title}" (${episode.threads.length}レス)`);

  // 辞書ファイルのロード（テキスト前処理用）
  const dictionary = loadDictionary();

  // 出力ディレクトリの作成
  const outputDir = path.resolve(`public/audio/${episodeId}`);
  fs.mkdirSync(outputDir, { recursive: true });

  // speaker_idの割り当て
  const speakerMap = assignSpeakers(episode.threads);

  console.log("\n=== Speaker割り当て ===");
  for (const [id, speaker] of speakerMap) {
    console.log(`  ID:${id} → speaker_id:${speaker}`);
  }
  console.log("");

  // 2. 各レスの音声を生成
  let successCount = 0;
  let failCount = 0;

  for (const post of episode.threads) {
    const paddedNum = String(post.number).padStart(3, "0");
    const outputPath = path.join(outputDir, `res_${paddedNum}.wav`);
    const speakerId = speakerMap.get(post.id) || 13;

    console.log(
      `[${post.number}/${episode.threads.length}] レス${post.number} (speaker:${speakerId})...`
    );

    try {
      const voiceText = resolveVoicevoxText(post, dictionary);
      await generateWithRetry(voiceText, speakerId, post.effect, outputPath);
      console.log(`  ✓ ${outputPath}`);
      successCount++;
    } catch (error) {
      console.error(
        `  ✗ 失敗: ${error instanceof Error ? error.message : error}`
      );
      failCount++;
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`成功: ${successCount} / 失敗: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("予期せぬエラー:", error);
  process.exit(1);
});
