'use client';

import { fetchNearbyRooms } from '@/app/lobby/action';
import Loading from '@/components/atoms/Loading';
import RoomLockIcon from '@/components/atoms/RoomLockIcon';
import { showToast } from '@/components/common/toast';
import Modal from '@/components/organisms/Modal';
import RoomPasswordDialog from '@/components/organisms/room/RoomPasswordDialog';
import { POSITION_ERROR_MESSAGES, requestCurrentPosition } from '@/lib/currentPosition';
import historyLocalRoom from '@/lib/hitoryLocalRoom';
import { getRoomAccessPassword } from '@/lib/roomAccessLocal';
import type { NearbyRoom } from '@/type/roomType';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TbSearch } from 'react-icons/tb';

type RoomNearbySectionProps = {
  user: string;
  userId: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
};

export default function RoomNearbySection({ user, setNameError }: RoomNearbySectionProps) {
  const router = useRouter();
  const { setLocalRoom } = historyLocalRoom();
  const [searching, setSearching] = useState(false);
  const [nearbyRooms, setNearbyRooms] = useState<NearbyRoom[] | null>(null);
  const [lockedRoom, setLockedRoom] = useState<NearbyRoom | null>(null);

  const handleSearch = async () => {
    setNameError('');
    if (!user) {
      setNameError('ルームに参加するにはユーザー名が必要です。');
      return;
    }

    setSearching(true);
    try {
      const position = await requestCurrentPosition();
      if (!position.ok) {
        showToast(`${POSITION_ERROR_MESSAGES[position.reason]}近くのルームを探せません。`, { variant: 'error' });
        return;
      }

      const result = await fetchNearbyRooms(position.coordinates);
      if (!result.success) {
        showToast(result.error ?? '近くのルームの取得に失敗しました。', { variant: 'error' });
        return;
      }
      setNearbyRooms(result.data);
    } catch (error) {
      console.error('Error fetching nearby rooms:', error);
      showToast('通信エラーが発生しました。', { variant: 'error' });
    } finally {
      setSearching(false);
    }
  };

  const enterRoom = (roomId: string) => {
    setLocalRoom(roomId);
    router.push(`/room/${roomId}`);
  };

  const handleSelect = (room: NearbyRoom) => {
    // 保存済みのパスワードがあれば、遷移先の入口が静かに再検証する
    if (room.has_password && !getRoomAccessPassword(room.id)) {
      setLockedRoom(room);
      return;
    }
    enterRoom(room.id);
  };

  return (
    <>
      <div className="my-6 overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
        <button
          aria-label="近くのルームを探す"
          type="button"
          disabled={searching}
          onClick={() => void handleSearch()}
          className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left font-bold text-gray-700 transition duration-300 hover:bg-amber-100 active:scale-98 disabled:cursor-wait"
        >
          近くのルームを探す
          {searching ? <Loading className="text-amber-500" /> : <TbSearch size={20} className="text-amber-500" />}
        </button>
      </div>

      <Modal isOpen={nearbyRooms !== null} onClose={() => setNearbyRooms(null)} className="w-full !mx-1">
        <h2 className="mb-4 text-center text-xl font-semibold text-gray-700">近くのルーム</h2>
        {nearbyRooms?.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">近くに参加できるルームは見つかりませんでした。</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {nearbyRooms?.map((room) => (
              <li key={room.id} className="border-t border-gray-200 first:border-t-0">
                <button
                  type="button"
                  onClick={() => handleSelect(room)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-2 py-3 text-left hover:bg-amber-100"
                >
                  <span className="text-gray-800">
                    {room.room_name || '名前なし'}
                    <span className="ml-2 text-sm text-gray-500">ID: {room.search_code}</span>
                  </span>
                  {room.has_password && <RoomLockIcon />}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setNearbyRooms(null)}
            className="cursor-pointer text-sm font-semibold text-gray-500"
          >
            とじる
          </button>
        </div>
      </Modal>

      {lockedRoom && (
        <RoomPasswordDialog
          roomId={lockedRoom.id}
          roomName={lockedRoom.room_name}
          onVerified={() => enterRoom(lockedRoom.id)}
          onCancel={() => setLockedRoom(null)}
          onExhausted={() => {
            setLockedRoom(null);
            showToast('パスワードを3回間違えました。', { variant: 'error' });
          }}
        />
      )}
    </>
  );
}
