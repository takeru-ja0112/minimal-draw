import { getArts } from "@/app/museum/action";
import MuseumPage from "@/components/pages/MuseumPage";
import type { DrawingDataType } from "@/type/DrawingDataType";

export default async function Page() {

  const arts: Array<DrawingDataType> = JSON.stringify(await getArts()) ? await getArts() : [];

  return <MuseumPage arts={arts} />;
}