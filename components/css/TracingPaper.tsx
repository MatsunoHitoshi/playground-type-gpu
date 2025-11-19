"use client";

import React from "react";

interface TracingPaperProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
  blurAmount?: number;
}

export function TracingPaper({
  className = "",
  children,
  opacity = 0.4,
  blurAmount = 8,
}: TracingPaperProps) {
  const filterId = React.useId();
  const turbulenceId = `turbulence-${filterId}`;
  const noiseId = `noise-${filterId}`;

  return (
    <>
      {/* ノイズ生成用のSVGフィルター定義 */}
      <svg className="hidden fixed">
        <filter id={noiseId}>
          {/* 紙の繊維感のような細かなノイズ */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          {/* ノイズのコントラスト調整 */}
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.5 0"
            in="noise"
            result="coloredNoise"
          />
          {/* ノイズを少しぼかして馴染ませる */}
          {/* <feGaussianBlur stdDeviation="0.5" in="coloredNoise" /> */}
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
