"use client";

import { useState } from "react";
import Link from "next/link";
import { TracingPaper, TextureType } from "@/components/css/TracingPaper";
import { TouchSlider } from "@/components/common/TouchSlider";
import { TouchCheckbox } from "@/components/common/TouchCheckbox";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function TracingPaperPage() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [opacity, setOpacity] = useState(0.4);
  const [blurAmount, setBlurAmount] = useState(8);
  const [textureType, setTextureType] = useState<TextureType>("fine");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* ナビゲーション */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <Link
          href="/"
          className="bg-white/80 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-black transition-colors text-sm font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
        >
          ← ホーム
        </Link>
        <ThemeToggle />
      </div>

      {/* コントロールパネル */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 min-w-fit">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
                Tracing Paper
              </h2>
              <TouchCheckbox
                id="effect-toggle"
                label="有効"
                checked={isEnabled}
                onChange={setIsEnabled}
              />
            </div>

            {/* テクスチャ切り替えスイッチ */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTextureType("fine")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  textureType === "fine"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Smooth
              </button>
              <button
                onClick={() => setTextureType("rough")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  textureType === "rough"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Rough
              </button>
            </div>

            <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
              <div className="flex-1">
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
              </div>
              <div className="flex-1">
                <TouchSlider
                  label="ブラー"
                  value={blurAmount}
                  min={0}
                  max={30}
                  step={0.5}
                  onChange={setBlurAmount}
                  disabled={!isEnabled}
                  formatValue={(v) => `${v}px`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <main className="relative min-h-screen p-8 pb-64 flex flex-col items-center justify-center overflow-hidden">
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
              <h3 className="text-3xl font-bold mb-2">Sample Image & Text</h3>
              <p className="text-white/90">サンプルの画像とテキスト</p>
            </div>

            {/* トレーシングペーパーオーバーレイ（画像の上のみ） */}
            {isEnabled && (
              <div className="absolute inset-0 transition-all duration-500">
                <TracingPaper
                  className="w-full h-full"
                  opacity={opacity}
                  blurAmount={blurAmount}
                  textureType={textureType}
                >
                  <div className="w-full h-full flex items-center justify-center p-12">
                    <div className="border border-black/10 dark:border-white/20 p-8 w-full h-full flex flex-col justify-between">
                      <div className="text-xs font-mono tracking-widest text-gray-800 dark:text-gray-200 opacity-70">
                        TRACING PAPER EFFECT
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-serif italic text-gray-900 dark:text-gray-100 leading-relaxed">
                          この文章はトレーシングペーパーの上に表示されています。
                        </p>
                      </div>
                      <div className="text-right text-xs font-mono text-gray-800 dark:text-gray-200 opacity-70">
                        {textureType === "fine"
                          ? "SMOOTH TEXTURE"
                          : "ROUGH TEXTURE"}
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
                このデモでは、標準的なCSSとSVGフィルターのみを使用して
                この効果を実現しています。パフォーマンスと互換性を維持しながら、
                リッチな表現が可能です。
              </p>
            </div>

            {/* テキストエリアの一部にオーバーレイをかける例 */}
            {isEnabled && (
              <div className="absolute z-100 -right-4 top-1/4 w-1/2 h-64 transform rotate-3 pointer-events-none">
                <TracingPaper
                  className="w-full h-full rounded-lg shadow-lg"
                  opacity={opacity}
                  blurAmount={blurAmount}
                  textureType={textureType}
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

        {/* 新しいセクション: 画像アップロード */}
        <div className="w-full max-w-5xl mt-32 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Try with Your Image
          </h2>

          <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group">
            {uploadedImage ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />

                {isEnabled && (
                  <div className="absolute inset-0">
                    <TracingPaper
                      className="w-full h-full"
                      opacity={opacity}
                      blurAmount={blurAmount}
                      textureType={textureType}
                    />
                  </div>
                )}

                {/* Reset Button */}
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/70 transition-colors z-20 backdrop-blur-sm"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-8 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div className="text-6xl mb-4 opacity-50">🖼️</div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  Click to upload an image
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  JPG, PNG, WebP supported
                </p>
              </label>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
