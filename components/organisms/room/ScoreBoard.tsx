'use client';

import { calculateRanks } from '@/lib/room';
import type { ScoreEntry } from '@/type/roomType';
import { motion } from 'motion/react';
import { TbCrown } from 'react-icons/tb';

export default function ScoreBoard({ scores }: { scores: ScoreEntry[] }) {
  const ranks = calculateRanks(scores);

  return (
    <section id="tutorial-room-score" className="p-4 pb-7 bg-white/70 ">
      <h2 className='text-3xl font-bold mb-4 text-center'>Score</h2>
      {scores.length === 0 ? (
        <p className='text-center text-gray-500'>まだ参加者がいません</p>
      ) : (
        <div className=''>
          {scores.map((score, index) => (
            <motion.div
              key={score.user_id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.2 }}
              className={`relative flex items-center justify-between p-2 shadow mb-2 transform skew-x-[-10deg] rounded-xl ${index === 0 || score.point === scores[0]?.point ? 'bg-yellow-400' : 'bg-yellow-400/50'}`}
            >
              {index === 0 || score.point === scores[0]?.point ? (
                <>
                  <div className='absolute top-0 left-12'>
                    <TbCrown size='1.3em' className='text-white drop-shadow-lg' />
                  </div>
                </>
              ) : (
                <></>
              )}
              <div className='w-30 flex items-center justify-center '>
                <p className='font-bold text-xl'>{ranks[index]}<span className='text-sm ml-1'>位</span></p>
              </div>
              <div className='bg-white shadow-[inset_8px_0_0_rgba(250,204,21,0.6)] p-2 px-4 w-full flex justify-between items-center rounded-sm'>
                <p className='font-bold'>{score.user?.username}</p>
                <p className='font-bold text-md text-xl'>{score.point}<span className='text-sm'>点</span></p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
