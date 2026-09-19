'use client';

import SearchRoomModal from '@/components/organisms/lobby/SearchRoomModal';
import { useState } from 'react';
import { TbHash } from 'react-icons/tb';

type RoomIdSearchSectionProps = {
  user: string;
  setNameError: React.Dispatch<React.SetStateAction<string>>;
};

export default function RoomIdSearchSection({ user, setNameError }: RoomIdSearchSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (!user) {
      setNameError('ルームに参加するにはユーザー名が必要です。');
      return;
    }
    setNameError('');
    setIsOpen(true);
  };

  return (
    <>
      <div className="my-6 overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
        <button
          aria-label="IDでルームを探す"
          type="button"
          onClick={handleOpen}
          className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left font-bold text-gray-700 transition duration-300 hover:bg-amber-100 active:scale-98"
        >
          IDでルームを探す
          <TbHash size={20} className="text-amber-500" />
        </button>
      </div>

      {/* 開くたびに入力内容とエラーを初期化するため、閉じている間はマウントしない */}
      {isOpen && <SearchRoomModal isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  );
}
