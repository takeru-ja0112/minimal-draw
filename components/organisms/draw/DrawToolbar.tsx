"use client";

import { IconContext } from 'react-icons';
import { TbArrowBackUp, TbArrowForwardUp, TbTrash } from 'react-icons/tb';

type Props = {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
};

export default function DrawToolbar({ onUndo, onRedo, onReset }: Props) {
  return (
    <div className="mb-4 flex gap-2 justify-center items-center">
      <IconContext.Provider value={{ size: '1.5em' }}>
        <button onClick={onUndo} className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4 flex justify-center items-center"><TbArrowBackUp /></button>
        <button onClick={onRedo} className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4 flex justify-center items-center"><TbArrowForwardUp /></button>
        <button onClick={onReset} className="w-fit h-10 border bg-white/50 border-gray-300 rounded-full p-2 px-4 flex justify-center items-center font-semibold text-sm"><TbTrash />リセット</button>
      </IconContext.Provider>
    </div>
  );
}
