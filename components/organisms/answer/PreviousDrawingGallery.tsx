"use client";

import Button from "@/components/atoms/Button";
import Modal from "@/components/organisms/Modal";
import type { Drawing } from "@/type/AnswerType";
import { useState } from "react";
import DrawingCanvasPreview from "./DrawingCanvasPreview";

type PreviousDrawingGalleryProps = {
  drawings: Drawing[];
};

export default function PreviousDrawingGallery({ drawings }: PreviousDrawingGalleryProps) {
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const selectedIndex = selectedDrawing
    ? drawings.findIndex((drawing) => drawing.id === selectedDrawing.id)
    : -1;

  if (drawings.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="previous-drawings-heading">
      <div className="mb-2 flex items-end justify-between gap-2">
        <h2 id="previous-drawings-heading" className="font-bold text-gray-700">
          これまでのイラスト
        </h2>
        <p className="text-xs text-gray-400">タップで拡大</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {drawings.map((drawing, index) => (
          <button
            key={drawing.id}
            type="button"
            onClick={() => setSelectedDrawing(drawing)}
            aria-label={`${index + 1}枚目のイラストを拡大表示`}
            className="shrink-0 rounded-xl border-2 border-dotted border-gray-300 bg-white p-2 text-left shadow-sm transition hover:border-amber-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <DrawingCanvasPreview canvasData={drawing.canvas_data} size={80} />
            <p className="mt-1 text-center text-xs font-semibold text-gray-600">
              {index + 1}枚目
            </p>
          </button>
        ))}
      </div>

      <Modal
        isOpen={selectedDrawing !== null}
        onClose={() => setSelectedDrawing(null)}
        className="w-[calc(100vw-2rem)] !p-3 sm:w-auto sm:!p-6"
      >
        {selectedDrawing && (
          <div className="flex flex-col items-center">
            <h2 className="mb-1 text-xl font-bold text-gray-700">
              {selectedIndex + 1}枚目のイラスト
            </h2>
            <p className="mb-3 text-sm text-gray-500">
              要素数: {selectedDrawing.element_count} / 描いた人: {selectedDrawing.user?.username ?? "名無し"}
            </p>
            <DrawingCanvasPreview
              canvasData={selectedDrawing.canvas_data}
              size={240}
              className="overflow-hidden rounded-lg border-4 border-gray-300 bg-white shadow-lg"
            />
            <Button
              value="閉じる"
              onClick={() => setSelectedDrawing(null)}
              className="mt-4 w-full"
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
