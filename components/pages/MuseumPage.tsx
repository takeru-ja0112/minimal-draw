"use client";

import { getArtsByTheme } from "@/app/museum/action";
import type { DrawingDataType } from "@/type/DrawingDataType";
import { useState } from "react";
import ArtSection from "@/components/molecules/ArtSection";
import ThemeSearchForm from "@/components/molecules/ThemeSearchForm";
import ArtDetailModal from "@/components/molecules/ArtDetailModal";
import Card from "@/components/atoms/Card"

export default function MuseumPage({
  highCountArts,
  lowCountArts,
  themeList,
}: {
  highCountArts: DrawingDataType[];
  lowCountArts: DrawingDataType[];
  themeList: string[];
}) {
  const [selectedArt, setSelectedArt] = useState<DrawingDataType | null>(null);
  const [themeResults, setThemeResults] = useState<DrawingDataType[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(theme: string, minCount?: number) {
    setLoading(true);
    try {
      const data = await getArtsByTheme(theme, minCount);
      setThemeResults(data as unknown as DrawingDataType[]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-500">過去のイラスト</h1>
      </div>

      <div className="mx-4 space-y-4">
        <Card>
          <ArtSection title="画数が多い作品" arts={highCountArts} onSelectArt={setSelectedArt} />
        </Card>
        <Card>
          <ArtSection title="画数が少ない作品" arts={lowCountArts} onSelectArt={setSelectedArt} />
        </Card>
        <section className="mb-8">
          <Card>
            <h2 className="text-lg font-bold text-gray-600 px-6 mb-2">テーマで検索</h2>
            <ThemeSearchForm themeList={themeList} onSearch={handleSearch} loading={loading} />
            {searched && (
              <ArtSection
                title="検索結果"
                arts={themeResults}
                onSelectArt={setSelectedArt}
                emptyMessage="条件に一致する作品がありません"
              />
            )}
          </Card>
        </section>
        <ArtDetailModal art={selectedArt} onClose={() => setSelectedArt(null)} />
      </div>
    </>
  );
}