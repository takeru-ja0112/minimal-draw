import { prismaAdminReadonly } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import Link from "next/link";
import { createTheme, deleteTheme } from "./actions";

export const metadata = {
  title: "お題管理 | Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{ genre?: string }>;
}

export default async function AdminThemesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const currentGenre = resolvedSearchParams?.genre || "ALL";

  // Fetch all themes and extract distinct genres
  const allThemes = await prismaAdminReadonly.theme.findMany({
    orderBy: [{ genre: "asc" }, { theme: "asc" }],
  });

  const genres = ["ALL", ...Array.from(new Set(allThemes.map((t) => t.genre)))];

  const displayedThemes =
    currentGenre === "ALL"
      ? allThemes
      : allThemes.filter((t) => t.genre === currentGenre);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">お題マスタ管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            ゲームで出題されるお題マスタデータの追加・削除・ジャンル別絞り込みが行えます。
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto text-sm">
          総お題数: <span className="text-white font-bold">{allThemes.length}</span> 件
        </div>
      </div>

      {/* Add Theme Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <h2 className="text-lg font-bold text-white mb-4">新規お題の追加</h2>
        <form action={createTheme} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              お題 (日本語表記)
            </label>
            <input
              type="text"
              name="theme"
              placeholder="例: ねこ"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-650 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              レベル
            </label>
            <select
              name="level"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
            >
              <option value="EASY">EASY (簡単)</option>
              <option value="NORMAL">NORMAL (普通)</option>
              <option value="HARD">HARD (難しい)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              ジャンル
            </label>
            <input
              type="text"
              name="genre"
              placeholder="例: 生き物"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              漢字表記
            </label>
            <input
              type="text"
              name="kanji"
              placeholder="例: 猫"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              カタカナ表記
            </label>
            <input
              type="text"
              name="katakana"
              placeholder="例: ネコ"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              ふりがな表記
            </label>
            <input
              type="text"
              name="furigana"
              placeholder="例: ねこ"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors duration-200 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              お題を追加する
            </button>
          </div>
        </form>
      </div>

      {/* Genre Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {genres.map((genre) => {
          const isActive = currentGenre === genre;
          return (
            <Link
              key={genre}
              href={`/admin/themes${genre === "ALL" ? "" : `?genre=${encodeURIComponent(genre)}`}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-205 ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-550 shadow-md shadow-indigo-600/10"
                  : "bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {genre === "ALL" ? "すべて表示" : genre}
            </Link>
          );
        })}
      </div>

      {/* Themes Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">お題 (表示)</th>
              <th className="px-6 py-4">レベル</th>
              <th className="px-6 py-4">ジャンル</th>
              <th className="px-6 py-4">漢字</th>
              <th className="px-6 py-4">カタカナ</th>
              <th className="px-6 py-4">ふりがな</th>
              <th className="px-6 py-4 text-right">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {displayedThemes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                  お題が見つかりません。
                </td>
              </tr>
            ) : (
              displayedThemes.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {t.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200">
                    {t.theme}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        t.level === "EASY"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : t.level === "NORMAL"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {t.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {t.genre}
                  </td>
                  <td className="px-6 py-4">
                    {t.kanji}
                  </td>
                  <td className="px-6 py-4">
                    {t.katakana}
                  </td>
                  <td className="px-6 py-4">
                    {t.furigana}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={deleteTheme.bind(null, t.id)}>
                      <ConfirmSubmitButton
                        message={`お題「${t.theme}」をデータベースから完全に物理削除しますか？`}
                        buttonText="物理削除"
                        className="bg-rose-600/80 hover:bg-rose-600 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 cursor-pointer"
                      />
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
