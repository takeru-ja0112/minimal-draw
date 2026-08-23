'use client';

import Human from '@/components/atoms//Human';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import UserIcon from '@/components/atoms/UserIcon';
import type { UserInfoData } from '@/hooks/useUserInfo';
import { motion } from 'motion/react';
import { TbBallBowling } from 'react-icons/tb';

export default function AnswererGuideCard({
  answerId,
  answerer,
  onCheckAnswer,
}: {
  answerId: string;
  answerer: UserInfoData | null;
  onCheckAnswer: () => void;
}) {
  return (
    <Card id="tutorial-room-answer" className="mb-4 perspective-1000">
      <h2 className='text-lg font-bold'><span className='text-amber-600'>答える人</span>はこちら</h2>
      <motion.div
        className={`absolute right-3 px-3 py-2 rounded-full font-bold text-sm flex items-center gap-1 max-w-32
                            ${answerId ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'}`}
      >
        {answerId ? (
          <>
            <UserIcon iconName={answerer?.icon_name} iconColor={answerer?.icon_color} size={16} />
            <span className='truncate'>{answerer?.username || '決定済'}</span>
          </>
        ) : (
          '未決定'
        )}
      </motion.div>
      <div className='mt-5  h-25 relative'>
        <motion.div
          animate={{ scaleY: [0.9, 1] }}
          transition={{ duration: 1, repeatType: "reverse", type: 'spring', bounce: 0.5, repeat: Infinity, ease: "easeOut" }}
        >
          <Human
            colorClass={answerId ? 'bg-yellow-400' : 'bg-yellow-400/70'}
            className='top-0' />
        </motion.div>
      </div>
      <div className='flex flex-col items-center justify-between gap-2'>
        <div>
          <p className='text-xs text-left text-gray-500 font-semibold'>回答者</p>
          <p className='font-bold text-lg'><span className=''>1</span>人まで </p>
        </div>
        <Button value="回答ページへ" icon={<TbBallBowling />} onClick={onCheckAnswer} />
      </div>
    </Card>
  );
}
