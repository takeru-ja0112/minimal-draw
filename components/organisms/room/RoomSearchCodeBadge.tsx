'use client';

import { showToast } from '@/components/common/toast';
import { motion } from 'motion/react';
import { useState } from 'react';
import { TbCheck, TbCopy } from 'react-icons/tb';

/**
 * ルーム画面の右上に常時表示する、検索用ID(search_code)のバッジ。
 * ヘッダー(fixed top-2 h-14 = 下端4rem)の下に置き、タップでコピーできる。
 */
export default function RoomSearchCodeBadge({ searchCode }: { searchCode: string }) {
  const [isCopy, setIsCopy] = useState(false);

  if (!searchCode) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(searchCode);
      setIsCopy(true);
      setTimeout(() => setIsCopy(false), 2000);
      showToast('ルームIDをコピーしました', { variant: 'success' });
    } catch {
      showToast('コピーに失敗しました', { variant: 'error' });
    }
  };

  return (
    <motion.button
      id="tutorial-room-info"
      type="button"
      aria-label={`ルームID ${searchCode} をコピー`}
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      className="fixed top-[4.5rem] right-2 z-30 flex items-center gap-1.5 rounded-full border-2 border-white bg-white/70 px-3 py-1 text-sm font-bold text-gray-700 shadow-md backdrop-blur-xs"
    >
      <span className="text-xs text-gray-500">ID</span>
      <span className="tracking-widest">{searchCode}</span>
      {isCopy ? <TbCheck /> : <TbCopy />}
    </motion.button>
  );
}
