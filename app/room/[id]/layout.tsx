import RoomClientLayout from '@/components/organisms/room/RoomClientLayout';
import RoomPasswordGate from '@/components/organisms/room/RoomPasswordGate';
import { getRoomAccess } from '@/lib/server/roomAccess';

export default async function Layout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;

  // 未確認のパスワード付きルームは、本体(children)を描画せずゲートだけを返す
  if ((await getRoomAccess(id)) === 'locked') {
    return <RoomPasswordGate roomId={id} />;
  }

  return <RoomClientLayout>{children}</RoomClientLayout>;
}
