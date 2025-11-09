import Link from "next/link";
import { FogEffect } from "@/components/typegpu/FogEffect";
import { WebGPUCheck } from "@/components/common/WebGPUCheck";

export default function FogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/typegpu"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← TypeGPUに戻る
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            靄表現 (Fog Effect)
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            WebGPUとWGSLシェーダーを使用した靄表現の実装
          </p>
          <WebGPUCheck />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="h-[600px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <FogEffect />
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            実装の詳細
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300">
              この靄表現は、WGSLフラグメントシェーダーを使用して実装されています。
              ノイズ関数と距離ベースのフェードを組み合わせることで、自然な靄の効果を実現しています。
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-4 space-y-2">
              <li>ノイズベースのパターン生成</li>
              <li>距離ベースのフェード効果</li>
              <li>時間に基づくアニメーション</li>
              <li>WebGPUによるGPU加速レンダリング</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
