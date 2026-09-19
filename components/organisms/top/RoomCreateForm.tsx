'use client';

import { createRoomByUsername } from '@/app/lobby/action';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Loading from '@/components/atoms/Loading';
import { showToast } from '@/components/common/toast';
import RoomSetting from '@/components/organisms/RoomSetting';
import NearbyShareCheckbox from '@/components/organisms/top/NearbyShareCheckbox';
import RoomPasswordField from '@/components/organisms/top/RoomPasswordField';
import { POSITION_ERROR_MESSAGES, requestCurrentPosition } from '@/lib/currentPosition';
import historyLocalRoom from '@/lib/hitoryLocalRoom';
import { setRoomSchema } from '@/lib/room';
import { saveRoomAccess } from '@/lib/roomAccessLocal';
import { getRoomPasswordError } from '@/lib/roomPassword';
import type { CreateRoom, RoomSettingType } from '@/type/roomType';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RoomCreateFormProps = {
  user: string;
  userId: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
};

export default function RoomCreateForm({ user, userId, setNameError, onClose }: RoomCreateFormProps) {
  const router = useRouter();
  const { setLocalRoom } = historyLocalRoom();
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState(`${user}のアトリエ`);
  const [roomError, setRoomError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shareNearby, setShareNearby] = useState(false);
  const [settingData, setSettingData] = useState<RoomSettingType>({
    level: 'normal',
    genre: 'ランダム',
  });
  const [createRoomData, setCreateRoomData] = useState<CreateRoom>({
    level: 'normal',
    genre: 'ランダム',
    userId,
    username: user,
    roomName,
  });

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // エラー表示中は、入力を直すと同時にエラーも消えるよう再検証する
    if (passwordError) setPasswordError(getRoomPasswordError(value) ?? '');
  };

  // 取得できなくてもルーム作成は続行し、近くの検索に出ない旨だけ知らせる
  const resolveShareLocation = async () => {
    const position = await requestCurrentPosition();
    if (position.ok) return position.coordinates;

    showToast(`${POSITION_ERROR_MESSAGES[position.reason]}近くのルーム検索には表示されません。`, { variant: 'info' });
    return undefined;
  };

  const handleCreateRoom = async () => {
    setNameError('');
    setRoomError('');

    if (!user) {
      setNameError('ルームを作成するにはユーザー名が必要です。');
      return;
    }

    const result = setRoomSchema({
      roomName,
      setRoomError,
      setCreateRoomData,
    });

    const passwordValidationError = getRoomPasswordError(password);
    setPasswordError(passwordValidationError ?? '');

    if (!result?.success || passwordValidationError) {
      return;
    }

    setLoading(true);
    try {
      const location = shareNearby ? await resolveShareLocation() : undefined;

      const res = await createRoomByUsername({
        ...createRoomData,
        username: user,
        userId,
        roomName,
        level: settingData.level,
        genre: settingData.genre,
        password: password || undefined,
        location,
      });

      if (res.success && res.data) {
        const roomId = res.data.id;
        if (password) saveRoomAccess(roomId, password);
        setLocalRoom(roomId);
        onClose();
        router.push(`/room/${roomId}`);
        return;
      }

      console.error('Failed to create room:', res.error);
      setRoomError('ルームの作成に失敗しました。');
    } catch (error) {
      console.error('Error create room:', error);
      setRoomError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreateRoom();
      }}
    >
      <div className="mb-2">
        <label htmlFor="roomName" className="text-sm font-semibold text-gray-700">
          ルーム名
        </label>
      </div>
      <div className="my-2">
        <Input
          name="roomName"
          value={roomName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setRoomName(event.target.value);
            setRoomSchema({
              roomName: event.target.value,
              setRoomError,
              setCreateRoomData,
            });
          }}
          onBlur={() => {
            if (!roomName) {
              setRoomError('ルーム名は必須です。');
            }
          }}
          placeholder="ルーム名を入力してください"
          className={`w-full ${roomError ? 'border-2 border-red-500' : ''}`}
        />
      </div>

      {roomError && (
        <p className="mb-2 text-sm font-semibold text-red-500" role="alert">
          {roomError}
        </p>
      )}

      <RoomSetting<RoomSettingType> className="mt-4" setRoomData={setSettingData} />

      <RoomPasswordField value={password} onChange={handlePasswordChange} error={passwordError} disabled={loading} />
      <NearbyShareCheckbox checked={shareNearby} onChange={setShareNearby} disabled={loading} />

      <div className="mt-6 flex justify-end gap-2">
        <Button value="キャンセル" onClick={onClose} disabled={loading} type="button" />
        <Button value="作成" icon={loading ? <Loading /> : null} disabled={loading} type="submit" className="w-30" />
      </div>
    </form>
  );
}
