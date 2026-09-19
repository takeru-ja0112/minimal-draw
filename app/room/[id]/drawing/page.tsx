import DrawPage from "@/components/pages/DrawPage";
import { getTheme , getFurigana} from './action';
import { isRoomAccessible } from '@/lib/server/roomAccess';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // 未確認のパスワード付きルームでは、データ取得を行わず layout のゲートに任せる
    if (!(await isRoomAccessible(id))) return null;
    const res = await getTheme(id);
    const resFurigana = await getFurigana(id);
    const theme = res.success && res.data ? res.data : 'お題が設定されていません';
    const furigana = resFurigana.success && resFurigana.data ? resFurigana.data : '';
    return <DrawPage roomId={id} theme={theme} furigana={furigana} />;
}