import Link from "next/link";
import { MouseFollowBlur } from "@/components/typegpu/MouseFollowBlur";
import { RealtimeBlurControls } from "@/components/typegpu/RealtimeBlurControls";
import { DirectionalMotionBlur } from "@/components/typegpu/DirectionalMotionBlur";
import { DepthBasedBlur } from "@/components/typegpu/DepthBasedBlur";
import { MultiPointBlur } from "@/components/typegpu/MultiPointBlur";
import { InteractiveBlurZones } from "@/components/typegpu/InteractiveBlurZones";
import { WebGPUCheck } from "@/components/common/WebGPUCheck";

export default function InteractiveBlurPage() {
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
            インタラクティブBlur表現
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            WebGPU（TypeGPU）を活用した、マウス/タッチ操作に応じたリアルタイムなブラー効果のサンプル集
          </p>
          <WebGPUCheck />
        </div>

        <div className="space-y-12">
          {/* マウス追従型動的ブラー */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. マウス追従型動的ブラー
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              マウス位置を中心にブラー半径が変化し、距離に応じて減衰する効果。マウスに近いほどブラーが強くなります。
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <MouseFollowBlur />
            </div>
          </section>

          {/* リアルタイムブラー調整UI */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. リアルタイムブラー調整UI
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              スライダーでブラー強度と半径を調整し、ブラータイプ（ガウシアン/ボックス/モーション）を切り替えられます。
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <RealtimeBlurControls />
            </div>
          </section>

          {/* 方向性モーションブラー */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. 方向性モーションブラー
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              マウスの移動方向に沿ってブラーを適用し、速度に応じて強度が調整されます。動きの軌跡を視覚化します。
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <DirectionalMotionBlur />
            </div>
          </section>

          {/* 深度感ブラー */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 深度感ブラー
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              マウス位置からの距離に基づく深度ブラー。遠いほどブラーが強くなり、3D的な奥行き感を表現します。
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <DepthBasedBlur />
            </div>
          </section>

          {/* マルチポイントインタラクティブブラー */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. マルチポイントインタラクティブブラー
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              クリック/タップでブラーポイントを追加し、各ポイントで独立したブラー効果を適用します。最大10個まで追加可能です。
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <MultiPointBlur />
            </div>
          </section>

          {/* インタラクティブブラーゾーン管理 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. インタラクティブブラーゾーン管理
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              複数のブラーゾーンを追加・削除・移動し、各ゾーンの半径と強度を個別に調整できます。ドラッグでゾーンを移動し、選択したゾーンのパラメータをリアルタイムに変更できます。
            </p>
            <div className="h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <InteractiveBlurZones />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
