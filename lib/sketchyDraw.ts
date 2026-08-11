// lib/sketchyDraw.ts

// 設定値（実際の見た目を見ながら調整する用）
export const SKETCHY_CONFIG = {
  JITTER_AMOUNT: 1.5, // 線の揺れ幅 (px)
  SECOND_PASS_OPACITY: 0.5, // 2本目の線の不透明度
  SECOND_PASS_WIDTH_RATIO: 0.7, // 2本目の線の太さ（1本目に対する割合）
  LINE_SEGMENTS: 6, // 直線を分割する数
  CIRCLE_SEGMENTS: 50, // 円を分割する数
  RECT_SEGMENTS_PER_SIDE: 10, // 長方形の1辺を分割する数
  RECT_CORNER_JITTER_AMOUNT: 1, // 長方形の角のジッター幅（辺のジッターより小さめにして角の位置を保つ）
  RECT_EDGE_JITTER_AMOUNT: 2.2, // 長方形の辺の中間に加える細かいノイズの幅
};

// シード付き疑似乱数生成器 (mulberry32)
// 0〜1の値を返す
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 簡単な文字列/数値配列からのハッシュ生成関数
export function generateSeed(values: number[]): number {
  let hash = 0;
  for (let i = 0; i < values.length; i++) {
    hash = Math.imul(31, hash) + Math.floor(values[i] * 100) | 0;
  }
  return hash;
}

/**
 * 直線用のジッター点列を生成する
 * @param x1 始点X
 * @param y1 始点Y
 * @param x2 終点X
 * @param y2 終点Y
 * @param seed シード値
 * @param isSecondPass 2周目かどうか（シードをずらすため）
 */
export function buildSketchyLinePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  isSecondPass: boolean = false
): number[] {
  const rand = mulberry32(seed + (isSecondPass ? 9999 : 0));
  const points: number[] = [];
  const segments = SKETCHY_CONFIG.LINE_SEGMENTS;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  
  if (len === 0) {
    return [x1, y1, x2, y2];
  }

  // 法線ベクトル（正規化）
  const nx = -dy / len;
  const ny = dx / len;

  points.push(x1, y1); // 始点

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const px = x1 + dx * t;
    const py = y1 + dy * t;

    // 法線方向にランダムなオフセットを加える（-1 〜 1）
    const jitterStr = (rand() * 2 - 1) * SKETCHY_CONFIG.JITTER_AMOUNT;
    points.push(px + nx * jitterStr, py + ny * jitterStr);
  }

  points.push(x2, y2); // 終点
  return points;
}

/**
 * 円用のジッター点列を生成する
 * (中心は 0,0 としてローカル座標の点列を返す)
 * @param radius 半径
 * @param seed シード値
 * @param isSecondPass 2周目かどうか
 */
export function buildSketchyCirclePoints(
  radius: number,
  seed: number,
  isSecondPass: boolean = false
): number[] {
  const rand = mulberry32(seed + (isSecondPass ? 9999 : 0));
  const points: number[] = [];
  const segments = Math.max(12, Math.floor(SKETCHY_CONFIG.CIRCLE_SEGMENTS * (radius / 50))); // 半径によって分割数を調整

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // 半径方向にジッターを加える
    const rJitter = radius + (rand() * 2 - 1) * SKETCHY_CONFIG.JITTER_AMOUNT;
    
    // 全体的な歪みも少し加える
    const offsetX = (rand() * 2 - 1) * SKETCHY_CONFIG.JITTER_AMOUNT * 0.5;
    const offsetY = (rand() * 2 - 1) * SKETCHY_CONFIG.JITTER_AMOUNT * 0.5;

    points.push(
      Math.cos(angle) * rJitter + offsetX,
      Math.sin(angle) * rJitter + offsetY
    );
  }

  return points;
}

/**
 * 長方形用のジッター点列を生成する
 * (左上を 0,0 としてローカル座標の点列を返す)
 * @param width 幅
 * @param height 高さ
 * @param seed シード値
 * @param isSecondPass 2周目かどうか
 */
export function buildSketchyRectPoints(
  width: number,
  height: number,
  seed: number,
  isSecondPass: boolean = false
): number[] {
  const rand = mulberry32(seed + (isSecondPass ? 9999 : 0));
  const segments = SKETCHY_CONFIG.RECT_SEGMENTS_PER_SIDE;

  const corners: Array<[number, number]> = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];

  // 角は1回だけジッターさせて、隣り合う2辺で共有する
  // （角ごとに別々にジッターすると「角が2つに割れて」丸まって見えてしまうため）
  const jitteredCorners = corners.map(([cx, cy]) => {
    const jx = (rand() * 2 - 1) * SKETCHY_CONFIG.RECT_CORNER_JITTER_AMOUNT;
    const jy = (rand() * 2 - 1) * SKETCHY_CONFIG.RECT_CORNER_JITTER_AMOUNT;
    return [cx + jx, cy + jy] as [number, number];
  });

  const points: number[] = [];

  for (let c = 0; c < 4; c += 1) {
    const [startX, startY] = jitteredCorners[c];
    const [endX, endY] = jitteredCorners[(c + 1) % 4];
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy);
    const nx = len === 0 ? 0 : -dy / len;
    const ny = len === 0 ? 0 : dx / len;

    for (let i = 0; i < segments; i += 1) {
      const t = i / segments;
      const px = startX + dx * t;
      const py = startY + dy * t;

      // 角(t=0)では0、辺の中間ほど強くノイズをかける
      // → 角の位置は保ちつつ、辺の途中に細かいノイズを密に乗せる
      const edgeWeight = Math.sin(t * Math.PI);
      const jitterStr = (rand() * 2 - 1) * SKETCHY_CONFIG.RECT_EDGE_JITTER_AMOUNT * edgeWeight;
      points.push(px + nx * jitterStr, py + ny * jitterStr);
    }
  }

  return points;
}
