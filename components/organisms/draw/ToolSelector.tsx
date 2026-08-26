"use client";

import { drawTools } from '@/constants/drawTools';
import type { ToolType } from '@/type/DrawShapeType';
import { motion } from 'motion/react';

type Props = {
  tool: ToolType;
  enabledTools: ToolType[];
  onChange: (tool: ToolType) => void;
};

export default function ToolSelector({ tool, enabledTools, onChange }: Props) {
  const visibleTools = drawTools.filter(({ key }) => enabledTools.includes(key));

  return (
    <div className="mt-4 flex gap-4 justify-center relative">
      {visibleTools.map(({ key, label, icon }) => (
        <div key={key} className="flex flex-col items-center gap-1 w-full relative">
          {tool === key && (
            <motion.span
              layoutId="toolHighlight"
              className="w-12 h-12 bg-yellow-400 absolute rounded-xl top-5 left-1/2 -translate-x-1/2 z-0"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className={`w-full truncate font-semibold text-xs ${tool === key ? 'text-gray-900' : 'text-gray-400'} z-5`}>{label}</span>
          <motion.label
            key={key}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full  h-13 flex justify-center items-center text-md py-2 cursor-pointer z-5`}
          >
            <input
              type="radio"
              name="tool"
              value={key}
              checked={tool === key}
              onChange={() => onChange(key)}
              className="hidden"
            />
            <span className="mb-1 text-2xl">{icon}</span>
          </motion.label>
        </div>
      ))}
    </div>
  );
}
