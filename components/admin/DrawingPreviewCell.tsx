"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Modal from "@/components/organisms/Modal";

// Load CanvasDataPreview only on client side to prevent SSR issues
const CanvasDataPreview = dynamic(() => import("./CanvasDataPreview"), { ssr: false });

interface DrawingPreviewCellProps {
  canvasData: unknown;
  theme: string | null;
  elementCount: number;
  id: string; // The database record ID
}

export default function DrawingPreviewCell({
  canvasData,
  theme,
  elementCount,
  id,
}: DrawingPreviewCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative cursor-pointer focus:outline-none transition-transform hover:scale-105 duration-200 block"
        aria-label="イラストプレビューを表示"
      >
        <CanvasDataPreview canvasData={canvasData} size={96} />
        {/* Hover overlay text */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-[10px] text-white font-bold transition-opacity duration-200">
          詳細表示
        </div>
      </button>

      {/* Expanded Preview Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="!bg-slate-900 !border-slate-800 !border-solid !text-slate-100 !rounded-2xl w-full !max-w-md"
      >
        <div className="space-y-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white">イラスト詳細</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm"
            >
              閉じる
            </button>
          </div>

          {/* Large Preview */}
          <div className="flex justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <CanvasDataPreview canvasData={canvasData} size={300} />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-800 pt-4 text-slate-300">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                お題
              </span>
              <span className="font-bold text-white text-base">
                {theme || <span className="text-slate-500 italic">未設定</span>}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                要素数 (画数)
              </span>
              <span className="font-bold text-white text-base">
                {elementCount}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                イラストID (UUID)
              </span>
              <span className="font-mono text-xs select-all break-all text-slate-400">
                {id}
              </span>
            </div>
          </div>

          {/* Raw JSON Debug Folder */}
          <div className="border-t border-slate-800 pt-4">
            <details className="group cursor-pointer select-none">
              <summary className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold list-none flex items-center gap-1">
                <span className="transition-transform group-open:rotate-90">&rarr;</span>
                生データ (JSON) を表示
              </summary>
              <pre className="mt-3 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto max-h-48 select-text text-slate-450 text-left">
                {JSON.stringify(canvasData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </Modal>
    </>
  );
}
