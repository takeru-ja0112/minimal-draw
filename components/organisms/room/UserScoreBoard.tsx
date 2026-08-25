'use client';

import UserIcon from '@/components/atoms/UserIcon';
import { buildScoreBoardEntries, calculateRanks } from '@/lib/room';
import { DEFAULT_ICON_COLOR, DEFAULT_ICON_NAME } from '@/utils/Icons';
import type { PresenceUser } from '@/hooks/usePresence';
import type { ScoreEntry } from '@/type/roomType';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { TbCrown } from 'react-icons/tb';

export default function UserScoreBoard({ scores, users }: { scores: ScoreEntry[]; users: PresenceUser[] }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const entries = buildScoreBoardEntries(scores, users);
  const ranks = calculateRanks(entries);

  return (
    <section id="tutorial-room-score" className="p-4 pb-2 bg-white/70">
      <h2 className='text-sm font-bold mb-4 text-center'>参加者</h2>
      {entries.length === 0 ? (
        <p className='text-center text-gray-500'>まだ参加者がいません</p>
      ) : (
        <div className='flex items-end overflow-x-auto gap-3 pb-2 h-20'>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.1 }}
              animate={{ opacity: entry.isOnline ? 1 : 0.4 }}
              className='relative flex items-center gap-1 shrink-0'
            >
              <button
                type='button'
                onClick={() => setOpenUserId(openUserId === entry.user_id ? null : entry.user_id)}
                className='relative w-15 h-15 shrink-0 rounded-full border border-2 border-gray-300 bg-white flex items-center justify-center font-bold shadow'
              >
                {ranks[index] === 1 && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                    <TbCrown size='1.1em' className='text-gray-500 drop-shadow-lg' />
                  </div>
                )}
                <UserIcon
                  iconName={entry.iconName ?? DEFAULT_ICON_NAME}
                  iconColor={entry.iconColor ?? DEFAULT_ICON_COLOR}
                  size={32}
                />
              </button>
              <AnimatePresence>
                {openUserId === entry.user_id && (
                  <motion.span
                    initial={{ opacity: 0, width: 'auto' }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 'auto' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className='z-10 absolute -top-4 left-2/3 -translate-x-1/2 text-xs font-bold whitespace-nowrap bg-white px-2 py-1 rounded-full shadow overflow-hidden'
                  >
                    {entry.username}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className='bg-white px-3 py-1.5 rounded-full font-bold whitespace-nowrap'>
                {entry.point}<span className='text-sm ml-0.5'>点</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
