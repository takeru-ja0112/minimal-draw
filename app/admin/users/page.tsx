import { prismaAdminReadonly } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import { deleteUser } from "./actions";

export const metadata = {
  title: "ユーザー管理 | Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUsersPage() {
  const users = await prismaAdminReadonly.mUser.findMany({
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">ユーザー管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            アプリケーションに登録されているユーザーの確認と削除（論理削除）が行えます。
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto text-sm">
          総ユーザー数: <span className="text-white font-bold">{users.length}</span> 名
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">ユーザーID (UUID)</th>
              <th className="px-6 py-4">ユーザー名</th>
              <th className="px-6 py-4">作成日時</th>
              <th className="px-6 py-4">更新日時</th>
              <th className="px-6 py-4">ステータス / 削除日時</th>
              <th className="px-6 py-4 text-right">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  ユーザーが登録されていません。
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isDeleted = user.deleted_at !== null;
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors hover:bg-slate-800/20 ${
                      isDeleted ? "bg-slate-950/40 text-slate-500" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-xs select-all">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {user.username || <span className="text-slate-500 italic">未設定</span>}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(user.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(user.updated_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {isDeleted ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
                            削除済み
                          </span>
                          <span>{new Date(user.deleted_at!).toLocaleString("ja-JP")}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          アクティブ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isDeleted && (
                        <form action={deleteUser.bind(null, user.id)}>
                          <ConfirmSubmitButton
                            message={`ユーザー「${user.username || user.id}」を削除しますか？\n削除すると紐づく部屋、イラスト、履歴、ポイント、プッシュ通知サブスクリプションもすべて論理削除されます。`}
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
