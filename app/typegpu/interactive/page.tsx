"use client";

import Link from "next/link";
import { MouseFollowBlur } from "@/components/typegpu/MouseFollowBlur";
import { WebGPUCheck } from "@/components/common/WebGPUCheck";

export default function InteractiveBlurPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base"
          >
            ← ホームに戻る
          </Link>
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            インタラクティブBlur表現
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 sm:mb-4">
            WebGPU（TypeGPU）を活用した、マウス/タッチ操作に応じたリアルタイムなブラー効果のサンプル
          </p>
          <WebGPUCheck />
        </div>

        {/* コンテンツ */}
        <div className="space-y-4 sm:space-y-6">
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              マウス追従型動的ブラー
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
              マウス位置を中心にブラー半径が変化し、距離に応じて減衰する効果。マウスに近いほどブラーが強くなります。
            </p>
            <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <MouseFollowBlur />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
