import * as fs from "fs";
import * as path from "path";

/**
 * VOICEVOXユーザー辞書同期スクリプト
 *
 * data/dictionary.json の内容を VOICEVOX ENGINE のユーザー辞書APIに一括登録する。
 * 既に同じ surface（表層形）が登録済みの場合はスキップする。
 *
 * 使い方:
 *   npm run dict:sync
 *   npx tsx scripts/sync-dictionary.ts
 */

const VOICEVOX_URL = "http://localhost:50021";
const DICT_PATH = path.resolve("data/dictionary.json");

interface VoicevoxDictWord {
  surface: string;
  pronunciation: string;
  accent_type: number;
  word_type: string;
  priority: number;
  mora_count?: number;
  context_id?: number;
  part_of_speech?: string;
  part_of_speech_detail_1?: string;
  part_of_speech_detail_2?: string;
  part_of_speech_detail_3?: string;
  inflectional_type?: string;
  inflectional_form?: string;
  stem?: string;
  yomi?: string;
  accent_associative_rule?: string;
}

/**
 * VOICEVOXのユーザー辞書から登録済みの単語一覧を取得
 */
async function getRegisteredWords(): Promise<Record<string, VoicevoxDictWord>> {
  const res = await fetch(`${VOICEVOX_URL}/user_dict`);
  if (!res.ok) {
    throw new Error(`GET /user_dict failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

/**
 * VOICEVOXのユーザー辞書に単語を追加
 */
async function addWord(
  surface: string,
  pronunciation: string
): Promise<string> {
  const params = new URLSearchParams({
    surface,
    pronunciation,
    accent_type: "0",
    word_type: "PROPER_NOUN",
    priority: "10",
  });

  const res = await fetch(`${VOICEVOX_URL}/user_dict_word?${params}`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `POST /user_dict_word failed for "${surface}": ${res.status} ${errorText}`
    );
  }

  // 成功時はword_uuidが返る
  const uuid = await res.text();
  return uuid.replace(/"/g, "");
}

/**
 * dictionary.json を読み込み、VOICEVOXユーザー辞書に同期する
 */
export async function syncDictionary(): Promise<void> {
  // 辞書ファイルの読み込み
  if (!fs.existsSync(DICT_PATH)) {
    console.log("辞書ファイルなし: data/dictionary.json（スキップ）");
    return;
  }

  const dictionary: Record<string, string> = JSON.parse(
    fs.readFileSync(DICT_PATH, "utf-8")
  );
  const entries = Object.entries(dictionary);

  if (entries.length === 0) {
    console.log("辞書エントリなし（スキップ）");
    return;
  }

  console.log(`\n=== VOICEVOX辞書同期 ===`);
  console.log(`辞書エントリ数: ${entries.length}`);

  // 現在のVOICEVOX辞書を取得
  const registeredWords = await getRegisteredWords();

  // 登録済みsurfaceのセットを作成
  const registeredSurfaces = new Set<string>();
  for (const word of Object.values(registeredWords)) {
    registeredSurfaces.add(word.surface);
  }

  console.log(`VOICEVOX辞書の登録済み単語数: ${registeredSurfaces.size}`);

  // 各エントリを処理
  let addedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const [surface, pronunciation] of entries) {
    if (registeredSurfaces.has(surface)) {
      skippedCount++;
      continue;
    }

    try {
      const uuid = await addWord(surface, pronunciation);
      console.log(`  ✓ 追加: "${surface}" → ${pronunciation} (${uuid})`);
      addedCount++;
    } catch (error) {
      console.error(
        `  ✗ 失敗: "${surface}" → ${pronunciation}: ${
          error instanceof Error ? error.message : error
        }`
      );
      failedCount++;
    }
  }

  console.log(
    `辞書同期完了: 追加=${addedCount} / スキップ=${skippedCount} / 失敗=${failedCount}\n`
  );
}

/**
 * スタンドアロン実行時のエントリポイント
 */
async function main() {
  // VOICEVOXの起動確認
  try {
    const res = await fetch(`${VOICEVOX_URL}/version`);
    if (!res.ok) throw new Error("not ok");
    const version = await res.text();
    console.log(`VOICEVOX ENGINE detected: v${version}`);
  } catch {
    console.error(
      "エラー: VOICEVOX ENGINE が起動していません。\n" +
        "VOICEVOX ENGINE を http://localhost:50021 で起動してから再実行してください。"
    );
    process.exit(1);
  }

  await syncDictionary();
}

// スタンドアロン実行判定
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("sync-dictionary.ts") ||
    process.argv[1].endsWith("sync-dictionary"));

if (isMain) {
  main().catch((error) => {
    console.error("予期せぬエラー:", error);
    process.exit(1);
  });
}
