'use client';

import { showToast } from '@/components/common/toast';
import { motion } from 'motion/react';
import { useState } from 'react';
import { TbCheck, TbCopy } from 'react-icons/tb';

export default function RoomIdCard({ title, shortId }: { title: string; shortId: string }) {
  const [isCopy, setIsCopy] = useState(false);

  const handleIdCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortId);
      setIsCopy(true);
      setTimeout(() => {
        setIsCopy(false);
      }, 2000);
      showToast('ルームIDをコピーしました', { variant: 'success' });
    } catch {
      showToast('コピーに失敗しました', { variant: 'error' });
    }
  };

  return (
    <div id="tutorial-room-info" className="my-6 text-center">
      <h2 className="text-md text-gray-500 font-semibold mb-1">ルーム名</h2>
      <p className="text-gray-900 font-bold break-all">{title}</p>
      <div className="flex items-center justify-center gap-1">
        <p className="text-gray-900 font-bold break-all">{shortId}</p>
        <motion.button
          initial={{ scale: 1 }}
          animate={{ scale: isCopy ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={handleIdCopy}
        >{isCopy ? <TbCheck /> : <TbCopy />}
        </motion.button>
      </div>
    </div>
  );
}
