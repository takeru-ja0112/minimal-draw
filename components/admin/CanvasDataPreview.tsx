"use client";

import { parseCanvasData } from "@/lib/admin/parseCanvasData";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";

interface CanvasDataPreviewProps {
  canvasData: unknown;
  size?: number; // Size of the square canvas (default is 300)
}

export default function CanvasDataPreview({ canvasData, size = 300 }: CanvasDataPreviewProps) {
  const parsedData = parseCanvasData(canvasData);
  const scale = size / 300;

  // Render a simple placeholder if there's no path/element drawn
  const totalElements = parsedData.lines.length + parsedData.circles.length + parsedData.rects.length;
  if (totalElements === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-[10px] text-gray-400 font-medium"
      >
        No Data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-inner" style={{ width: size, height: size }}>
      <Stage scale={{ x: scale, y: scale }} width={size} height={size}>
        <Layer>
          {parsedData.lines.map((line, i) => (
            <Line key={`line-${i}`} points={line} stroke="black" strokeWidth={3} lineCap="round" lineJoin="round" />
          ))}
          {parsedData.circles.map((circle, i) => (
            <Circle key={`circle-${i}`} x={circle.x} y={circle.y} radius={circle.radius} stroke="black" strokeWidth={3} />
          ))}
          {parsedData.rects.map((rect, i) => (
            <Rect key={`rect-${i}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} stroke="black" strokeWidth={3} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
