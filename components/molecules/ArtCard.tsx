"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import Card from "@/components/atoms/Card";

export default function ArtCard({
  art,
  onClick,
}: {
  art: DrawingDataType;
  onClick?: () => void;
}) {
  return (
    <Card className="cursor-pointer w-fit" >
      <div onClick={onClick} className="relative">
        <div className="absolute w-10 h-10 flex items-center justify-center -top-2 -right-1 p-2 rounded-full border-2 border-amber-400 bg-white text-amber-600 font-bold">
          <label htmlFor="count">{art.element_count}</label>
        </div>
        <div className="w-[190px] p-4 bg-yellow-500 rounded-lg rounded-b-none text-center">
          <h2 className="text-md font-semibold text-yellow-900/70">お題</h2>
          <h2 className="text-xl font-semibold">{art.theme}</h2>
        </div>
        <div className="w-[190px] bg-white border-4 rounded-lg border-yellow-500 rounded-t-none flex justify-center items-center">
          <Stage scale={{ x: 0.6, y: 0.6 }} width={180} height={180}>
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
        <p className="text-center text-sm text-gray-500 mt-1">
          作成者: {art.user?.username ?? "不明"}
        </p>
      </div>
    </Card>
  );
}
