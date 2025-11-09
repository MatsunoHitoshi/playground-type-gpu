/**
 * マウス/タッチイベントの共通処理ユーティリティ
 */

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseState {
  position: MousePosition;
  isDown: boolean;
  velocity: { x: number; y: number };
  direction: { x: number; y: number };
}

/**
 * キャンバス座標を正規化座標（0-1）に変換
 */
export function normalizeCanvasCoordinates(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): MousePosition {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}

/**
 * マウス/タッチイベントハンドラーを設定
 */
export function setupMouseTracking(
  canvas: HTMLCanvasElement,
  onMove: (position: MousePosition) => void,
  onDown?: (position: MousePosition) => void,
  onUp?: (position: MousePosition) => void
): () => void {
  let isMouseDown = false;

  const handleMove = (e: MouseEvent | TouchEvent) => {
    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = isTouch ? e.touches[0]?.clientY ?? 0 : e.clientY;
    const position = normalizeCanvasCoordinates(clientX, clientY, canvas);
    onMove(position);
  };

  const handleDown = (e: MouseEvent | TouchEvent) => {
    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = isTouch ? e.touches[0]?.clientY ?? 0 : e.clientY;
    const position = normalizeCanvasCoordinates(clientX, clientY, canvas);
    isMouseDown = true;
    onDown?.(position);
  };

  const handleUp = (e: MouseEvent | TouchEvent) => {
    const isTouch = "touches" in e;
    const clientX = isTouch
      ? (e as TouchEvent).changedTouches[0]?.clientX ?? 0
      : e.clientX;
    const clientY = isTouch
      ? (e as TouchEvent).changedTouches[0]?.clientY ?? 0
      : e.clientY;
    const position = normalizeCanvasCoordinates(clientX, clientY, canvas);
    isMouseDown = false;
    onUp?.(position);
  };

  // マウスイベント
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mousedown", handleDown);
  canvas.addEventListener("mouseup", handleUp);
  canvas.addEventListener("mouseleave", () => {
    isMouseDown = false;
  });

  // タッチイベント
  canvas.addEventListener("touchmove", handleMove, { passive: true });
  canvas.addEventListener("touchstart", handleDown, { passive: true });
  canvas.addEventListener("touchend", handleUp, { passive: true });

  // クリーンアップ関数
  return () => {
    canvas.removeEventListener("mousemove", handleMove);
    canvas.removeEventListener("mousedown", handleDown);
    canvas.removeEventListener("mouseup", handleUp);
    canvas.removeEventListener("mouseleave", () => {
      isMouseDown = false;
    });
    canvas.removeEventListener("touchmove", handleMove);
    canvas.removeEventListener("touchstart", handleDown);
    canvas.removeEventListener("touchend", handleUp);
  };
}

/**
 * マウス位置の履歴を管理（方向性モーションブラー用）
 */
export class MouseHistory {
  private positions: MousePosition[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 5) {
    this.maxHistory = maxHistory;
  }

  add(position: MousePosition): void {
    this.positions.push(position);
    if (this.positions.length > this.maxHistory) {
      this.positions.shift();
    }
  }

  getVelocity(): { x: number; y: number } {
    if (this.positions.length < 2) {
      return { x: 0, y: 0 };
    }
    const current = this.positions[this.positions.length - 1];
    const previous = this.positions[this.positions.length - 2];
    return {
      x: current.x - previous.x,
      y: current.y - previous.y,
    };
  }

  getDirection(): { x: number; y: number } {
    const velocity = this.getVelocity();
    const length = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: velocity.x / length,
      y: velocity.y / length,
    };
  }

  getSpeed(): number {
    const velocity = this.getVelocity();
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  clear(): void {
    this.positions = [];
  }
}
