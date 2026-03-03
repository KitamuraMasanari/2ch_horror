// SlowTypeEffect のロジックは ResBody コンポーネント内で処理される。
// effect === "slowtype" の場合、ResBody がタイプライター表示を行う。
// このファイルはエフェクト関連の定数エクスポート用に残す。

export const SLOW_TYPE_CONFIG = {
  /** 1文字あたりのフレーム数 */
  FRAMES_PER_CHAR: 3.5,
  /** 一時停止の長さ（フレーム） */
  PAUSE_FRAMES: 15,
  /** 最大停止回数 */
  MAX_PAUSES: 3,
} as const;
