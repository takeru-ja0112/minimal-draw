'use client';

import Human from '@/components/atoms//Human';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { motion } from 'motion/react';
import Link from 'next/link';
import { TbPencil } from 'react-icons/tb';

export default function DrawerGuideCard({ roomId, isAnswerer }: { roomId: string, isAnswerer: boolean }) {

  return (
    <Card id="tutorial-room-draw" className="mb-4">
      <h2 className='text-sm font-bold truncate max-w-[8rem]'><span className='text-amber-600'>描く人</span>はこちら</h2>
      <div className='my-5 w-fit mx-auto flex text-center gap-0 relative'>
        <TbPencil size='3rem' className='text-center text-gray-500' />
      </div>

      <div className='flex flex-col items-center justify-between gap-2'>
        <div>
          <p className='text-xs text-left text-gray-500 font-semibold'>描く人</p>
          <p className='font-bold text-lg'><span className=''>1</span>人以上</p>
        </div>
        {isAnswerer ? (
          <p className='text-xs text-left text-gray-500 font-semibold'>回答者がお題を描きます。</p>
        ) : (
          <Link href={`/room/${roomId}/drawing`}>
            <Button value="お題を描く" />
          </Link>
        )}
      </div>
    </Card>
  );
}
