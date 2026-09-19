import RoomPage from '@/components/pages/RoomPage';
import { getInfoRoom, getRoomScores } from './action';
import { isRoomAccessible } from '@/lib/server/roomAccess';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  // 未確認のパスワード付きルームでは、データ取得を行わず layout のゲートに任せる
  if (!(await isRoomAccessible(roomId))) return null;
  const scoresRes = await getRoomScores(roomId);
  const scores = scoresRes.success && scoresRes.data ? scoresRes.data : [];
  const sordScores = scores.sort((a, b) => b.point - a.point);
  const res = await getInfoRoom(roomId);
  const title = res.success && res.data ? res.data.room_name ?? '' : '';
  const shortId = res.success && res.data ? res.data.short_id : '';
  const creatorId = res.success && res.data ? res.data.created_by_userId ?? '' : '';

  return <RoomPage title={title} shortId={shortId} scores={sordScores} creatorId={creatorId} />
}
