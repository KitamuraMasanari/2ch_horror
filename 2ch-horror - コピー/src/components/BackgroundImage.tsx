import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { DESIGN } from "../constants/design";

interface BackgroundImageProps {
  episodeId: string;
}

/**
 * モノクロ実写風背景画像。
 * エピソードIDから bg_episode_001.jpg 形式のパスを自動生成。
 * グレースケール + 暗め + コントラスト強めのフィルターを適用。
 * Ken Burns効果は使用しない（完全に静止）。
 * 背景画像が存在しない場合のフォールバックとして #0a0a0a の黒背景を下に敷く。
 */
export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  episodeId,
}) => {
  // episodeId (例: "episode_001") から番号部分を抽出し、bg_episode_001.jpg を生成
  const match = episodeId.match(/(\d+)/);
  const num = match ? match[1].padStart(3, "0") : "001";
  const bgPath = `bg_episode_${num}.jpg`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <Img
        src={staticFile(bgPath)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: DESIGN.BG_FILTER,
          transform: "scale(1)",
        }}
      />
    </AbsoluteFill>
  );
};
