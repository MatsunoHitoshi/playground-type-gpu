"use client";

import { useState } from "react";
import Link from "next/link";
import { TracingPaper, TextureType } from "@/components/css/TracingPaper";
import { TouchSlider } from "@/components/common/TouchSlider";
import { TouchPad } from "@/components/common/TouchPad";
import { TouchCheckbox } from "@/components/common/TouchCheckbox";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function TracingPaperPage() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [opacity, setOpacity] = useState(0.4);
  const [blurAmount, setBlurAmount] = useState(8);
  const [textureType, setTextureType] = useState<TextureType>("rough");
  const [baseFrequencyX, setBaseFrequencyX] = useState(0.04);
  const [baseFrequencyY, setBaseFrequencyY] = useState(0.04);
  const [numOctaves, setNumOctaves] = useState(3);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [paperWidth, setPaperWidth] = useState(100);
  const [paperHeight, setPaperHeight] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleTextureChange = (type: TextureType) => {
    setTextureType(type);
    if (type === "fine") {
      setBaseFrequencyX(0.8);
      setBaseFrequencyY(0.8);
      setNumOctaves(3);
    } else {
      setBaseFrequencyX(0.04);
      setBaseFrequencyY(0.04);
      setNumOctaves(50);
    }
  };

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
      <div
        className={`fixed bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-50 mx-auto max-w-4xl transition-all duration-300 ease-in-out ${
          isFullscreen ? "z-[100]" : ""
        }`}
      >
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex flex-col">
            {/* ヘッダー行: タイトル、有効スイッチ、展開ボタン */}
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              >
                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transform transition-transform duration-300 sm:w-5 sm:h-5 ${
                      isPanelExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>
                <h2 className="text-xs sm:text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  Tracing Paper
                </h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`transition-opacity duration-300 ${
                    isPanelExpanded
                      ? "opacity-100"
                      : "opacity-0 hidden sm:block sm:opacity-100"
                  }`}
                >
                  {/* テクスチャ切り替えスイッチ (展開時またはPCで表示) */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 sm:p-1 scale-90 origin-right">
                    <button
                      onClick={() => handleTextureChange("fine")}
                      className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-all ${
                        textureType === "fine"
                          ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Smooth
                    </button>
                    <button
                      onClick={() => handleTextureChange("rough")}
                      className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-all ${
                        textureType === "rough"
                          ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Rough
                    </button>
                  </div>
                </div>

                <div className="scale-90 sm:scale-100 origin-right">
                  <TouchCheckbox
                    id="effect-toggle"
                    label="有効"
                    checked={isEnabled}
                    onChange={setIsEnabled}
                  />
                </div>
              </div>
            </div>

            {/* パラメータ操作エリア (折りたたみ可能) */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isPanelExpanded
                  ? "grid-rows-[1fr] opacity-100 mt-2 sm:mt-4"
                  : "grid-rows-[0fr] opacity-0 mt-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1 max-h-[45vh] overflow-y-auto overscroll-contain pr-1">
                  {/* スライダー群 */}
                  <div className="md:col-span-1 flex flex-col gap-2 sm:gap-3">
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
                      label="ブラー"
                      value={blurAmount}
                      min={0}
                      max={30}
                      step={0.5}
                      onChange={setBlurAmount}
                      disabled={!isEnabled}
                      formatValue={(v) => `${v}px`}
                    />
                    <TouchSlider
                      label="ざらざら感"
                      value={numOctaves}
                      min={1}
                      max={100}
                      step={1}
                      onChange={setNumOctaves}
                      disabled={!isEnabled}
                      formatValue={(v) => `${v}`}
                    />
                  </div>

                  {/* XYパッド */}
                  <div className="md:col-span-2 h-full min-h-[180px] sm:min-h-[200px] flex flex-col gap-4">
                    <TouchPad
                      label="周波数 (密度・方向)"
                      valueX={baseFrequencyX}
                      valueY={baseFrequencyY}
                      min={0.0001}
                      max={0.5}
                      step={0.0001}
                      onChange={(x, y) => {
                        setBaseFrequencyX(x);
                        setBaseFrequencyY(y);
                      }}
                      disabled={!isEnabled}
                      formatValue={(v) => v.toFixed(3)}
                    />

                    {/* サイズ調整スライダー (画像表示時のみ有効) */}
                    {uploadedImage && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <TouchSlider
                          label="紙の幅"
                          value={paperWidth}
                          min={10}
                          max={100}
                          step={1}
                          onChange={setPaperWidth}
                          disabled={!isEnabled}
                          formatValue={(v) => `${v}%`}
                        />
                        <TouchSlider
                          label="紙の高さ"
                          value={paperHeight}
                          min={10}
                          max={100}
                          step={1}
                          onChange={setPaperHeight}
                          disabled={!isEnabled}
                          formatValue={(v) => `${v}%`}
                        />
                      </div>
                    )}
                  </div>
                </div>
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
          <div className="relative group rounded-xl overflow-hidden shadow-2xl aspect-3/4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=1000&auto=format&fit=crop"
              alt="Sample"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-linear-to-t from-black/80 to-transparent text-white">
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
                  baseFrequency={`${baseFrequencyX} ${baseFrequencyY}`}
                  numOctaves={numOctaves}
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
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
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
                {/* 下地となるテキスト */}
                <div className="w-full h-full flex items-center justify-center relative">
                  <span className="text-4xl font-bold text-gray-900/50 dark:text-white/50 transform -rotate-3 mix-blend-multiply dark:mix-blend-screen">
                    OVERLAY
                  </span>

                  {/* 上に被せるトレーシングペーパー */}
                  <div className="absolute inset-0">
                    <TracingPaper
                      className="w-full h-full rounded-lg shadow-lg"
                      opacity={opacity}
                      blurAmount={blurAmount}
                      textureType={textureType}
                      baseFrequency={`${baseFrequencyX} ${baseFrequencyY}`}
                      numOctaves={numOctaves}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 新しいセクション: 画像アップロード */}
        <div className="w-full max-w-5xl mt-32 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Try with Your Image
          </h2>

          <div className="relative w-full aspect-square max-w-lg mx-auto bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group">
            {uploadedImage ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                />

                {isEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      style={{
                        width: `${paperWidth}%`,
                        height: `${paperHeight}%`,
                        transition: "width 0.3s, height 0.3s",
                      }}
                    >
                      <TracingPaper
                        className="w-full h-full rounded-lg shadow-lg border border-white/20"
                        opacity={opacity}
                        blurAmount={blurAmount}
                        textureType={textureType}
                        baseFrequency={`${baseFrequencyX} ${baseFrequencyY}`}
                        numOctaves={numOctaves}
                      />
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/70 transition-colors z-20 backdrop-blur-sm"
                >
                  Change Image
                </button>

                {/* 最大化ボタン */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors z-20 backdrop-blur-sm"
                  title="画面最大に表示"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
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

      {/* フルスクリーン表示 */}
      {isFullscreen && uploadedImage && (
        <div className="fixed inset-0 z-[90] bg-black/95 flex items-center justify-center p-4">
          {/* 閉じるボタン */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-colors z-[100] backdrop-blur-sm"
            title="閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* 最大化された画像 */}
          <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImage}
              alt="Uploaded Fullscreen"
              className="max-w-full max-h-full object-contain"
            />

            {/* トレーシングペーパーオーバーレイ */}
            {isEnabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  style={{
                    width: `${paperWidth}%`,
                    height: `${paperHeight}%`,
                    transition: "width 0.3s, height 0.3s",
                  }}
                >
                  <TracingPaper
                    className="w-full h-full rounded-lg shadow-lg border border-white/20"
                    opacity={opacity}
                    blurAmount={blurAmount}
                    textureType={textureType}
                    baseFrequency={`${baseFrequencyX} ${baseFrequencyY}`}
                    numOctaves={numOctaves}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
