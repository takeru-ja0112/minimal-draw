import { prismaAdminReadonly } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import DrawingPreviewCell from "@/components/admin/DrawingPreviewCell";
import { deleteHistoryDrawing } from "./actions";

export const metadata = {
  title: "履歴イラスト管理 | Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHistoryDrawingsPage() {
  const drawings = await prismaAdminReadonly.historyDrawing.findMany({
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">履歴管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            対戦終了後に保存されたイラスト履歴の確認と削除（論理削除）が行えます。
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto text-sm">
          履歴イラスト数: <span className="text-white font-bold">{drawings.length}</span> 件
        </div>
      </div>

      {/* History Drawings Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">履歴ID (UUID)</th>
              <th className="px-6 py-4">ルームID (UUID)</th>
              <th className="px-6 py-4">ユーザーID (UUID)</th>
              <th className="px-6 py-4">お題</th>
              <th className="px-6 py-4">要素数</th>
              <th className="px-6 py-4">作成日時</th>
              <th className="px-6 py-4">削除日時</th>
              <th className="px-6 py-4">描画データ (JSON)</th>
              <th className="px-6 py-4 text-right">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {drawings.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                  イラスト履歴が見つかりません。
                </td>
              </tr>
            ) : (
              drawings.map((drawing) => {
                const isDeleted = drawing.deleted_at !== null;
                return (
                  <tr
                    key={drawing.id}
                    className={`transition-colors hover:bg-slate-800/20 ${
                      isDeleted ? "bg-slate-950/40 text-slate-500" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {drawing.id}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {drawing.room_id}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {drawing.user_id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {drawing.theme || <span className="text-slate-500 italic">未設定</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">
                      {drawing.element_count}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(drawing.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {isDeleted ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
                            削除済み
                          </span>
                          <span>{new Date(drawing.deleted_at!).toLocaleString("ja-JP")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-550">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <DrawingPreviewCell
                        canvasData={drawing.canvas_data}
                        theme={drawing.theme}
                        elementCount={drawing.element_count}
                        id={drawing.id}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isDeleted && (
                        <form action={deleteHistoryDrawing.bind(null, drawing.id)}>
                          <ConfirmSubmitButton
                            message={`履歴イラスト「${drawing.theme || drawing.id}」を削除しますか？`}
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
