# 2ch-horror

2ch/5ch風の掲示板UIで怖い話を再現するYouTube動画を、Remotion（React）で自動生成するシステムです。
VOICEVOXで音声を生成し、レスごとの音声と映像を完全に同期させます。

## 必要な環境

- **Node.js** v18以上
- **FFmpeg** インストール済み（Remotionのレンダリングに必要）
- **VOICEVOX ENGINE** v0.14以上（localhost:50021で起動）

## セットアップ

```bash
# 依存パッケージのインストール
npm install
```

### フォントのインストール

動画内で使用するフォント「Noto Sans JP」をインストールしてください。

- Google Fonts からダウンロード: https://fonts.google.com/noto/specimen/Noto+Sans+JP
- ダウンロードしたフォントファイルをシステムにインストール

## ユーザーが手動で用意するもの

### 1. 台本JSON

`data/episodes/` に台本JSONファイルを配置してください。
サンプル（`data/episodes/episode_001.json`）を参考にしてください。

```json
{
  "title": "スレッドタイトル",
  "board": "板名",
  "threads": [
    {
      "number": 1,
      "name": "名無しさん",
      "id": "aBcDeFgH",
      "date": "2024/01/01(月) 00:00:00",
      "text": "本文テキスト",
      "effect": null
    }
  ]
}
```

**readingフィールドの注意:**
- `reading` は VOICEVOX 用の読み仮名テキスト（省略可）
- 感嘆・驚愕の一語「は」「は？」「は！？」は、VOICEVOXが助詞と解釈して「わ」と読んでしまう。カタカナで「ハァ？」「ハッ」と記述すること
- `preprocessForVoicevox` 内の自動変換ルールでも、文頭・句点後の単独「は」「はあ」は自動的にカタカナ（ハッ/ハァ）に変換される

**effect** に指定できる値:
- `null` - エフェクトなし
- `"glitch"` - 画面グリッチ（RGBずれ+ノイズ）
- `"shake"` - 画面振動
- `"redflash"` - 半透明赤オーバーレイ演出
- `"redtext"` - 赤テキスト表示
- `"slowtype"` - タイプライター演出

### 2. BGMファイル

`public/bgm/horror_ambient.mp3` にBGMファイルを配置してください。

### 3. 効果音ファイル

`public/se/` に以下の効果音ファイルを配置してください:
- `glitch.mp3` - グリッチエフェクト用
- `shake.mp3` - 画面振動用
- `redflash.mp3` - レッドフラッシュ用

## VOICEVOXの起動

VOICEVOX ENGINEを起動し、`http://localhost:50021` でアクセスできることを確認してください。

```bash
# Windows: VOICEVOX ENGINEフォルダ内で
run.exe
```

## 動画生成の実行手順

### ステップ1: 音声生成

```bash
npm run generate -- episode_001
```

VOICEVOXを使って各レスの音声ファイル（WAV）を生成します。
出力先: `public/audio/episode_001/`

### ステップ2: メタデータ生成

```bash
npm run metadata -- episode_001
```

音声ファイルのdurationを解析し、各レスの表示タイミングを計算します。
出力先: `data/metadata/episode_001_meta.json`

### ステップ3: 動画レンダリング

```bash
npm run render -- episode_001
```

Remotionで動画をレンダリングします。
出力先: `out/episode_001.mp4`

## Remotion Studioでプレビュー

```bash
npm run studio
```

ブラウザで `http://localhost:3000` を開くと、動画のプレビューができます。
音声ファイルが未生成の場合でもUIのプレビューが可能です（サンプルデータ使用）。

## カスタマイズ

### デザイン変更

`src/constants/design.ts` で以下をカスタマイズできます:
- 色（背景、テキスト、ヘッダーなど）
- フォントサイズ
- タイミング（タイトル表示時間、フェードイン速度など）
- 音量バランス

### VOICEVOXのspeaker_id

`scripts/generate-audio.ts` でキャラクター割り当てを変更できます:
- スレ主: speaker_id 13（青山龍星）
- 住民1: speaker_id 3（ずんだもん）
- 住民2: speaker_id 2（四国めたん）
- 住民3: speaker_id 8（春日部つむぎ）

### 音声パラメータ

`scripts/generate-audio.ts` の `DEFAULT_PARAMS` / `SLOWTYPE_PARAMS` で
読み上げ速度・抑揚などを調整できます。

## クレジット

この動画はVOICEVOXを使用して音声を生成しています。

- VOICEVOX: https://voicevox.hiroshiba.jp/
- 使用キャラクター: ずんだもん、四国めたん、春日部つむぎ、青山龍星 等

動画公開時は各キャラクターの利用規約に従ったクレジット表記をお願いします。
