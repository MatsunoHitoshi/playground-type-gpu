"use client";

import React from "react";

export type TextureType = "fine" | "rough";

interface TracingPaperProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
  blurAmount?: number;
  textureType?: TextureType;
}

export function TracingPaper({
  className = "",
  children,
  opacity = 0.4,
  blurAmount = 8,
  textureType = "fine",
}: TracingPaperProps) {
  const filterId = React.useId();
  const noiseId = `noise-${filterId}`;

  // ノイズパラメータの設定
  const noiseParams = {
    fine: {
      baseFrequency: "0.8",
      numOctaves: "3",
      type: "fractalNoise" as const,
    },
    rough: {
      baseFrequency: "0.04",
      numOctaves: "50",
      type: "fractalNoise" as const, // 荒い紙の質感を出すためにfractalNoiseを使用
    },
  };

  const params = noiseParams[textureType];

  return (
    <>
      {/* ノイズ生成用のSVGフィルター定義 */}
      <svg className="hidden fixed">
        <filter id={noiseId}>
          {/* 紙の繊維感のような細かなノイズ */}
          <feTurbulence
            type={params.type}
            baseFrequency={params.baseFrequency}
            numOctaves={params.numOctaves}
            stitchTiles="stitch"
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
      </svg>

      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          backdropFilter: `blur(${blurAmount}px)`,
          WebkitBackdropFilter: `blur(${blurAmount}px)`, // Safari用
        }}
      >
        {/* ノイズレイヤー */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-overlay"
          style={{
            filter: `url(#${noiseId})`,
          }}
        />

        {/* コンテンツ */}
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
}
