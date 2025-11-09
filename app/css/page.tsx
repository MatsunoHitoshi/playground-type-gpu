import Link from "next/link";
import { CSSBlurEffect } from "@/components/css/BlurEffect";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function CSSPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ThemeToggle />
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
            CSS Filter Blur
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 sm:mb-4">
            CSS filterとbackdrop-filterを使ったブラー効果の実装
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <CSSBlurEffect />
        </div>

        <div className="mt-4 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            実装の詳細
          </h2>
          <div className="prose dark:prose-invert max-w-none prose-sm sm:prose-base">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              CSS
              filterとbackdrop-filterを使用することで、GPU加速されたブラー効果を簡単に実装できます。
              これらのプロパティは、ブラウザのネイティブ実装により、高いパフォーマンスを提供します。
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-3 sm:mt-4 space-y-1 sm:space-y-2">
              <li>filter: blur() - 要素全体にブラーを適用</li>
              <li>backdrop-filter: blur() - 背景にブラーを適用</li>
              <li>GPU加速による高速なレンダリング</li>
              <li>簡単な実装で高いパフォーマンス</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
