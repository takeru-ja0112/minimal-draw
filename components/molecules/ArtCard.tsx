"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import Card from "@/components/atoms/Card";
import { useInView } from "@/hooks/useInView";

const kanaMap: Record<string, string> = {
  'あ': 'A', 'い': 'I', 'う': 'U', 'え': 'E', 'お': 'O',
  'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
  'か': 'K', 'き': 'K', 'く': 'K', 'け': 'K', 'こ': 'K',
  'が': 'K', 'ぎ': 'K', 'ぐ': 'K', 'げ': 'K', 'ご': 'K',
  'カ': 'K', 'キ': 'K', 'ク': 'K', 'ケ': 'K', 'コ': 'K',
  'ガ': 'K', 'ギ': 'K', 'グ': 'K', 'ゲ': 'K', 'ゴ': 'K',
  'さ': 'S', 'し': 'S', 'す': 'S', 'せ': 'S', 'そ': 'S',
  'ざ': 'S', 'じ': 'S', 'ず': 'S', 'ぜ': 'S', 'ぞ': 'S',
  'サ': 'S', 'シ': 'S', 'ス': 'S', 'セ': 'S', 'ソ': 'S',
  'ザ': 'S', 'ジ': 'S', 'ズ': 'S', 'ゼ': 'S', 'ゾ': 'S',
  'た': 'T', 'ち': 'T', 'つ': 'T', 'て': 'T', 'と': 'T',
  'だ': 'T', 'ぢ': 'T', 'づ': 'T', 'で': 'T', 'ど': 'T',
  'タ': 'T', 'チ': 'T', 'ツ': 'T', 'テ': 'T', 'ト': 'T',
  'ダ': 'T', 'ヂ': 'T', 'ヅ': 'T', 'デ': 'T', 'ド': 'T',
  'な': 'N', 'に': 'N', 'ぬ': 'N', 'ね': 'N', 'の': 'N',
  'ナ': 'N', 'ニ': 'N', 'ヌ': 'N', 'ネ': 'N', 'ノ': 'N',
  'は': 'H', 'ひ': 'H', 'ふ': 'F', 'へ': 'H', 'ほ': 'H',
  'ば': 'B', 'び': 'B', 'ぶ': 'B', 'べ': 'B', 'ぼ': 'B',
  'ぱ': 'P', 'ぴ': 'P', 'ぷ': 'P', 'ぺ': 'P', 'ぽ': 'P',
  'ハ': 'H', 'ヒ': 'H', 'フ': 'F', 'ヘ': 'H', 'ホ': 'H',
  'バ': 'B', 'ビ': 'B', 'ブ': 'B', 'ベ': 'B', 'ボ': 'B',
  'パ': 'P', 'ピ': 'P', 'プ': 'P', 'ペ': 'P', 'ポ': 'P',
  'ま': 'M', 'み': 'M', 'む': 'M', 'め': 'M', 'も': 'M',
  'マ': 'M', 'ミ': 'M', 'ム': 'M', 'メ': 'M', 'モ': 'M',
  'や': 'Y', 'ゆ': 'Y', 'よ': 'Y',
  'ヤ': 'Y', 'ユ': 'Y', 'ヨ': 'Y',
  'ら': 'R', 'り': 'R', 'る': 'R', 'れ': 'R', 'ろ': 'R',
  'ラ': 'R', 'リ': 'R', 'ル': 'R', 'レ': 'R', 'ロ': 'R',
  'わ': 'W', 'を': 'W', 'ん': 'N',
  'ワ': 'W', 'ヲ': 'W', 'ン': 'N',
};

function getAlphabetInitial(username: string | null | undefined): string {
  if (!username || username === "不明") return "U";
  if (username === "名無し") return "N";
  
  const firstChar = username.trim().charAt(0);
  
  if (/^[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  
  if (kanaMap[firstChar]) {
    return kanaMap[firstChar];
  }
  
  // 漢字やその他の文字のフォールバック
  return "U";
}

export default function ArtCard({
  art,
  onClick,
}: {
  art: DrawingDataType;
  onClick?: () => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

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
        <div
          ref={ref}
          className="w-[190px] h-[180px] bg-white border-4 rounded-lg border-yellow-500 rounded-t-none flex justify-center items-center"
        >
          {inView && (
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
          )}
        </div>
        <p className="text-center text-sm text-gray-500 mt-1">
          By: {getAlphabetInitial(art.user?.username)}
        </p>
      </div>
    </Card>
  );
}
