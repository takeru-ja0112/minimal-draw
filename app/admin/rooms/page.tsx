import { prismaAdminReadonly } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import { deleteRoom } from "./actions";

export const metadata = {
  title: "ルーム管理 | Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRoomsPage() {
  const rooms = await prismaAdminReadonly.room.findMany({
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">ルーム管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            アプリケーションに作成された対戦ルームの確認と削除（論理削除）が行えます。
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto text-sm">
          総ルーム数: <span className="text-white font-bold">{rooms.length}</span> 件
        </div>
      </div>

      {/* Rooms Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">ルームID (UUID)</th>
              <th className="px-6 py-4">Short ID</th>
              <th className="px-6 py-4">ルーム名</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">お題 / レベル / ジャンル</th>
              <th className="px-6 py-4">作成者ID</th>
              <th className="px-6 py-4">回答者ID</th>
              <th className="px-6 py-4">作成日時</th>
              <th className="px-6 py-4">削除日時</th>
              <th className="px-6 py-4 text-right">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-slate-500">
                  ルームが見つかりません。
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                const isDeleted = room.deleted_at !== null;
                return (
                  <tr
                    key={room.id}
                    className={`transition-colors hover:bg-slate-800/20 ${
                      isDeleted ? "bg-slate-950/40 text-slate-500" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {room.id}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-200">
                      {room.short_id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {room.room_name || <span className="text-slate-500 italic">未設定</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          room.status === "WAITING"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : room.status === "PLAYING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : room.status === "FINISHED"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {room.current_theme ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">
                            {room.current_theme} (ID: {room.current_theme_id})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Lv.{room.level} / {room.genre}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">お題なし</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {room.created_by_userId || <span className="text-slate-500">-</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {room.answer_id || <span className="text-slate-500">-</span>}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(room.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {isDeleted ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
                            削除済み
                          </span>
                          <span>{new Date(room.deleted_at!).toLocaleString("ja-JP")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isDeleted && (
                        <form action={deleteRoom.bind(null, room.id)}>
                          <ConfirmSubmitButton
                            message={`ルーム「${room.room_name || room.short_id}」を削除しますか？`}
                            buttonText="削除"
                            className="bg-rose-600/80 hover:bg-rose-600 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 cursor-pointer"
                          />
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
