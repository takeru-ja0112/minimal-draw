'use client';

import { verifyRoomPassword } from '@/app/room/[id]/access-action';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import PasswordInput from '@/components/molecules/PasswordInput';
import Modal from '@/components/organisms/Modal';
import { saveRoomAccess } from '@/lib/roomAccessLocal';
import { roomPasswordSchema } from '@/lib/roomPassword';
import { useState } from 'react';

const MAX_ATTEMPTS = 3;

type RoomPasswordDialogProps = {
  roomId: string;
  roomName?: string | null;
  /** パスワードが正しく、入室用Cookieが発行された */
  onVerified: () => void;
  /** キャンセルされた */
  onCancel: () => void;
  /** 3回間違えた */
  onExhausted: () => void;
};

export default function RoomPasswordDialog({ roomId, roomName, onVerified, onCancel, onExhausted }: RoomPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 形式エラー(桁数不足など)は誤答として数えない
    const parsed = roomPasswordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await verifyRoomPassword(roomId, parsed.data);
      if (result.success) {
        saveRoomAccess(roomId, parsed.data);
        onVerified();
        return;
      }

      const nextAttempts = attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        onExhausted();
        return;
      }
      setAttempts(nextAttempts);
      setPassword('');
      setError(`${result.error ?? 'パスワードが違います。'}(残り${MAX_ATTEMPTS - nextAttempts}回)`);
    } catch (caught) {
      console.error('Error verify room password:', caught);
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onCancel}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <p className="mb-1 font-semibold text-gray-700">パスワードを入力してください</p>
        {roomName && <p className="mb-3 text-sm text-gray-500">{roomName}</p>}

        {/* 誤答のたびに作り直して、先頭の枠にフォーカスを戻す */}
        <PasswordInput key={attempts} value={password} onChange={setPassword} disabled={loading} hasError={!!error} autoFocus />
        <p className="mt-2 min-h-5 text-sm font-semibold text-red-500" role="alert">
          {error}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button value="キャンセル" onClick={onCancel} disabled={loading} type="button" />
          <Button value="入室" icon={loading ? <Loading /> : null} disabled={loading} type="submit" className="w-30" />
        </div>
      </form>
    </Modal>
  );
}
