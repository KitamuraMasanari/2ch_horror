import * as fs from "fs";
import * as path from "path";

/**
 * 辞書に読み仮名エントリを追加するスクリプト
 * 値はカタカナで保存（VOICEVOXの辞書APIはカタカナ必須のため）
 * ひらがなで入力された場合は自動でカタカナに変換する
 *
 * 使い方: npm run dict:add -- "御神体" "ゴシンタイ"
 *         npm run dict:add -- "御神体" "ごしんたい"  ← 自動でカタカナに変換
 */

const DICT_PATH = path.resolve("data/dictionary.json");

/**
 * ひらがなをカタカナに変換する
 * カタカナや漢字はそのまま保持
 */
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );
}

/**
 * 文字列がひらがなを含むかチェック
 */
function containsHiragana(str: string): boolean {
  return /[\u3041-\u3096]/.test(str);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("使い方: npm run dict:add -- \"漢字\" \"カタカナ\"");
    console.error("例:     npm run dict:add -- \"御神体\" \"ゴシンタイ\"");
    console.error("        npm run dict:add -- \"御神体\" \"ごしんたい\"  ← 自動カタカナ変換");
    process.exit(1);
  }

  const [word, rawReading] = args;

  // ひらがなが含まれていたら自動でカタカナに変換
  let reading = rawReading;
  if (containsHiragana(rawReading)) {
    reading = hiraganaToKatakana(rawReading);
    console.log(`ひらがな→カタカナ変換: "${rawReading}" → "${reading}"`);
  }

  // 辞書ファイルの読み込み（なければ空オブジェクト）
  let dictionary: Record<string, string> = {};
  if (fs.existsSync(DICT_PATH)) {
    dictionary = JSON.parse(fs.readFileSync(DICT_PATH, "utf-8"));
  }

  // 既存エントリの確認
  if (dictionary[word]) {
    console.log(`上書き: "${word}" : "${dictionary[word]}" → "${reading}"`);
  } else {
    console.log(`追加: "${word}" → "${reading}"`);
  }

  // エントリを追加/更新
  dictionary[word] = reading;

  // キーをソートして保存（見やすさのため）
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(dictionary).sort()) {
    sorted[key] = dictionary[key];
  }

  // 書き込み
  fs.mkdirSync(path.dirname(DICT_PATH), { recursive: true });
  fs.writeFileSync(DICT_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf-8");

  console.log(`辞書を保存しました: ${DICT_PATH} (${Object.keys(sorted).length}件)`);
}

main();
