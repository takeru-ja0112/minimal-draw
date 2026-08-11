import React, { useMemo } from 'react';
import { Group, Line as KonvaLine } from 'react-konva';
import {
  SKETCHY_CONFIG,
  buildSketchyCirclePoints,
  buildSketchyLinePoints,
  buildSketchyRectPoints,
  generateSeed
} from '@/lib/sketchyDraw';

interface SketchyLineProps {
  points: number[]; // [x1, y1, x2, y2]
  stroke: string;
  strokeWidth: number;
}

export const SketchyLine: React.FC<SketchyLineProps> = ({ points, stroke, strokeWidth }) => {
  const seed = useMemo(() => generateSeed(points), [points]);
  
  const pass1 = useMemo(() => {
    if (points.length < 4) return points;
    return buildSketchyLinePoints(points[0], points[1], points[2], points[3], seed, false);
  }, [points, seed]);

  const pass2 = useMemo(() => {
    if (points.length < 4) return points;
    return buildSketchyLinePoints(points[0], points[1], points[2], points[3], seed, true);
  }, [points, seed]);

  return (
    <Group>
      <KonvaLine
        points={pass1}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
      />
      <KonvaLine
        points={pass2}
        stroke={stroke}
        strokeWidth={strokeWidth * SKETCHY_CONFIG.SECOND_PASS_WIDTH_RATIO}
        opacity={SKETCHY_CONFIG.SECOND_PASS_OPACITY}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};

interface SketchyCircleProps {
  x: number;
  y: number;
  radius: number;
  stroke: string;
  strokeWidth: number;
}

export const SketchyCircle: React.FC<SketchyCircleProps> = ({ x, y, radius, stroke, strokeWidth }) => {
  const seed = useMemo(() => generateSeed([x, y, radius]), [x, y, radius]);

  const pass1 = useMemo(() => buildSketchyCirclePoints(radius, seed, false), [radius, seed]);
  const pass2 = useMemo(() => buildSketchyCirclePoints(radius, seed, true), [radius, seed]);

  return (
    <Group x={x} y={y}>
      <KonvaLine
        points={pass1}
        closed
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
      />
      <KonvaLine
        points={pass2}
        closed
        stroke={stroke}
        strokeWidth={strokeWidth * SKETCHY_CONFIG.SECOND_PASS_WIDTH_RATIO}
        opacity={SKETCHY_CONFIG.SECOND_PASS_OPACITY}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};

interface SketchyRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  stroke: string;
  strokeWidth: number;
}

export const SketchyRect: React.FC<SketchyRectProps> = ({ x, y, width, height, rotation = 0, stroke, strokeWidth }) => {
  const seed = useMemo(() => generateSeed([x, y, width, height, rotation]), [x, y, width, height, rotation]);

  const pass1 = useMemo(() => buildSketchyRectPoints(width, height, seed, false), [width, height, seed]);
  const pass2 = useMemo(() => buildSketchyRectPoints(width, height, seed, true), [width, height, seed]);

  return (
    <Group x={x} y={y} rotation={rotation}>
      <KonvaLine
        points={pass1}
        closed
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={0}
        lineCap="round"
        lineJoin="round"
      />
      <KonvaLine
        points={pass2}
        closed
        stroke={stroke}
        strokeWidth={strokeWidth * SKETCHY_CONFIG.SECOND_PASS_WIDTH_RATIO}
        opacity={SKETCHY_CONFIG.SECOND_PASS_OPACITY}
        tension={0}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};
