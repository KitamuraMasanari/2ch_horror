export const COLORS = {
  // 背景系
  BG_PRIMARY: '#0a0a0c',
  BG_SECONDARY: '#111115',

  // テキストボックス
  TEXTBOX_BG: 'rgba(10, 10, 10, 0.92)',
  TEXTBOX_BORDER: 'rgba(255, 255, 255, 0.7)',
  TEXTBOX_SHADOW: '0 0 20px rgba(0,0,0,0.6), 0 0 60px rgba(0,0,0,0.3)',

  // テキスト系
  TEXT_PRIMARY: '#EEEEEE',
  TEXT_SECONDARY: '#888888',
  TEXT_ANCHOR: '#5c8cc6',
  TEXT_TITLE: '#CC0000',
  TEXT_RES_HEADER: 'rgba(255,255,255,0.5)',

  // アクセント
  ACCENT_RED: '#cc0000',

  // エフェクト系
  VIGNETTE: 'rgba(0, 0, 0, 0.7)',
  NOISE_OPACITY: 0.04,

  // Redtext エフェクト
  REDTEXT_BG: 'rgba(40, 0, 0, 0.95)',
  REDTEXT_COLOR: '#CC0000',
  REDTEXT_BORDER: 'rgba(200, 0, 0, 0.5)',
} as const;

export const DESIGN = {
  // 解像度
  WIDTH: 1920,
  HEIGHT: 1080,
  FPS: 30,

  // タイミング
  TITLE_DURATION_FRAMES: 240,
  ENDING_DURATION_FRAMES: 150,
  RES_FADE_IN_FRAMES: 10,
  RES_FADE_OUT_FRAMES: 8,
  RES_GAP_FRAMES: 5,

  // テキストボックス
  TEXTBOX_WIDTH_PERCENT: 72,
  TEXTBOX_MAX_HEIGHT_PERCENT: 60,
  TEXTBOX_PADDING: '40px 50px',
  TEXTBOX_BORDER_RADIUS: 8,

  // フォント
  FONT_FAMILY: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  BODY_FONT_SIZE: 34,
  BODY_LINE_HEIGHT: 1.9,
  BODY_FONT_WEIGHT: 500,
  HEADER_FONT_SIZE: 15,
  TITLE_FONT_SIZE: 40,

  // パーティクル
  PARTICLE_COUNT: 8,

  // 背景フィルター
  BG_FILTER: 'brightness(0.35) contrast(1.05) saturate(0.7)',

  // 音声
  BGM_VOLUME: 0.04,
  BGM_VOLUME_MAIN: 0.035,
  RES_AUDIO_VOLUME: 0.9,
  SE_VOLUME: 0.5,
  RES_APPEAR_SE_VOLUME: 0.4,
} as const;
