"use client";

import { useState } from "react";
import Link from "next/link";
import { TracingPaper } from "@/components/css/TracingPaper";
import { TouchSlider } from "@/components/common/TouchSlider";
import { TouchCheckbox } from "@/components/common/TouchCheckbox";

export default function TracingPaperPage() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [opacity, setOpacity] = useState(0.4);
  const [blurAmount, setBlurAmount] = useState(8);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* ナビゲーション */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="bg-white/80 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-black transition-colors text-sm font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
        >
          ← ホーム
        </Link>
      </div>

      {/* コントロールパネル */}
      <div className="fixed top-4 right-4 z-50 w-72 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Tracing Paper Effect
        </h2>

        <div className="space-y-4">
          <TouchCheckbox
            id="effect-toggle"
            label="エフェクト有効"
            checked={isEnabled}
            onChange={setIsEnabled}
          />

          <TouchSlider
            label="不透明度"
            value={opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={setOpacity}
            disabled={!isEnabled}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />

          <TouchSlider
            label="ブラー強度"
            value={blurAmount}
            min={0}
            max={30}
            step={0.5}
            onChange={setBlurAmount}
            disabled={!isEnabled}
            formatValue={(v) => `${v}px`}
          />
        </div>

        <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <p>CSS backdrop-filter + SVG Noise Filter</p>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <main className="relative min-h-screen p-8 pb-32 flex flex-col items-center justify-center overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 z-0">
          {/* グラデーション背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950" />

          {/* パターン背景 */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* ランダムな円 */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* コンテンツコンテナ */}
        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左側: 画像コンテンツ */}
          <div className="relative group rounded-xl overflow-hidden shadow-2xl aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=1000&auto=format&fit=crop"
              alt="Sample"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h3 className="text-3xl font-bold mb-2">Nature & Books</h3>
              <p className="text-white/90">読書体験を拡張する静かな空間</p>
            </div>

            {/* トレーシングペーパーオーバーレイ（画像の上のみ） */}
            {isEnabled && (
              <div className="absolute inset-0 transition-all duration-500">
                <TracingPaper
                  className="w-full h-full"
                  opacity={opacity}
                  blurAmount={blurAmount}
                >
                  <div className="w-full h-full flex items-center justify-center p-12">
                    <div className="border border-black/10 dark:border-white/20 p-8 w-full h-full flex flex-col justify-between">
                      <div className="text-xs font-mono tracking-widest text-gray-800 dark:text-gray-200 opacity-70">
                        TRACING PAPER EFFECT
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-serif italic text-gray-900 dark:text-gray-100 leading-relaxed">
                          &quot;The haze of memory layers over the reality,
                          softening the edges.&quot;
                        </p>
                      </div>
                      <div className="text-right text-xs font-mono text-gray-800 dark:text-gray-200 opacity-70">
                        CSS & SVG FILTER
                      </div>
                    </div>
                  </div>
                </TracingPaper>
              </div>
            )}
          </div>

          {/* 右側: テキストコンテンツ */}
          <div className="relative flex flex-col justify-center p-8 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm border border-white/20">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
              Layered
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Reality
              </span>
            </h1>

            <div className="prose dark:prose-invert text-lg leading-relaxed text-gray-700 dark:text-gray-300 space-y-6">
              <p>
                デジタル空間における「質感」の表現は、ユーザーに触覚的な感覚を想起させます。
                トレーシングペーパーのような半透明でざらつきのある素材を重ねることで、
                奥行きと情報の階層を作り出すことができます。
              </p>
              <p>
                このデモでは、WebGPUを使用せずに、標準的なCSSとSVGフィルターのみを使用して
                この効果を実現しています。パフォーマンスと互換性を維持しながら、
                リッチな表現が可能です。
              </p>
            </div>

            <div className="mt-12 flex gap-4">
              <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-90 transition-opacity">
                Read More
              </button>
              <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                Explore
              </button>
            </div>

            {/* テキストエリアの一部にオーバーレイをかける例 */}
            {isEnabled && (
              <div className="absolute -right-4 top-1/4 w-1/2 h-64 transform rotate-3 pointer-events-none">
                <TracingPaper
                  className="w-full h-full rounded-lg shadow-lg"
                  opacity={opacity}
                  blurAmount={blurAmount}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900/50 dark:text-white/50 transform -rotate-3 mix-blend-multiply dark:mix-blend-screen">
                      OVERLAY
                    </span>
                  </div>
                </TracingPaper>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
