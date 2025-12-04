"use client";

import React from "react";

export type TextureType = "fine" | "rough";

interface TracingPaperProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
  blurAmount?: number;
  textureType?: TextureType;
  baseFrequency?: number | string;
  numOctaves?: number;
}

export function TracingPaper({
  className = "",
  children,
  opacity = 0.4,
  blurAmount = 8,
  textureType = "rough",
  baseFrequency: propBaseFrequency,
  numOctaves: propNumOctaves,
}: TracingPaperProps) {
  const filterId = React.useId();
  const noiseId = `noise-${filterId}`;

  // ノイズパラメータの設定
  const noiseParams = {
    fine: {
      baseFrequency: "0.8 0.01",
      numOctaves: "3",
      type: "fractalNoise" as const,
    },
    rough: {
      baseFrequency: "0.02 0.5",
      numOctaves: "50",
      type: "fractalNoise" as const, // 荒い紙の質感を出すためにfractalNoiseを使用
    },
  };

  const defaultParams = noiseParams[textureType];
  const baseFrequency =
    propBaseFrequency?.toString() ?? defaultParams.baseFrequency;
  const numOctaves = propNumOctaves?.toString() ?? defaultParams.numOctaves;
  const type = defaultParams.type;

  // Safari対策: パラメータが変わるたびにIDを変更して強制的に再描画させる
  // ただし、パフォーマンスへの影響を考慮し、過度な変更は避ける
  const uniqueKey = `${textureType}-${baseFrequency}-${numOctaves}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`, // Safari用
      }}
    >
      {/* ノイズ生成用のSVG (iOS対策としてHTML要素にfilterをかけるのではなく、SVGのrectを表示する) */}
      <svg
        key={uniqueKey}
        className="absolute inset-0 pointer-events-none z-0 w-full h-full opacity-40 mix-blend-overlay"
        style={{
          // Safariでの再描画トリガー用ハック
          transform: "translateZ(0)",
        }}
      >
        <filter id={noiseId} x="0" y="0" width="100%" height="100%">
          {/* 紙の繊維感のような細かなノイズ */}
          <feTurbulence
            type={type}
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            stitchTiles="noStitch"
            result="noise"
          />

          {/* 粗い紙の場合はライティング効果を追加して立体感を出す */}
          {textureType === "rough" && (
            <>
              <feDiffuseLighting
                in="noise"
                lightingColor="white"
                surfaceScale="2"
                result="diffuseNoise"
              >
                <feDistantLight azimuth="45" elevation="60" />
              </feDiffuseLighting>
            </>
          )}

          {/* ノイズのコントラスト調整とグレースケール化 */}
          <feColorMatrix
            type="matrix"
            // R, G, B の値を統一してグレースケール化（虹色ノイズの防止）
            // ここではGチャンネルの値を採用
            values="0 1 0 0 0
                    0 1 0 0 0
                    0 1 0 0 0
                    0 0 0 0.5 0"
            in={textureType === "rough" ? "diffuseNoise" : "noise"}
            result="coloredNoise"
          />
        </filter>

        {/* フィルターを適用したRectを描画 */}
        <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
      </svg>

      {/* コンテンツ */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
