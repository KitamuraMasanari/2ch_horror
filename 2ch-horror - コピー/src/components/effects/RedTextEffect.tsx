// RedTextEffect は ResBody コンポーネント内で処理されるため、
// 独立したコンポーネントとしては使用しない。
// effect === "redtext" の場合、ResBody が赤テキスト + text-shadow を適用する。
// このファイルはエフェクト関連のエクスポート用に残す。

export const RED_TEXT_STYLE: React.CSSProperties = {
  color: "#CC0000",
  textShadow: "0 0 10px rgba(200,0,0,0.5)",
};

import React from "react";
