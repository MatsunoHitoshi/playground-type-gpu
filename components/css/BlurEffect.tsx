"use client";

import { useState, useEffect } from "react";

export function CSSBlurEffect() {
  const [blurAmount, setBlurAmount] = useState(5);
  const [backdropBlur, setBackdropBlur] = useState(10);
  const [animatedBlur, setAnimatedBlur] = useState(0);
  const [animatedBackdropBlur, setAnimatedBackdropBlur] = useState(12);
  const [isPatternAnimated, setIsPatternAnimated] = useState(true);
  const [isBackdropBlurAnimated, setIsBackdropBlurAnimated] = useState(true);
  const [dynamicBackdropBlur, setDynamicBackdropBlur] = useState(12);
  const [patternTime, setPatternTime] = useState(0);
  const [isMounted] = useState(() => typeof window !== "undefined");

  // 背景ブラーのアニメーション
  useEffect(() => {
    if (!isBackdropBlurAnimated || !isMounted) return;

    let animationFrameId: number | null = null;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;

      // カスタム関数で0px付近でより長く留まるようにする
      // 周期を長くして、0pxの時間を長くする
      const cycleTime = elapsed % 8.0; // 8秒周期
      let normalizedValue: number;

      if (cycleTime < 2.0) {
        // 最初の2秒間は0px付近で留まる
        normalizedValue = 0;
      } else if (cycleTime < 3.0) {
        // 次の1秒で0から最大値へ
        const t = (cycleTime - 2.0) / 1.0;
        normalizedValue = Math.sin((t * Math.PI) / 2); // ease-in
      } else if (cycleTime < 5.0) {
        // 次の2秒間は最大値付近で留まる
        normalizedValue = 1;
      } else if (cycleTime < 6.0) {
        // 次の1秒で最大値から0へ
        const t = (cycleTime - 5.0) / 1.0;
        normalizedValue = Math.cos((t * Math.PI) / 2); // ease-out
      } else {
        // 残りの2秒間は0px付近で留まる
        normalizedValue = 0;
      }

      // 0から40pxの範囲でマッピング
      const newBackdropBlur = normalizedValue * 40;
      setDynamicBackdropBlur(Math.max(0, Math.min(40, newBackdropBlur)));

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isBackdropBlurAnimated, isMounted]);

  // 背景パターンのアニメーション（タイルの色が変化）
  useEffect(() => {
    if (!isPatternAnimated || !isMounted) return;

    let animationFrameId: number | null = null;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setPatternTime(elapsed);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPatternAnimated, isMounted]);

  return (
    <div className="w-full h-full space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* 背景画像付きコンテナ */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        {/* 背景パターン */}
        <div className="absolute inset-0 opacity-30">
          <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/20"
                style={{
                  backgroundColor: `hsl(${(i * 5) % 360}, 70%, 50%)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ブラー効果を適用したオーバーレイ */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backdropFilter: `blur(${backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${backdropBlur}px)`,
          }}
        >
          <div
            className="bg-white/20 dark:bg-black/20 rounded-lg p-4 sm:p-6 md:p-8 backdrop-blur-sm"
            style={{
              filter: `blur(${blurAmount}px)`,
            }}
          >
            <h3 className="text-4xl font-bold text-white drop-shadow-lg">
              Blur Effect
            </h3>
            <p className="text-white/90 mt-2 text-lg">
              CSS filter と backdrop-filter の組み合わせ
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          CSS Filter Blur
        </h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Blur Amount: {blurAmount}px
          </label>
          <input
            type="range"
            min="0"
            max="40"
            value={blurAmount}
            onChange={(e) => setBlurAmount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Backdrop Blur: {backdropBlur}px
          </label>
          <input
            type="range"
            min="0"
            max="40"
            value={backdropBlur}
            onChange={(e) => setBackdropBlur(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* 複数のブラー効果の例 */}
      {/* <div className="grid grid-cols-3 gap-4">
        {[0, 5, 10].map((blur) => (
          <div key={blur} className="relative h-48 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600" />
            <div
              className="absolute inset-0 flex items-center justify-center bg-white/10"
              style={{
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
              }}
            >
              <span className="text-white font-semibold text-lg">
                {blur}px blur
              </span>
            </div>
          </div>
        ))}
      </div> */}

      {/* アニメーション付きブラー */}
      <div className="space-y-4" suppressHydrationWarning>
        {/* アニメーション表示部分 */}
        <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gradient-to-r from-green-400 to-blue-500">
          {/* 背景パターン（アニメーション付き - タイルの色が変化） */}
          <div className="absolute inset-0 opacity-70">
            <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
              {Array.from({ length: 144 }).map((_, i) => {
                // 各タイルの色を時間に応じて計算（左から右へ伝播するアニメーション）
                const time = isMounted && isPatternAnimated ? patternTime : 0;
                const col = i % 12; // 列インデックス（0-11）
                const row = Math.floor(i / 12); // 行インデックス（0-11）

                // 左端のタイルから0.5秒ごとに右へ伝播（各列で0.5秒遅延）
                const delay = col * 0.5;
                // 周期的なアニメーションなので、負の値も許容（モジュロ演算で処理）
                const adjustedTime =
                  isPatternAnimated && isMounted ? time - delay : 0;

                // 左端のタイルの色を計算（時間に応じて周期的に変化）
                const baseHue = (row * 30 + 120) % 360;
                // 周期的なアニメーション（波のような伝播効果）
                const animationCycle = 6.0; // 6秒周期（より長くして伝播を明確に）
                // 負の値も正の値に変換してからモジュロ演算
                const normalizedTime =
                  ((adjustedTime % animationCycle) + animationCycle) %
                  animationCycle;
                // 波のような効果：左端から右端へ伝播する波
                const wavePhase =
                  normalizedTime * ((Math.PI * 2) / animationCycle);
                const hueOffset =
                  isPatternAnimated && isMounted
                    ? Math.sin(wavePhase) * 120 // より大きな色相変化
                    : 0;
                const hue = (baseHue + hueOffset) % 360;

                // 左端から伝播する色の変化（明るめの色をベースに）
                const saturation =
                  isPatternAnimated && isMounted
                    ? 50 + Math.sin(wavePhase * 0.8) * 40 // より鮮やかな彩度変化
                    : 80;
                const lightness =
                  isPatternAnimated && isMounted
                    ? 50 + Math.cos(wavePhase * 0.9) * 35 // より明るい明度変化
                    : 70;

                // キーにpatternTimeを含めて強制的に再レンダリングをトリガー
                const tileKey = `${i}-${Math.floor(patternTime * 10)}`;

                return (
                  <div
                    key={tileKey}
                    className="border border-white/50"
                    suppressHydrationWarning
                    style={{
                      backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                      transition:
                        isPatternAnimated && isMounted
                          ? "background-color 0.1s linear"
                          : "background-color 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>
          {/* 追加の背景パターンレイヤー（より自然な靄の動き） */}
          <div className="absolute inset-0 opacity-40">
            <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
              {Array.from({ length: 144 }).map((_, i) => {
                // 第2レイヤーの色を時間に応じて計算（左から右へ伝播、異なる位相で）
                const time = isMounted && isPatternAnimated ? patternTime : 0;
                const col = i % 12; // 列インデックス（0-11）
                const row = Math.floor(i / 12); // 行インデックス（0-11）

                // 左端のタイルから0.5秒ごとに右へ伝播（各列で0.5秒遅延、第2レイヤーは少し異なる位相）
                const delay = col * 0.5 + 0.25; // 第2レイヤーは0.25秒ずらす
                // 周期的なアニメーションなので、負の値も許容（モジュロ演算で処理）
                const adjustedTime =
                  isPatternAnimated && isMounted ? time - delay : 0;

                // 左端のタイルの色を計算（時間に応じて周期的に変化）
                const baseHue = (row * 30 + 180) % 360;
                // 周期的なアニメーション（波のような伝播効果、第1レイヤーと異なる位相）
                const animationCycle = 6.5; // 6.5秒周期（第1レイヤーと異なる）
                // 負の値も正の値に変換してからモジュロ演算
                const normalizedTime =
                  ((adjustedTime % animationCycle) + animationCycle) %
                  animationCycle;
                // 波のような効果：左端から右端へ伝播する波
                const wavePhase =
                  normalizedTime * ((Math.PI * 2) / animationCycle);
                const hueOffset =
                  isPatternAnimated && isMounted
                    ? Math.cos(wavePhase) * 100 // より大きな色相変化
                    : 0;
                const hue = (baseHue + hueOffset) % 360;

                // 左端から伝播する色の変化（明るめの色をベースに）
                const saturation =
                  isPatternAnimated && isMounted
                    ? 45 + Math.cos(wavePhase * 0.7) * 35 // より鮮やかな彩度変化
                    : 70;
                const lightness =
                  isPatternAnimated && isMounted
                    ? 50 + Math.sin(wavePhase * 1.0) * 30 // より明るい明度変化
                    : 65;

                // キーにpatternTimeを含めて強制的に再レンダリングをトリガー
                const tileKey2 = `layer2-${i}-${Math.floor(patternTime * 10)}`;

                return (
                  <div
                    key={tileKey2}
                    className="border border-white/30"
                    suppressHydrationWarning
                    style={{
                      backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                      transition:
                        isPatternAnimated && isMounted
                          ? "background-color 0.1s linear"
                          : "background-color 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-white/20"
              style={{
                backdropFilter: `blur(${animatedBlur}px)`,
                WebkitBackdropFilter: `blur(${animatedBlur}px)`,
                transition: "backdrop-filter 0.3s ease",
              }}
            />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backdropFilter: `blur(${
                isBackdropBlurAnimated
                  ? dynamicBackdropBlur
                  : animatedBackdropBlur
              }px)`,
              WebkitBackdropFilter: `blur(${
                isBackdropBlurAnimated
                  ? dynamicBackdropBlur
                  : animatedBackdropBlur
              }px)`,
              transition: isBackdropBlurAnimated
                ? "backdrop-filter 0.1s linear"
                : "backdrop-filter 0.3s ease",
            }}
          >
            <div
              className="bg-white/20 dark:bg-black/20 rounded-lg p-4 sm:p-6 md:p-8 backdrop-blur-sm text-center"
              style={{
                filter: `blur(${animatedBlur}px)`,
                transition: "filter 0.3s ease",
              }}
            >
              <h3 className="text-4xl font-bold text-white drop-shadow-lg">
                Animated Blur Effect
              </h3>
            </div>
          </div>
        </div>

        {/* アニメーション用のコントロール */}
        <div className="w-full space-y-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            アニメーションBlur設定
          </h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pattern-animate-toggle"
                checked={isPatternAnimated}
                onChange={(e) => setIsPatternAnimated(e.target.checked)}
                className="w-4 h-4"
              />
              <label
                htmlFor="pattern-animate-toggle"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                背景パターンアニメーションを有効化
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="backdrop-blur-animate-toggle"
                checked={isBackdropBlurAnimated}
                onChange={(e) => setIsBackdropBlurAnimated(e.target.checked)}
                className="w-4 h-4"
              />
              <label
                htmlFor="backdrop-blur-animate-toggle"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                背景ブラーアニメーションを有効化
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blur: {animatedBlur}px
            </label>
            <input
              type="range"
              min="0"
              max="40"
              step="0.5"
              value={animatedBlur}
              onChange={(e) => setAnimatedBlur(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Backdrop Blur:{" "}
              {isBackdropBlurAnimated
                ? dynamicBackdropBlur.toFixed(1)
                : animatedBackdropBlur}
              px
            </label>
            <input
              type="range"
              min="0"
              max="40"
              step="0.5"
              value={
                isBackdropBlurAnimated
                  ? dynamicBackdropBlur
                  : animatedBackdropBlur
              }
              onChange={(e) => {
                const value = Number(e.target.value);
                setAnimatedBackdropBlur(value);
                setDynamicBackdropBlur(value);
              }}
              disabled={isBackdropBlurAnimated}
              className="w-full disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
