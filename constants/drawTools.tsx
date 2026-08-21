import type { ToolType } from '@/type/DrawShapeType';
import { TbArrowsMove, TbEraser } from 'react-icons/tb';

export type DrawToolConfig = {
  key: ToolType;
  label: string;
  icon: React.ReactNode;
};

export const drawTools: DrawToolConfig[] = [
  {
    key: 'line',
    label: '直線',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" /></svg>
    ),
  },
  {
    key: 'circle',
    label: '円',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" /></svg>
    ),
  },
  {
    key: 'rect',
    label: '長方形',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" /></svg>
    ),
  },
  { key: 'eraser', label: '消しゴム', icon: <TbEraser /> },
  { key: 'move', label: '移動', icon: <TbArrowsMove /> },
];
