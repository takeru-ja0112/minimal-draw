"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import ArtCard from "./ArtCard";

export default function ArtSection({
  title,
  arts,
  onSelectArt,
  emptyMessage = "該当する作品がありません",
}: {
  title: string;
  arts: DrawingDataType[];
  onSelectArt: (art: DrawingDataType) => void;
  emptyMessage?: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-600 px-6 mb-2">{title}</h2>
      {arts.length === 0 ? (
        <p className="text-sm text-gray-400 px-6">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto w-full">
          <div className="flex gap-8 min-w-max px-6 pb-2">
            {arts.map((art) => (
              <div key={art.id} className="w-[200px] shrink-0">
                <ArtCard art={art} onClick={() => onSelectArt(art)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
