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
          <h1 className="text-2xl font-bold text-gray-900">お題マスタ管理</h1>
          <p className="text-gray-600 text-sm mt-1">
            ゲームで出題されるお題マスタデータの追加・削除・ジャンル別絞り込みが行えます。
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 self-start md:self-auto text-sm text-gray-700 shadow-sm">
          総お題数: <span className="text-amber-600 font-bold">{allThemes.length}</span> 件
        </div>
      </div>

      {/* Add Theme Form Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">新規お題の追加</h2>
        <form action={createTheme} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              お題 (日本語表記)
            </label>
            <input
              type="text"
              name="theme"
              placeholder="例: ねこ"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              レベル
            </label>
            <select
              name="level"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            >
              <option value="EASY">EASY (簡単)</option>
              <option value="NORMAL">NORMAL (普通)</option>
              <option value="HARD">HARD (難しい)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              ジャンル
            </label>
            <input
              type="text"
              name="genre"
              placeholder="例: 生き物"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              漢字表記
            </label>
            <input
              type="text"
              name="kanji"
              placeholder="例: 猫"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              カタカナ表記
            </label>
            <input
              type="text"
              name="katakana"
              placeholder="例: ネコ"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              ふりがな表記
            </label>
            <input
              type="text"
              name="furigana"
              placeholder="例: ねこ"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors duration-200 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              お題を追加する
            </button>
          </div>
        </form>
      </div>

      {/* Genre Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {genres.map((genre) => {
          const isActive = currentGenre === genre;
          return (
            <Link
              key={genre}
              href={`/admin/themes${genre === "ALL" ? "" : `?genre=${encodeURIComponent(genre)}`}`}
              className={`px-4 py-2 rounded-xl text-xs transition-all duration-200 ${
                isActive
                  ? "bg-amber-500 text-white font-bold border border-amber-500 shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300 hover:text-amber-600 font-medium"
              }`}
            >
              {genre === "ALL" ? "すべて表示" : genre}
            </Link>
          );
        })}
      </div>

      {/* Themes Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 bg-amber-500/10 text-gray-700 text-xs font-semibold uppercase tracking-wider">
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
          <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
            {displayedThemes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                  お題が見つかりません。
                </td>
              </tr>
            ) : (
              displayedThemes.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-amber-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {t.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {t.theme}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        t.level === "EASY"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : t.level === "NORMAL"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-rose-100 text-rose-700 border-rose-200"
                      }`}
                    >
                      {t.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
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
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 cursor-pointer shadow-sm"
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
