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
      color: "from-blue-600 to-indigo-600",
      shadow: "shadow-blue-500/10"
    },
    {
      title: "ルーム管理",
      href: "/admin/rooms",
      icon: TbDoor,
      total: roomTotal,
      active: roomActive,
      deleted: roomTotal - roomActive,
      color: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/10"
    },
    {
      title: "イラスト管理",
      href: "/admin/drawings",
      icon: TbPalette,
      total: drawingTotal,
      active: drawingActive,
      deleted: drawingTotal - drawingActive,
      color: "from-violet-600 to-purple-650",
      shadow: "shadow-violet-500/10"
    },
    {
      title: "履歴管理",
      href: "/admin/history-drawings",
      icon: TbHistory,
      total: historyTotal,
      active: historyActive,
      deleted: historyTotal - historyActive,
      color: "from-amber-600 to-orange-655",
      shadow: "shadow-amber-500/10"
    },
    {
      title: "お題管理",
      href: "/admin/themes",
      icon: TbTags,
      total: themeTotal,
      active: themeTotal, // Master data doesn't have soft delete
      deleted: 0,
      color: "from-rose-600 to-pink-600",
      shadow: "shadow-rose-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">ダッシュボード</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Minimal Draw アプリケーションのシステム状態と各データベースレコードの管理を行います。
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.href}
              href={stat.href}
              className="group block relative rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900 hover:-translate-y-1 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                {/* Icon wrapper with gradient bg */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon size={24} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 group-hover:border-slate-600 transition-colors">
                  管理画面へ &rarr;
                </span>
              </div>

              <h2 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {stat.title}
              </h2>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 mt-4 text-center">
                <div>
                  <div className="text-xl font-bold text-white">{stat.total}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">総件数</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-400">{stat.active}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">有効</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-rose-400">{stat.deleted}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">削除済み</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* System Info Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <h3 className="text-md font-bold text-white mb-3">システム情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div className="flex justify-between py-2 border-b border-slate-850">
            <span>Next.js バージョン</span>
            <span className="font-mono text-white text-xs">v16.1.5</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-850">
            <span>React バージョン</span>
            <span className="font-mono text-white text-xs">v19.2.4</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-850">
            <span>Prisma ORM</span>
            <span className="font-mono text-white text-xs">v7.9.1</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-850">
            <span>環境</span>
            <span className="font-mono text-emerald-400 text-xs">Production Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
