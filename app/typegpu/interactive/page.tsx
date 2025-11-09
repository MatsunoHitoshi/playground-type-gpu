"use client";

import { useState } from "react";
import Link from "next/link";
import { MouseFollowBlur } from "@/components/typegpu/MouseFollowBlur";
import { RealtimeBlurControls } from "@/components/typegpu/RealtimeBlurControls";
import { DirectionalMotionBlur } from "@/components/typegpu/DirectionalMotionBlur";
import { DepthBasedBlur } from "@/components/typegpu/DepthBasedBlur";
import { MultiPointBlur } from "@/components/typegpu/MultiPointBlur";
import { InteractiveBlurZones } from "@/components/typegpu/InteractiveBlurZones";
import { WebGPUCheck } from "@/components/common/WebGPUCheck";

type TabId =
  | "mouse-follow"
  | "realtime"
  | "directional"
  | "depth"
  | "multipoint"
  | "zones";

interface Tab {
  id: TabId;
  label: string;
  description: string;
}

const tabs: Tab[] = [
  {
    id: "mouse-follow",
    label: "1. マウス追従型動的ブラー",
    description:
      "マウス位置を中心にブラー半径が変化し、距離に応じて減衰する効果。マウスに近いほどブラーが強くなります。",
  },
  {
    id: "realtime",
    label: "2. リアルタイムブラー調整UI",
    description:
      "スライダーでブラー強度と半径を調整し、ブラータイプ（ガウシアン/ボックス/モーション）を切り替えられます。",
  },
  {
    id: "directional",
    label: "3. 方向性モーションブラー",
    description:
      "マウスの移動方向に沿ってブラーを適用し、速度に応じて強度が調整されます。動きの軌跡を視覚化します。",
  },
  {
    id: "depth",
    label: "4. 深度感ブラー",
    description:
      "マウス位置からの距離に基づく深度ブラー。遠いほどブラーが強くなり、3D的な奥行き感を表現します。",
  },
  {
    id: "multipoint",
    label: "5. マルチポイントインタラクティブブラー",
    description:
      "クリック/タップでブラーポイントを追加し、各ポイントで独立したブラー効果を適用します。最大10個まで追加可能です。",
  },
  {
    id: "zones",
    label: "6. インタラクティブブラーゾーン管理",
    description:
      "複数のブラーゾーンを追加・削除・移動し、各ゾーンの半径と強度を個別に調整できます。ドラッグでゾーンを移動し、選択したゾーンのパラメータをリアルタイムに変更できます。",
  },
];

export default function InteractiveBlurPage() {
  const [activeTab, setActiveTab] = useState<TabId>("mouse-follow");

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

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
            WebGPU（TypeGPU）を活用した、マウス/タッチ操作に応じたリアルタイムなブラー効果のサンプル集
          </p>
          <WebGPUCheck />
        </div>

        {/* タブナビゲーション */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav
              className="-mb-px flex flex-wrap gap-1 sm:gap-2"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors
                    ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(".")[0]}.</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* アクティブなタブのコンテンツ */}
        <div className="space-y-4 sm:space-y-6">
          {activeTabData && (
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {activeTabData.label}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                {activeTabData.description}
              </p>
              <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {activeTab === "mouse-follow" && <MouseFollowBlur />}
                {activeTab === "realtime" && <RealtimeBlurControls />}
                {activeTab === "directional" && <DirectionalMotionBlur />}
                {activeTab === "depth" && <DepthBasedBlur />}
                {activeTab === "multipoint" && <MultiPointBlur />}
                {activeTab === "zones" && <InteractiveBlurZones />}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
