import { prismaAdminReadonly } from "@/lib/prisma";
import Link from "next/link";
import { TbUsers, TbDoor, TbPalette, TbHistory, TbTags } from "react-icons/tb";

export default async function AdminDashboardPage() {
  // Fetch stats concurrently
  const [
    [userTotal, userActive],
    [roomTotal, roomActive],
    [drawingTotal, drawingActive],
    [historyTotal, historyActive],
    themeTotal
  ] = await Promise.all([
    Promise.all([
      prismaAdminReadonly.mUser.count(),
      prismaAdminReadonly.mUser.count({ where: { deleted_at: null } })
    ]),
    Promise.all([
      prismaAdminReadonly.room.count(),
      prismaAdminReadonly.room.count({ where: { deleted_at: null } })
    ]),
    Promise.all([
      prismaAdminReadonly.drawing.count(),
      prismaAdminReadonly.drawing.count({ where: { deleted_at: null } })
    ]),
    Promise.all([
      prismaAdminReadonly.historyDrawing.count(),
      prismaAdminReadonly.historyDrawing.count({ where: { deleted_at: null } })
    ]),
    prismaAdminReadonly.theme.count()
  ]);

  const stats = [
    {
      title: "ユーザー管理",
      href: "/admin/users",
      icon: TbUsers,
      total: userTotal,
      active: userActive,
      deleted: userTotal - userActive,
    },
    {
      title: "ルーム管理",
      href: "/admin/rooms",
      icon: TbDoor,
      total: roomTotal,
      active: roomActive,
      deleted: roomTotal - roomActive,
    },
    {
      title: "イラスト管理",
      href: "/admin/drawings",
      icon: TbPalette,
      total: drawingTotal,
      active: drawingActive,
      deleted: drawingTotal - drawingActive,
    },
    {
      title: "履歴管理",
      href: "/admin/history-drawings",
      icon: TbHistory,
      total: historyTotal,
      active: historyActive,
      deleted: historyTotal - historyActive,
    },
    {
      title: "お題管理",
      href: "/admin/themes",
      icon: TbTags,
      total: themeTotal,
      active: themeTotal, // Master data doesn't have soft delete
      deleted: 0,
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">minimal 管理画面</h1>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.href}
              href={stat.href}
              className="group block relative rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-amber-400 hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                {/* Icon wrapper */}
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Icon size={24} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-200 transition-colors">
                  管理画面へ &rarr;
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                {stat.title}
              </h2>

              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 mt-4 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900">{stat.total}</div>
                  <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">総件数</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-600">{stat.active}</div>
                  <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">有効</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-rose-600">{stat.deleted}</div>
                  <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">削除済み</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
