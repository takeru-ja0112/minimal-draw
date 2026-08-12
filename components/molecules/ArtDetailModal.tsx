"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import Modal from "@/components/organisms/Modal";

export default function ArtDetailModal({
  art,
  onClose,
}: {
  art: DrawingDataType | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!art} onClose={onClose}>
      {art && (
        <div className="text-center">
          <h2 className="text-md font-semibold text-yellow-900/70">お題</h2>
          <h2 className="text-xl font-semibold mb-2">{art.theme}</h2>
          <div className="flex justify-center bg-white border border-gray-200 rounded-xl p-2">
            <Stage width={300} height={300}>
              <Layer>
                {art.canvas_data?.lines?.map((line, i) => (
                  <Line key={`line-${i}`} points={line} stroke="black" strokeWidth={3} />
                ))}
                {art.canvas_data?.circles?.map((circle, i) => (
                  <Circle key={`circle-${i}`} x={circle.x} y={circle.y} radius={circle.radius} stroke="black" strokeWidth={3} />
                ))}
                {art.canvas_data?.rects?.map((rect, i) => (
                  <Rect key={`rect-${i}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} stroke="black" strokeWidth={3} />
                ))}
              </Layer>
            </Stage>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            作成者: {art.user?.username ?? "不明"}
          </p>
        </div>
      )}
    </Modal>
  );
}
