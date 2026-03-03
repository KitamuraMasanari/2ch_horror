import React, { useRef, useEffect } from "react";
import { useCurrentFrame } from "remotion";

interface TVStaticProps {
  opacity?: number;
}

/**
 * テレビ砂嵐（スノーノイズ）エフェクト。
 * Canvas で毎フレームランダムピクセルノイズを生成。
 * 解像度は960x540（半分）にしてパフォーマンス確保＋自然なボケ感。
 */
export const TVStatic: React.FC<TVStaticProps> = ({ opacity = 0.15 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // シード値をフレームごとに変えてランダム感を出す
    let seed = frame * 9301 + 49297;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.floor(random() * 255);
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 255;   // A
    }

    ctx.putImageData(imageData, 0, 0);
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={540}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};
