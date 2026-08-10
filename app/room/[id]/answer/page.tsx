import AnswerPage from '@/components/pages/AnswerPage';
import { getDrawingsByRoom, getThemePatternByRoomId} from '@/app/room/[id]/answer/action';
import { getInfoRoom } from '../action';
import type { Drawing } from '@/type/AnswerType';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = await params;
    const result = await getDrawingsByRoom(roomId);
    const themeResult = await getThemePatternByRoomId(roomId);
    const roomInfoResult = await getInfoRoom(roomId);
    const status = ((roomInfoResult.success && roomInfoResult.data) ? roomInfoResult.data.status : 'WATING') as
        'WATING' | 'DRAWING' | 'ANSWERING' | 'FINISHED' | 'RESETTING';

    const drawings = ((result.success && result.data) ? result.data : []) as unknown as Drawing[];
    const theme = (themeResult.success && themeResult.data) ? themeResult.data : null;
    
    return <AnswerPage roomId={roomId} drawings={drawings} initialTheme={theme} initialStatus={status} />;
}