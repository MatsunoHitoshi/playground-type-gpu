/**
 * ブラー計算の共通ユーティリティ
 */

export type BlurType = "gaussian" | "box" | "motion";

export interface BlurParams {
  radius: number;
  intensity: number;
  type: BlurType;
}

/**
 * ガウシアン重みを計算
 */
export function gaussianWeight(distance: number, sigma: number): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
}

/**
 * ボックス重みを計算
 */
export function boxWeight(distance: number, radius: number): number {
  return distance <= radius ? 1.0 : 0.0;
}

/**
 * モーションブラー重みを計算
 */
export function motionWeight(
  distance: number,
  direction: { x: number; y: number },
  position: { x: number; y: number },
  center: { x: number; y: number }
): number {
  const dx = position.x - center.x;
  const dy = position.y - center.y;
  const dot = dx * direction.x + dy * direction.y;
  const projection = Math.max(0, dot);
  return Math.exp(-projection * projection * 10);
}

/**
 * ブラータイプに応じた重みを計算
 */
export function calculateBlurWeight(
  distance: number,
  params: BlurParams,
  direction?: { x: number; y: number },
  position?: { x: number; y: number },
  center?: { x: number; y: number }
): number {
  switch (params.type) {
    case "gaussian":
      return gaussianWeight(distance, params.intensity);
    case "box":
      return boxWeight(distance, params.radius);
    case "motion":
      if (direction && position && center) {
        return motionWeight(distance, direction, position, center);
      }
      return gaussianWeight(distance, params.intensity);
    default:
      return gaussianWeight(distance, params.intensity);
  }
}

/**
 * 距離に基づいてブラー強度を計算（減衰関数）
 */
export function calculateBlurIntensity(
  distance: number,
  maxRadius: number,
  decayFactor: number = 2.0
): number {
  if (distance >= maxRadius) {
    return 0;
  }
  const normalizedDistance = distance / maxRadius;
  return Math.exp(-normalizedDistance * normalizedDistance * decayFactor);
}

/**
 * 深度値に基づいてブラー強度を計算
 */
export function calculateDepthBlur(
  depth: number,
  minDepth: number = 0.0,
  maxDepth: number = 1.0
): number {
  const normalizedDepth = (depth - minDepth) / (maxDepth - minDepth);
  return Math.max(0, Math.min(1, normalizedDepth));
}
