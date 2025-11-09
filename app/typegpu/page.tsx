import Link from "next/link";
import { FogEffect } from "@/components/typegpu/FogEffect";
import { BlurEffect } from "@/components/typegpu/BlurEffect";
import { AnimatedEffect } from "@/components/typegpu/AnimatedEffect";
import { WebGPUCheck } from "@/components/common/WebGPUCheck";

export default function TypeGPUPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← ホームに戻る
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            TypeGPU 基本サンプル
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            TypeGPUとWebGPUを使用した様々な表現のサンプル
          </p>
          <WebGPUCheck />
        </div>

        <div className="space-y-12">
          {/* 靄表現 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              靄表現 (Fog Effect)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              ノイズベースの靄効果を実装したシェーダー
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <FogEffect />
            </div>
          </section>

          {/* ブラー表現 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ブラー表現 (Blur Effect)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              動的なガウシアンブラー効果
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <BlurEffect />
            </div>
          </section>

          {/* アニメーション効果 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              アニメーション効果 (Animated Effect)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              時間に基づく動的な色とブラーの組み合わせ
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <AnimatedEffect />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
