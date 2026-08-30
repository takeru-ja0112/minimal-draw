import { prismaAdminReadonly } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import DrawingPreviewCell from "@/components/admin/DrawingPreviewCell";
import DrawingFilterControls from "@/components/admin/DrawingFilterControls";
import { deleteDrawing } from "./actions";

export const metadata = {
  title: "イラスト管理 | Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}

export default async function AdminDrawingsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filter = resolvedSearchParams?.filter || "active";
  const sort = resolvedSearchParams?.sort || "desc";

  // Build Prisma filter clause
  let whereClause = {};
  if (filter === "active") {
    whereClause = { deleted_at: null };
  } else if (filter === "deleted") {
    whereClause = { deleted_at: { not: null } };
  }

  // Build Prisma order clause
  const orderByClause = {
    created_at: sort === "asc" ? ("asc" as const) : ("desc" as const),
  };

  const drawings = await prismaAdminReadonly.historyDrawing.findMany({
    where: whereClause,
    orderBy: orderByClause,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">イラスト管理</h1>
          <p className="text-gray-600 text-sm mt-1">
            ユーザーが描画したイラストの確認と削除（論理削除）が行えます。
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 self-start md:self-auto text-sm text-gray-700 shadow-sm">
          イラスト数: <span className="text-amber-600 font-bold">{drawings.length}</span> 件
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <DrawingFilterControls currentFilter={filter} currentSort={sort} />

      {/* Drawings Grid */}
      {drawings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
          イラストが見つかりません。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {drawings.map((drawing) => {
            const isDeleted = drawing.deleted_at !== null;
            return (
              <div
                key={drawing.id}
                className={`relative bg-white rounded-2xl border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  isDeleted ? "opacity-60 bg-gray-50/80" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    {isDeleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        削除済み
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        アクティブ
                      </span>
                    )}

                    <form action={deleteDrawing.bind(null, drawing.id)}>
                      <ConfirmSubmitButton
                        message={
                          isDeleted
                            ? `イラスト「${drawing.theme || drawing.id}」の削除を取り消しますか？`
                            : `イラスト「${drawing.theme || drawing.id}」を削除しますか？`
                        }
                        buttonText={isDeleted ? "復元" : "削除"}
                        className={`${
                          isDeleted
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        } text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 cursor-pointer shadow-xs`}
                      />
                    </form>
                  </div>

                  <div className="flex justify-center my-2">
                    <DrawingPreviewCell
                      canvasData={drawing.canvas_data}
                      theme={drawing.theme}
                      elementCount={drawing.element_count}
                      id={drawing.id}
                    />
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-2 space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 truncate max-w-[120px]" title={drawing.theme || "未設定"}>
                      お題: {drawing.theme || "未設定"}
                    </span>
                    <span className="font-bold text-gray-900">
                      要素: {drawing.element_count}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {new Date(drawing.created_at).toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}