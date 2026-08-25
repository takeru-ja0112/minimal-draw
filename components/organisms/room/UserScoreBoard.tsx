'use client';

import { buildScoreBoardEntries, calculateRanks } from '@/lib/room';
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
    <section id="tutorial-room-score" className="p-4 pb-7 bg-white/70">
      <h2 className='text-3xl font-bold mb-4 text-center'>Score</h2>
      {entries.length === 0 ? (
        <p className='text-center text-gray-500'>まだ参加者がいません</p>
      ) : (
        <div className='flex items-center gap-3 overflow-x-auto pb-2'>
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
                className='relative w-11 h-11 shrink-0 rounded-full bg-yellow-400 flex items-center justify-center font-bold shadow'
              >
                {ranks[index] === 1 && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                    <TbCrown size='1.1em' className='text-yellow-500 drop-shadow-lg' />
                  </div>
                )}
                {entry.username.charAt(0)}
              </button>
              <AnimatePresence>
                {openUserId === entry.user_id && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className='text-xs font-bold whitespace-nowrap bg-white px-2 py-1 rounded-full shadow overflow-hidden'
                  >
                    {entry.username}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className='bg-white shadow-[inset_4px_0_0_rgba(250,204,21,0.6)] px-3 py-1.5 rounded-full font-bold text-sm whitespace-nowrap'>
                {entry.point}<span className='text-[10px] ml-0.5'>点</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
