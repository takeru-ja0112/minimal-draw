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
          <h1 className="text-2xl font-bold text-gray-900">ルーム管理</h1>
          <p className="text-gray-600 text-sm mt-1">
            アプリケーションに作成された対戦ルームの確認と削除（論理削除）が行えます。
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 self-start md:self-auto text-sm text-gray-700 shadow-sm">
          総ルーム数: <span className="text-amber-600 font-bold">{rooms.length}</span> 件
        </div>
      </div>

      {/* Rooms Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-gray-200 bg-amber-500/10 text-gray-700 text-xs font-semibold uppercase tracking-wider">
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
          <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                  ルームが見つかりません。
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                const isDeleted = room.deleted_at !== null;
                return (
                  <tr
                    key={room.id}
                    className={`transition-colors hover:bg-amber-50/50 ${
                      isDeleted ? "bg-gray-50 text-gray-400" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs select-all text-gray-600">
                      {room.id}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {room.short_id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {room.room_name || <span className="text-gray-400 italic">未設定</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          room.status === "WAITING"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : room.status === "PLAYING"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : room.status === "FINISHED"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {room.current_theme ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {room.current_theme} (ID: {room.current_theme_id})
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Lv.{room.level} / {room.genre}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">お題なし</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs select-all text-gray-600">
                      {room.created_by_userId || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs select-all text-gray-600">
                      {room.answer_id || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {new Date(room.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {isDeleted ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 mb-1">
                            削除済み
                          </span>
                          <span className="text-gray-500">{new Date(room.deleted_at!).toLocaleString("ja-JP")}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isDeleted && (
                        <form action={deleteRoom.bind(null, room.id)}>
                          <ConfirmSubmitButton
                            message={`ルーム「${room.room_name || room.short_id}」を削除しますか？`}
                            buttonText="削除"
                            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 cursor-pointer shadow-sm"
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
