"use client";

import { useState, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { TouchCheckbox } from "@/components/common/TouchCheckbox";
import { TouchSlider } from "@/components/common/TouchSlider";

type ColorTheme =
  | "rainbow"
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "green"
  | "yellow";

export function CSSBlurEffect() {
  const [animatedBlur, setAnimatedBlur] = useState(0);
  const [animatedBackdropBlur, setAnimatedBackdropBlur] = useState(12);
  const [textBackdropBlur, setTextBackdropBlur] = useState(4); // テキスト部分の背景ブラー用
  const [isPatternAnimated, setIsPatternAnimated] = useState(true);
  const [isBackdropBlurAnimated, setIsBackdropBlurAnimated] = useState(true);
  const [dynamicBackdropBlur, setDynamicBackdropBlur] = useState(12);
  const [patternTime, setPatternTime] = useState(0);
  const [isMounted] = useState(() => typeof window !== "undefined");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("rainbow"); // デフォルトは虹色

  // 背景ブラーのアニメーション
  useEffect(() => {
    if (!isBackdropBlurAnimated || !isMounted) return;

    let animationFrameId: number | null = null;
    const startTime = Date.now();

    // ease-in-out関数（両端でゆっくり、中間で速く）
    const easeInOut = (t: number): number => {
      // tは0から1の範囲
      // ease-in-out: 開始と終了でゆっくり、中間で速く
      return t < 0.5
        ? 2 * t * t // ease-in（前半）
        : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-out（後半）
    };

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;

      // 8秒周期でアニメーション
      const cycleTime = elapsed % 8.0;
      let normalizedValue: number;

      if (cycleTime < 1.0) {
        // 最初の1秒間は0px付近で留まる（ease-in-outでゆっくり開始）
        normalizedValue = 0;
      } else if (cycleTime < 4.0) {
        // 次の3秒で0から最大値へ（ease-in-outで両端でゆっくり、中間で速く）
        const t = (cycleTime - 1.0) / 3.0; // 0から1に正規化
        normalizedValue = easeInOut(t);
      } else if (cycleTime < 4.5) {
        // 次の0.5秒間は最大値付近で留まる
        normalizedValue = 1;
      } else if (cycleTime < 7.5) {
        // 次の3秒で最大値から0へ（ease-in-outで両端でゆっくり、中間で速く）
        const t = (cycleTime - 4.5) / 3.0; // 0から1に正規化
        normalizedValue = 1 - easeInOut(t); // 逆方向
      } else {
        // 残りの0.5秒間は0px付近で留まる（ease-in-outでゆっくり終了）
        normalizedValue = 0;
      }

      // 0から40pxの範囲でマッピング
      // 小数点以下2桁まで保持して、更新を確実にする
      const newBackdropBlur = normalizedValue * 40;
      const roundedBlur = Math.round(newBackdropBlur * 100) / 100; // 小数点以下2桁まで
      setDynamicBackdropBlur(Math.max(0, Math.min(40, roundedBlur)));

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

  // アニメーションが有効かどうかを判定
  const isAnyAnimationActive = isPatternAnimated || isBackdropBlurAnimated;

  // 色の選択肢定義
  const colorOptions = [
    {
      value: "rainbow" as ColorTheme,
      label: "虹色（デフォルト）",
      color:
        "linear-gradient(45deg, hsl(0, 80%, 50%), hsl(60, 80%, 50%), hsl(120, 80%, 50%), hsl(180, 80%, 50%), hsl(240, 80%, 50%), hsl(300, 80%, 50%), hsl(360, 80%, 50%))",
    },
    {
      value: "blue" as ColorTheme,
      label: "青",
      color: "hsl(210, 80%, 50%)",
    },
    {
      value: "red" as ColorTheme,
      label: "赤",
      color: "hsl(0, 80%, 50%)",
    },
    {
      value: "orange" as ColorTheme,
      label: "オレンジ",
      color: "hsl(30, 80%, 50%)",
    },
    {
      value: "purple" as ColorTheme,
      label: "紫",
      color: "hsl(280, 80%, 50%)",
    },
    {
      value: "green" as ColorTheme,
      label: "緑",
      color: "hsl(120, 80%, 50%)",
    },
    {
      value: "yellow" as ColorTheme,
      label: "黄",
      color: "hsl(60, 80%, 50%)",
    },
  ];

  const selectedColor =
    colorOptions.find((opt) => opt.value === colorTheme) || colorOptions[0];

  // 色の基調に基づいて固定の色相を返す関数
  const getFixedHue = (layer: 1 | 2): number => {
    switch (colorTheme) {
      case "rainbow":
        // 虹色: 現在の実装（全色相範囲）を維持
        return layer === 1 ? 120 : 180; // ベース色相のみ返す（後でrowOffsetを加算）
      case "blue":
        // 青: 210度（固定）
        return 210;
      case "red":
        // 赤: 0度（固定）
        return 0;
      case "orange":
        // オレンジ: 30度（固定）
        return 30;
      case "purple":
        // 紫: 280度（固定）
        return 280;
      case "green":
        // 緑: 120度（固定）
        return 120;
      case "yellow":
        // 黄: 60度（固定）
        return 60;
      default:
        return 120;
    }
  };

  return (
    <div className="w-full h-full space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8">
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

                // 色相を取得（虹色の場合は行に応じて変化、それ以外は固定）
                const baseHue = getFixedHue(1);
                const hue =
                  colorTheme === "rainbow"
                    ? (baseHue + row * 30) % 360
                    : baseHue;

                // 周期的なアニメーション（波のような伝播効果）
                const animationCycle = 6.0; // 6秒周期（より長くして伝播を明確に）
                // 負の値も正の値に変換してからモジュロ演算
                const normalizedTime =
                  ((adjustedTime % animationCycle) + animationCycle) %
                  animationCycle;
                // 波のような効果：左端から右端へ伝播する波
                const wavePhase =
                  normalizedTime * ((Math.PI * 2) / animationCycle);

                // 位置に基づくグラデーション（行と列の位置で彩度と明度を変化）
                const rowProgress = row / 11; // 0-1の範囲
                const colProgress = col / 11; // 0-1の範囲
                const positionFactor = (rowProgress + colProgress) / 2; // 0-1の範囲

                // 彩度のグラデーション（位置とアニメーションで変化、0-100%の範囲で白から鮮やかな色まで）
                const baseSaturation = positionFactor * 100; // 0-100%の範囲（白から鮮やかな色まで）
                const saturation =
                  isPatternAnimated && isMounted
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          baseSaturation + Math.sin(wavePhase * 0.8) * 40
                        )
                      ) // アニメーションで±40%変化（0-100%にクランプ）
                    : baseSaturation;

                // 明度のグラデーション（位置とアニメーションで変化、広い範囲で白に近い部分まで含む）
                const baseLightness = 20 + positionFactor * 75; // 20-95%の範囲（暗い部分から白に近い部分まで）
                const lightness =
                  isPatternAnimated && isMounted
                    ? Math.max(
                        10,
                        Math.min(
                          95,
                          baseLightness + Math.cos(wavePhase * 0.9) * 30
                        )
                      ) // アニメーションで±30%変化（10-95%にクランプ）
                    : baseLightness;

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

                // 色相を取得（虹色の場合は行に応じて変化、それ以外は固定）
                const baseHue = getFixedHue(2);
                const hue =
                  colorTheme === "rainbow"
                    ? (baseHue + row * 30) % 360
                    : baseHue;

                // 周期的なアニメーション（波のような伝播効果、第1レイヤーと異なる位相）
                const animationCycle = 6.5; // 6.5秒周期（第1レイヤーと異なる）
                // 負の値も正の値に変換してからモジュロ演算
                const normalizedTime =
                  ((adjustedTime % animationCycle) + animationCycle) %
                  animationCycle;
                // 波のような効果：左端から右端へ伝播する波
                const wavePhase =
                  normalizedTime * ((Math.PI * 2) / animationCycle);

                // 位置に基づくグラデーション（行と列の位置で彩度と明度を変化、第2レイヤーは逆方向）
                const rowProgress = row / 11; // 0-1の範囲
                const colProgress = col / 11; // 0-1の範囲
                const positionFactor = 1 - (rowProgress + colProgress) / 2; // 0-1の範囲（逆方向）

                // 彩度のグラデーション（位置とアニメーションで変化、0-100%の範囲で白から鮮やかな色まで）
                const baseSaturation = (1 - positionFactor) * 100; // 0-100%の範囲（逆方向、白から鮮やかな色まで）
                const saturation =
                  isPatternAnimated && isMounted
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          baseSaturation + Math.cos(wavePhase * 0.7) * 35
                        )
                      ) // アニメーションで±35%変化（0-100%にクランプ）
                    : baseSaturation;

                // 明度のグラデーション（位置とアニメーションで変化、広い範囲で白に近い部分まで含む）
                const baseLightness = 15 + (1 - positionFactor) * 80; // 15-95%の範囲（逆方向、暗い部分から白に近い部分まで）
                const lightness =
                  isPatternAnimated && isMounted
                    ? Math.max(
                        10,
                        Math.min(
                          95,
                          baseLightness + Math.sin(wavePhase * 1.0) * 25
                        )
                      ) // アニメーションで±25%変化（10-95%にクランプ）
                    : baseLightness;

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
                backdropFilter: `blur(0px)`,
                WebkitBackdropFilter: `blur(0px)`,
                transition: "backdrop-filter 0.3s ease",
              }}
            />
          </div>
          {/* 全体背景ブラー用のレイヤー */}
          <div
            className="absolute inset-0"
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
                ? "none"
                : "backdrop-filter 0.3s ease",
              willChange: isBackdropBlurAnimated ? "backdrop-filter" : "auto",
            }}
          />
          {/* テキスト部分（背景パターンの上に直接配置） */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className="bg-white/20 dark:bg-black/20 rounded-lg p-4 sm:p-6 md:p-8 text-center"
              style={{
                filter: `blur(${animatedBlur}px)`,
                backdropFilter: `blur(${textBackdropBlur}px)`,
                WebkitBackdropFilter: `blur(${textBackdropBlur}px)`,
                transition: "filter 0.3s ease, backdrop-filter 0.3s ease",
              }}
            >
              <h3 className="text-4xl font-bold text-white drop-shadow-lg">
                {isAnyAnimationActive ? "Animated " : ""}Blur Effect
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                背景パターンの色
              </label>
              <Listbox value={colorTheme} onChange={setColorTheme}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <span className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                        style={{
                          background: selectedColor.color,
                        }}
                      />
                      <span className="block truncate text-gray-900 dark:text-gray-100">
                        {selectedColor.label}
                      </span>
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-in"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {colorOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                              active
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                                : "text-gray-900 dark:text-gray-100"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                                style={{
                                  background: option.color,
                                }}
                              />
                              <span
                                className={`block truncate ${
                                  selected ? "font-medium" : "font-normal"
                                }`}
                              >
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400">
                                  <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <TouchCheckbox
              id="pattern-animate-toggle"
              checked={isPatternAnimated}
              onChange={setIsPatternAnimated}
              label="背景パターンアニメーションを有効化"
            />

            <TouchCheckbox
              id="backdrop-blur-animate-toggle"
              checked={isBackdropBlurAnimated}
              onChange={setIsBackdropBlurAnimated}
              label="背景ブラーアニメーションを有効化"
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            <TouchSlider
              label="テキストブラー"
              value={animatedBlur}
              onChange={setAnimatedBlur}
              min={0}
              max={40}
              step={0.5}
              formatValue={(val) => `${val}px`}
            />

            <TouchSlider
              label="テキスト背景ブラー"
              value={textBackdropBlur}
              onChange={setTextBackdropBlur}
              min={0}
              max={40}
              step={0.5}
              formatValue={(val) => `${val}px`}
            />

            <TouchSlider
              label="全体背景ブラー"
              value={
                isBackdropBlurAnimated
                  ? dynamicBackdropBlur
                  : animatedBackdropBlur
              }
              onChange={(value) => {
                setAnimatedBackdropBlur(value);
                setDynamicBackdropBlur(value);
              }}
              min={0}
              max={40}
              step={0.5}
              disabled={isBackdropBlurAnimated}
              formatValue={(val) =>
                `${isBackdropBlurAnimated ? val.toFixed(1) : val}px`
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
