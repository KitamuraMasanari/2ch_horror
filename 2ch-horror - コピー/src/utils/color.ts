/**
 * ID文字列からハッシュ値を算出し、HSL色相（Hue）を返す。
 * 同じIDは常に同じ色相になる（ハッシュベース）。
 */
function idToHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 360;
}

/**
 * 左ボーダー用の色（鮮やかめ）
 * hsl(hue, 70%, 50%)
 */
export function idToBorderColor(id: string): string {
  const hue = idToHue(id);
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * ID文字列テキスト用の色（明るめで読みやすい）
 * hsl(hue, 60%, 65%)
 */
export function idToTextColor(id: string): string {
  const hue = idToHue(id);
  return `hsl(${hue}, 60%, 65%)`;
}

/**
 * ヘッダーID部分の背景ハイライト用
 * hsla(hue, 70%, 50%, 0.3)
 */
export function idToHighlightBg(id: string): string {
  const hue = idToHue(id);
  return `hsla(${hue}, 70%, 50%, 0.3)`;
}

/**
 * 後方互換: 既存のHEX色変換（使わなくなった場合でも残す）
 */
export function idToColor(id: string): string {
  const hue = idToHue(id);
  return hslToHex(hue, 50, 55);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
