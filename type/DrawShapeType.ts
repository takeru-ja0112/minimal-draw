export type ToolType = 'line' | 'circle' | 'rect' | 'eraser' | 'move' | 'pen';

export type LineShape = number[];

export type FreeLineShape = number[];

export type CircleShape = {
  x: number;
  y: number;
  radius: number;
};

export type RectShape = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type SelectedShape = {
  type: 'line' | 'circle' | 'rect' | 'pen';
  index: number;
} | null;
