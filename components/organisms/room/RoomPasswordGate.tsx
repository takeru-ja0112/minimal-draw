'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import { verifyRoomPassword } from '@/app/room/[id]/action';

export default function RoomPasswordGate({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!/^\d{4}$/.test(password)) {
      setError('パスワードは数字4桁で入力してください。');
      return;
    }

    setLoading(true);
    setError('');
    const result = await verifyRoomPassword(roomId, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'パスワードが正しくありません。');
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-lg font-semibold text-gray-700 text-center mb-2">
          このルームには入室パスワードが設定されています
        </h1>
        <p className="text-sm text-gray-500 text-center mb-4">数字4桁を入力してください</p>
        <Input
          name="roomPassword"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setPassword(e.target.value.replace(/\D/g, '').slice(0, 4));
            setError('');
          }}
          placeholder="0000"
          className={`w-full text-center tracking-[0.5em] ${error ? 'border-red-500 border-2' : ''}`}
        />
        {error && <p className="text-red-500 font-semibold text-sm mt-2 text-center">{error}</p>}
        <div className="mt-6 flex justify-center">
          <Button
            value="入室する"
            icon={loading ? <Loading /> : null}
            onClick={handleSubmit}
            disabled={loading || password.length !== 4}
            className="w-40"
          />
        </div>
      </div>
    </div>
  );
}
