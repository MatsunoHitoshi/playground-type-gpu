import Link from "next/link";
import { WebGPUCheck } from "@/components/common/WebGPUCheck";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ThemeToggle />
      <main className="container mx-auto px-2 sm:px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              TypeGPU Playground
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-8">
              TypeGPUを中心にWebでの表現方法を模索するPlayground
            </p>
            <WebGPUCheck />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
            {/* TypeGPU セクション */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                TypeGPU / WebGPU
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                WebGPUとWGSLシェーダーを使用したGPU加速表現
              </p>
              <div className="space-y-2">
                <Link
                  href="/typegpu"
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  基本サンプル
                </Link>
                <Link
                  href="/typegpu/fog"
                  className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
                >
                  靄表現
                </Link>
                <Link
                  href="/typegpu/blur"
                  className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
                >
                  ブラー表現
                </Link>
                <Link
                  href="/typegpu/interactive"
                  className="block w-full px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-center"
                >
                  インタラクティブBlur表現
                </Link>
              </div>
            </div>

            {/* CSS セクション */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                CSS Filter
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                CSS filterとbackdrop-filterを使ったブラー効果
              </p>
              <Link
                href="/css"
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                CSS Blur サンプル
              </Link>
            </div>

            {/* Canvas セクション */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Canvas API
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                Canvas 2D APIを使ったブラー表現とアニメーション
              </p>
              <Link
                href="/canvas"
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Canvas Blur サンプル
              </Link>
            </div>

            {/* 技術スタック */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                技術スタック
              </h2>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                <li>• Next.js 16 (App Router)</li>
                <li>• TypeScript</li>
                <li>• TailwindCSS</li>
                <li>• TypeGPU</li>
                <li>• WebGPU API</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
