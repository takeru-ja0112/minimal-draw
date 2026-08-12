export const dynamic = 'force-dynamic';

import { getArtsByCountAsc, getArtsByCountDesc, getThemeList } from "@/app/museum/action";
import MuseumPage from "@/components/pages/MuseumPage";
import type { DrawingDataType } from "@/type/DrawingDataType";

export default async function Page() {
  const [highCountArts, lowCountArts, themeList] = await Promise.all([
    getArtsByCountDesc(),
    getArtsByCountAsc(),
    getThemeList(),
  ]);

  return (
    <MuseumPage
      highCountArts={highCountArts as unknown as DrawingDataType[]}
      lowCountArts={lowCountArts as unknown as DrawingDataType[]}
      themeList={themeList}
    />
  );
}