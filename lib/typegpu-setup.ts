// シングルトンとしてデバイスを管理
let cachedDevice: GPUDevice | null = null;
let devicePromise: Promise<GPUDevice | null> | null = null;

/**
 * WebGPUデバイスを取得する（シングルトン）
 */
export async function getWebGPUDevice(): Promise<GPUDevice | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // 既にキャッシュされている場合はそれを返す
  if (cachedDevice) {
    return cachedDevice;
  }

  // 既に初期化中の場合はそのPromiseを返す
  if (devicePromise) {
    return devicePromise;
  }

  if (!navigator.gpu) {
    console.error("WebGPU is not supported in this browser");
    return null;
  }

  // 新しい初期化を開始
  devicePromise = (async () => {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error("Failed to get GPU adapter");
        devicePromise = null;
        return null;
      }

      const device = await adapter.requestDevice();

      // デバイスが失われた場合の処理
      device.addEventListener("uncapturederror", (event) => {
        console.error("WebGPU uncapturederror:", event);
        if (event instanceof GPUUncapturedErrorEvent && event.error) {
          console.error("GPU Error details:", {
            message: event.error.message,
            error: event.error,
          });
        }
        cachedDevice = null;
        devicePromise = null;
      });

      // デバイスが失われた場合の処理（device.lostイベント）
      device.lost
        .then((info) => {
          console.error("WebGPU device lost:", {
            reason: info.reason,
            message: info.message,
          });
          cachedDevice = null;
          devicePromise = null;
        })
        .catch((error) => {
          console.error("Error in device.lost promise:", error);
        });

      cachedDevice = device;
      return device;
    } catch (error) {
      console.error("Error initializing WebGPU:", error);
      devicePromise = null;
      return null;
    }
  })();

  return devicePromise;
}

/**
 * WebGPUデバイスを取得する（TypeGPU互換のインターフェース）
 */
export async function initTypeGPU() {
  const device = await getWebGPUDevice();
  if (!device) {
    return null;
  }

  // TypeGPUのルートオブジェクトのようなインターフェースを返す
  // 実際には直接WebGPU APIを使用しているため、デバイスを含むオブジェクトを返す
  return { device };
}
