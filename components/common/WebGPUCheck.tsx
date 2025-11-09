"use client";

import { useEffect, useState } from "react";

export function WebGPUCheck() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const checkWebGPU = async () => {
      if (!navigator.gpu) {
        setIsSupported(false);
        setError("WebGPU is not supported in this browser");
        return;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setIsSupported(false);
          setError("Failed to get GPU adapter");
          return;
        }

        setIsSupported(true);
      } catch (err) {
        setIsSupported(false);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    checkWebGPU();
  }, []);

  if (isSupported === null) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">
          WebGPU対応を確認中...
        </p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
          WebGPUがサポートされていません
        </p>
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        <p className="text-red-700 dark:text-red-300 text-sm mt-2">
          WebGPUをサポートするブラウザ（Chrome 113+, Edge 113+, Safari
          18+）を使用してください。
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <p className="text-green-800 dark:text-green-200 font-semibold">
        ✓ WebGPUがサポートされています
      </p>
    </div>
  );
}
