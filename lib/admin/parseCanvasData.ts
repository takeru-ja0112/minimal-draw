export interface ParsedCanvasData {
  lines: number[][];
  circles: { x: number; y: number; radius: number }[];
  rects: { x: number; y: number; width: number; height: number }[];
}

export function parseCanvasData(value: unknown): ParsedCanvasData {
  const defaultData: ParsedCanvasData = {
    lines: [],
    circles: [],
    rects: [],
  };

  if (!value || typeof value !== "object") {
    return defaultData;
  }

  const obj = value as Record<string, unknown>;

  const lines: number[][] = [];
  if (Array.isArray(obj.lines)) {
    for (const item of obj.lines) {
      if (Array.isArray(item) && item.every((n) => typeof n === "number")) {
        lines.push(item as number[]);
      }
    }
  }

  const circles: ParsedCanvasData["circles"] = [];
  if (Array.isArray(obj.circles)) {
    for (const item of obj.circles) {
      if (item && typeof item === "object") {
        const c = item as Record<string, unknown>;
        if (
          typeof c.x === "number" &&
          typeof c.y === "number" &&
          typeof c.radius === "number"
        ) {
          circles.push({
            x: c.x,
            y: c.y,
            radius: c.radius,
          });
        }
      }
    }
  }

  const rects: ParsedCanvasData["rects"] = [];
  if (Array.isArray(obj.rects)) {
    for (const item of obj.rects) {
      if (item && typeof item === "object") {
        const r = item as Record<string, unknown>;
        if (
          typeof r.x === "number" &&
          typeof r.y === "number" &&
          typeof r.width === "number" &&
          typeof r.height === "number"
        ) {
          rects.push({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          });
        }
      }
    }
  }

  return {
    lines,
    circles,
    rects,
  };
}
