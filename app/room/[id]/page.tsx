import RoomPage from '@/components/pages/RoomPage';
import { getInfoRoom, getRoomScores } from './action';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const scoresRes = await getRoomScores(roomId);
  const scores = scoresRes.success && scoresRes.data ? scoresRes.data : [];
  const sordScores = scores.sort((a, b) => b.point - a.point);
  const res = await getInfoRoom(roomId);
  const title = res.success && res.data ? res.data.room_name ?? '' : '';
  const shortId = res.success && res.data ? res.data.short_id : '';
  const creatorId = res.success && res.data ? res.data.created_by_userId ?? '' : '';

  return <RoomPage title={title} shortId={shortId} scores={sordScores} creatorId={creatorId} />
}
