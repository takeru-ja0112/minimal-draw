"use client";

import type { Drawing } from "@/type/AnswerType";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";

type DrawingCanvasPreviewProps = {
  canvasData: Drawing["canvas_data"];
  size?: number;
  className?: string;
};

const BASE_CANVAS_SIZE = 300;

export default function DrawingCanvasPreview({
  canvasData,
  size = BASE_CANVAS_SIZE,
  className = "",
}: DrawingCanvasPreviewProps) {
  const scale = size / BASE_CANVAS_SIZE;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Stage width={size} height={size} scaleX={scale} scaleY={scale}>
        <Layer listening={false}>
          {canvasData.lines.map((line, index) => (
            <Line
              key={`line-${index}`}
              points={line}
              stroke="black"
              strokeWidth={3}
            />
          ))}
          {canvasData.circles.map((circle, index) => (
            <Circle
              key={`circle-${index}`}
              x={circle.x}
              y={circle.y}
              radius={circle.radius}
              stroke="black"
              strokeWidth={3}
            />
          ))}
          {canvasData.rects.map((rect, index) => (
            <Rect
              key={`rect-${index}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rotation={rect.rotation}
              stroke="black"
              strokeWidth={3}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
