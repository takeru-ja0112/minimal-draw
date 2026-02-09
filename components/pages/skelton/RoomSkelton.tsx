import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Human from '@/components/atoms/Human';
import Link from 'next/link';
import { TbArrowLeft, TbBallBowling, TbPencil } from 'react-icons/tb';

export default function Loading() {
  return (
    <div className="w-full p-8">
      <Link href={`/lobby`} className='z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full'>
        <TbArrowLeft size='2em' />
      </Link>
      <div className="max-w-lg mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-md text-gray-500 font-semibold mb-1">ルーム名</h2>
          <div className="bg-gray-300 w-32 h-6 mx-auto rounded animate-pulse" />
          <div className="bg-gray-300 w-24 h-5 mx-auto rounded mt-2 animate-pulse" />
        </div>
        <div className='w-full h-10 bg-gray-300 rounded-full animate-pulse mb-3'></div>
        <Card className="mb-4 pb-1 bg-gray-100 rounded-3xl">
          <Button
            value='お題を変更する'
            className='mb-4 w-full'
          />
          <div className="text-center">
            {/* 書く人用の説明 */}
            <Card className="mb-4">
              <div className='my-5 h-20 grid grid-cols-3 gap-0 relative'>
                <Human colorClass='bg-yellow-400/50' className='left-1/2' />
                <Human colorClass='bg-yellow-400/50' className='' />
                <Human colorClass='bg-yellow-400/50' className='-left-1/2' />
              </div>

              <div className='flex items-center justify-between gap-2'>
                <div>
                  <p className='text-xs text-left text-gray-500 font-semibold'>描く人</p>
                  <p className='font-bold text-lg'><span className=''>1</span>人以上</p>
                </div>
                <Button value="お題を描く" icon={<TbPencil />} />
              </div>
            </Card>

            {/* 回答者用の説明 */}
            <Card className="mb-4">
              <div
                className={`absolute right-3 px-4 py-2 rounded-full font-bold text-sm font-bold
                                        bg-gray-200 text-gray-600`}
              >
                未決定
              </div>
              <div className='mt-2  h-25 relative'>
                <Human
                  colorClass={'bg-yellow-400/70'}
                  className='top-0' />
              </div>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <p className='text-xs text-left text-gray-500 font-semibold'>回答者</p>
                  <p className='font-bold text-lg'><span className=''>1</span>人まで </p>
                </div>
                <Button value="回答ページへ" icon={<TbBallBowling />} />
              </div>
            </Card>
          </div>
        </Card>

        <section className="p-4 pb-7 bg-white/70 ">
          <h2 className='text-3xl font-bold mb-4 text-center'>Score</h2>
          <div className=''>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className='relative flex items-center justify-between p-2 shadow mb-2 transform skew-x-[-10deg] rounded-xl bg-yellow-400/50'>
                <div className='w-30 flex items-center justify-center '>
                  <div className='h-5 w-8 bg-yellow-200/80 rounded animate-pulse' />
                </div>
                <div className='bg-white shadow-[inset_8px_0_8px_rgba(250,204,21,0.4)] p-2 px-4 w-full flex justify-between items-center rounded-sm'>
                  <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
                  <div className='h-4 w-12 bg-gray-200 rounded animate-pulse' />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}