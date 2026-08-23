'use client';

import Human from '@/components/atoms//Human';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { motion } from 'motion/react';
import Link from 'next/link';
import { TbPencil } from 'react-icons/tb';

export default function DrawerGuideCard({ roomId }: { roomId: string }) {
  return (
    <Card id="tutorial-room-draw" className="mb-4">
      <h2 className='text-lg font-bold'>お題を<span className='text-amber-600'>描く人</span>はこちら</h2>
      <div className='my-5 h-20 grid grid-cols-3 gap-0 relative'>
        <motion.div
          animate={{ scaleY: [0.9, 1] }}
          transition={{ duration: 1, repeatType: "reverse", type: 'spring', bounce: 0.5, repeat: Infinity, ease: "easeOut" }}
        >
          <Human colorClass='bg-yellow-400' className='left-1/2' />
        </motion.div>
        <motion.div
          animate={{ scaleY: [0.9, 1] }}
          transition={{ delay: 0.2, duration: 1, repeatType: "reverse", type: 'spring', bounce: 0.5, repeat: Infinity, ease: "easeOut" }}
        >
          <Human colorClass='bg-yellow-400/70' className='' />
        </motion.div>
        <motion.div
          animate={{ scaleY: [0.9, 1] }}
          transition={{ delay: 0.4, duration: 1, repeatType: "reverse", type: 'spring', bounce: 0.5, repeat: Infinity, ease: "easeOut" }}
        >
          <Human colorClass='bg-yellow-400/50' className='-left-1/2' />
        </motion.div>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <div>
          <p className='text-xs text-left text-gray-500 font-semibold'>描く人</p>
          <p className='font-bold text-lg'><span className=''>1</span>人以上</p>
        </div>
        <Link href={`/room/${roomId}/drawing`}>
          <Button value="お題を描く" icon={<TbPencil />} />
        </Link>
      </div>
    </Card>
  );
}
