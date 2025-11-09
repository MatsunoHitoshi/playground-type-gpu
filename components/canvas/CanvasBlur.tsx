"use client";

import { useEffect, useRef, useState } from "react";

export function CanvasBlur() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blurAmount, setBlurAmount] = useState(5);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    let time = 0;

    const render = () => {
      // キャンバスをクリア
      ctx.clearRect(0, 0, width, height);

      // 背景グラデーション
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 複数の円を描画
      const circles = 8;
      for (let i = 0; i < circles; i++) {
        const angle = time * 0.5 + (i / circles) * Math.PI * 2;
        const x = width / 2 + Math.cos(angle) * 150;
        const y = height / 2 + Math.sin(angle) * 150;
        const radius = 50 + Math.sin(time + i) * 20;

        // グラデーション
        const circleGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        circleGradient.addColorStop(0, `hsl(${(i * 45) % 360}, 70%, 60%)`);
        circleGradient.addColorStop(1, `hsl(${(i * 45) % 360}, 70%, 30%)`);

        ctx.fillStyle = circleGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ブラー効果を適用
      ctx.filter = `blur(${blurAmount}px)`;

      // テキストを描画
      ctx.font = "bold 48px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Canvas Blur", width / 2, height / 2);

      // フィルターをリセット
      ctx.filter = "none";

      time += 0.016; // 約60fps
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [blurAmount]);

  return (
    <div className="w-full h-full space-y-4 p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Canvas API Blur
        </h2>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Blur Amount: {blurAmount}px
        </label>
        <input
          type="range"
          min="0"
          max="20"
          value={blurAmount}
          onChange={(e) => setBlurAmount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-auto"
        />
      </div>

      {/* ガウシアンブラーの手動実装例 */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          手動ガウシアンブラー実装
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Canvas APIのfilterプロパティを使用してブラー効果を実装しています。
          より高度な実装では、ピクセルデータを直接操作してガウシアンブラーを手動で実装することも可能です。
        </p>
      </div>
    </div>
  );
}
