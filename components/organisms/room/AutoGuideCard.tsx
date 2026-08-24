'use client';

import Human from '@/components/atoms//Human';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { motion } from 'motion/react';
import Link from 'next/link';
import { TbDice5 } from 'react-icons/tb';

export default function AutoGuideCard({ roomId, handleQuickStart }: { roomId: string, handleQuickStart: () => void }) {
    return (
        <Card id="tutorial-room-auto" className="mb-4 text-center relative">
            <div className='absolute -top-4 -left-10 bg-amber-300 py-3 px-6 rounded-full font-bold text border border-2 border-white -rotate-12'>おすすめ！</div>
            <h2 className='text-xl font-bold mt-6'>お手軽モード</h2>
            <div className='my-10 relative text-center'>
                <p className='text-center text-sm text-gray-500 font-semibold'>回答者をランダムに選び、ゲームを開始します！<br />このボタンはルーム作成者のみが押せます！</p>
            </div>

            <div className='flex items-center justify-between gap-2'>
                <Button value="お手軽スタート" icon={<TbDice5 />} onClick={handleQuickStart} className='w-full' />
            </div>
        </Card>
    );
}
