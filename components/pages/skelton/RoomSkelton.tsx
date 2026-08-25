import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Link from "next/link";
import {
  TbArrowLeft,
  TbBallBowling,
  TbCopy,
  TbCrown,
  TbDice5,
  TbPencil,
} from "react-icons/tb";

export default function RoomSkelton() {
  return (
    <div>
      {/* 戻るボタン */}
      <Link
        href={`/`}
        className="z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full"
      >
        <TbArrowLeft size="2em" />
      </Link>

      {/* 参加者 & スコアボード (UserScoreBoard) */}
      <section className="p-4 pb-2 bg-white/70">
        <h2 className="text-sm font-bold mb-4 text-center">参加者</h2>
        <div className="flex items-end overflow-x-auto gap-3 pb-2 h-20">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="relative flex items-center gap-1 shrink-0">
              <div className="relative w-15 h-15 shrink-0 rounded-full border border-2 border-gray-300 bg-white flex items-center justify-center font-bold shadow">
                {idx === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <TbCrown size="1.1em" className="text-gray-500 drop-shadow-lg" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              </div>
              <div className="bg-white px-3 py-1.5 rounded-full font-bold whitespace-nowrap">
                <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full p-8">
        <div className="max-w-lg mx-auto">
          {/* お手軽モードカード (AutoGuideCard) */}
          <Card className="mb-4 text-center relative">
            <div className="absolute -top-4 -left-10 bg-amber-300 py-3 px-6 rounded-full font-bold text border border-2 border-white -rotate-12">
              おすすめ！
            </div>
            <h2 className="text-xl font-bold mt-6">お手軽モード</h2>
            <div className="my-10 relative text-center">
              <p className="text-center text-sm text-gray-500 font-semibold">
                回答者をランダムに選び、ゲームを開始します！
                <br />
                このボタンはルーム作成者のみが押せます！
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button value="お手軽スタート" icon={<TbDice5 />} className="w-full" />
            </div>
          </Card>

          {/* 描く人・答える人カード (DrawerGuideCard & AnswererGuideCard) */}
          <div className="text-center">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {/* 描く人カード */}
              <Card className="mb-4">
                <h2 className="text-sm font-bold truncate max-w-[8rem]">
                  <span className="text-amber-600">描く人</span>はこちら
                </h2>
                <div className="my-5 w-fit mx-auto flex text-center gap-0 relative">
                  <TbPencil size="3rem" className="text-center text-gray-500" />
                </div>
                <div className="flex flex-col items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-left text-gray-500 font-semibold">描く人</p>
                    <p className="font-bold text-lg">
                      <span>1</span>人以上
                    </p>
                  </div>
                  <Button value="お題を描く" />
                </div>
              </Card>

              {/* 回答者カード */}
              <Card className="mb-4 perspective-1000 relative">
                <h2 className="text-sm font-bold truncate max-w-[8rem]">
                  <span className="text-amber-600">答える人</span>はこちら
                </h2>
                <div className="absolute -top-4 -right-3 rotate-12 px-3 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-600 flex items-center gap-1">
                  <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="my-5 w-fit mx-auto flex text-center gap-0 relative">
                  <TbBallBowling size="3rem" className="text-center text-gray-500" />
                </div>
                <div className="flex flex-col items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-left text-gray-500 font-semibold">回答者</p>
                    <p className="font-bold text-lg">
                      <span>1</span>人まで
                    </p>
                  </div>
                  <Button value="回答ページへ" />
                </div>
              </Card>
            </div>
          </div>

          {/* お題変更ボタン */}
          <Button value="お題を変更する" className="w-full" />

          {/* ルーム情報 (RoomIdCard) */}
          <div className="my-6 text-center">
            <h2 className="text-md text-gray-500 font-semibold mb-1">ルーム名</h2>
            <div className="h-6 w-36 bg-gray-300 rounded mx-auto mb-2 animate-pulse" />
            <div className="flex items-center justify-center gap-1">
              <div className="h-5 w-20 bg-gray-300 rounded animate-pulse" />
              <TbCopy className="text-gray-400" />
            </div>
          </div>

          {/* ステータスバー (StatusBar) */}
          <div className="mt-5 text-center bg-yellow-400 py-2 rounded-3xl w-full max-w-lg">
            <h1 className="font-bold flex items-center justify-center">
              <div className="h-5 w-44 bg-yellow-200/80 rounded animate-pulse" />
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}