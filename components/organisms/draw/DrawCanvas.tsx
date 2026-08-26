"use client";

import type { CircleShape, RectShape, SelectedShape } from '@/type/DrawShapeType';
import { KonvaEventObject } from 'konva/lib/Node';
import { motion } from 'motion/react';
import { Circle, Rect as KonvaRect, Layer, Line, Stage } from 'react-konva';

type Props = {
  count: number;
  lines: number[][];
  circles: CircleShape[];
  rects: RectShape[];
  strokes: number[][];
  selectedShape: SelectedShape;
  w: number;
  h: number;
  isMobile: boolean;
  onMouseDown: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseMove: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseUp: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
};

export default function DrawCanvas({
  count,
  lines,
  circles,
  rects,
  strokes,
  selectedShape,
  w,
  h,
  isMobile,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: Props) {
  return (
    <div className="relative w-[300px] h-[300px] mx-auto">
      <div className="w-fit h-fit p-1 px-4 flex items-center justify-center absolute -top-5 -left-7 z-5 bg-yellow-400 border border-white border-2 rounded-full">
        <motion.h1
          key={count}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold "
        >
          {count}
        </motion.h1>
      </div>
      <div className={`relative mx-auto mt-4 border bg-white border-4 border-gray-400 w-[300px] h-[300px] touch-none rounded overflow-hidden relative`}>
        <Stage
          width={w}
          height={h}
          {...isMobile ? {
            onTouchStart: (e: KonvaEventObject<TouchEvent>) => onMouseDown(e),
            onTouchMove: (e: KonvaEventObject<TouchEvent>) => onMouseMove(e),
            onTouchEnd: (e: KonvaEventObject<TouchEvent>) => onMouseUp(e),
          } : {
            onMouseDown: onMouseDown,
            onMouseMove: onMouseMove,
            onMouseUp: onMouseUp,
          }}
        >
          <Layer
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          >
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line}
                stroke={selectedShape?.type === 'line' && selectedShape.index === i ? '#e9c10e' : 'black'}
                strokeWidth={selectedShape?.type === 'line' && selectedShape.index === i ? 4 : 3}
              />
            ))}
            {circles.map((circle, i) => (
              <Circle
                key={i}
                x={circle.x}
                y={circle.y}
                radius={circle.radius}
                stroke={selectedShape?.type === 'circle' && selectedShape.index === i ? '#e9c10e' : 'black'}
                strokeWidth={selectedShape?.type === 'circle' && selectedShape.index === i ? 4 : 3}
              />
            ))}
            {rects.map((rect, i) => (
              <KonvaRect
                key={i}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                stroke={selectedShape?.type === 'rect' && selectedShape.index === i ? '#e9c10e' : 'black'}
                strokeWidth={selectedShape?.type === 'rect' && selectedShape.index === i ? 4 : 3}
                rotation={rect.rotation}
              />
            ))}
            {strokes.map((points, i) => (
              <Line
                key={i}
                points={points}
                stroke={selectedShape?.type === 'pen' && selectedShape.index === i ? '#e9c10e' : 'black'}
                strokeWidth={selectedShape?.type === 'pen' && selectedShape.index === i ? 4 : 3}
                lineCap="round"
                lineJoin="round"
                tension={0.5}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
