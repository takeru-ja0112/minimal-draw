"use client";

import { getThreeThemes, registerParticipantScore, resetDrawingData, setRoomTheme, setStatusRoom } from '@/app/room/[id]/action';
import { isCheckAnswer, setdbAnswer, setdbAnswerInput, setdbAnswerResult } from '@/app/room/[id]/answer/action';
import Human from '@/components/atoms//Human';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { showToast } from '@/components/common/toast';
import Modal from '@/components/organisms/Modal';
import StatusBar from '@/components/organisms/StatusBat';
import { useModalContext } from '@/hooks/useModalContext';
import useStatus from '@/hooks/useStatus';
import type { RoomSettingType, Theme } from '@/type/roomType';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconContext } from 'react-icons';
import { TbArrowLeft, TbBallBowling, TbCheck, TbCopy, TbCrown, TbPencil } from 'react-icons/tb';
import AccessUser from '../organisms/AccessUser';
import RoomSetting from '../organisms/RoomSetting';

export default function RoomPage({ title, shortId, scores }: { title: string, shortId: string, scores: any[] }) {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [roomSetting, setRoomSetting] = useState<RoomSettingType>({ level: "normal", genre: "ランダム" });
  const { open, modalType, close } = useModalContext();
  const [isCopy, setIsCopy] = useState(false);
  const [threeThemes, setThreeThemes] = useState<Theme[]>([]);

  const { status, answerId } = useStatus(roomId);

  const handleCheckAnswer = async () => {
    const { success, data: isAnswerer } = await isCheckAnswer(roomId);

    if (success && isAnswerer) {
      router.push(`/room/${roomId}/answer`);
    } else {
      setIsAnswerModalOpen(true);
    }
  }
  const handleSetAnswer = async () => {
    const userId = localStorage.getItem('drawing_app_user_id');
    if (!userId) return;
    // 回答者として登録

    const result = await setdbAnswer(roomId, userId); // 'current-user-id'は実際のユーザーIDに置き換えてください
    if (!result.success) {
      // console.error('Failed to set answerer:', result.error);
    }
    router.push(`/room/${roomId}/answer`);
  }

  const handleChangeRoomTheme = async () => {
    const threeThemesData = await getThreeThemes({ level: roomSetting.level, genre: roomSetting.genre });
    setThreeThemes(threeThemesData.data || []);
  }

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
  }

  useEffect(() => {
    const userId = localStorage.getItem('drawing_app_user_id');
    const userName = localStorage.getItem('drawing_app_username');
    if (!userId || !userName) return;

    registerParticipantScore(roomId, userId, userName);
  }, [roomId]);

  const ranks = scores.reduce<number[]>((acc, score, index) => {
    if (index === 0) {
      acc.push(1);
      return acc;
    }

    const prevScore = scores[index - 1];
    if (prevScore && prevScore.point === score.point) {
      acc.push(acc[index - 1]);
      return acc;
    }

    acc.push(acc[index - 1] + 1);
    return acc;
  }, []);

  return (
    <div>
      {/* <BgObject /> */}
      <Link href={`/lobby`} className='z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full'>
        <TbArrowLeft size='2em' />
      </Link>
      <div className="w-full p-8">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-md text-gray-500 font-semibold mb-1">ルーム名</h2>
            <p className="text-gray-900 font-bold break-all">{title}</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-gray-900 font-bold break-all">{shortId}</p>
              <motion.button
                initial={{ scale: 1 }}
                animate={{ scale: isCopy ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={handleIdCopy}
              >{isCopy ? <TbCheck /> : <TbCopy />}
              </motion.button>
            </div>
          </div>
          <StatusBar status={status}></StatusBar>
          <AccessUser roomId={roomId} />
          <Card className="mb-4 pb-1 bg-gray-100 rounded-3xl">
            <Button
              onClick={() => open('roomSetting')}
              value='お題を変更する'
              className='mb-4 w-full'
            />
            <div className="text-center">
              <IconContext.Provider value={{ size: '1.5em' }}>
                {/* 書く人用の説明 */}
                <Card className="mb-4">
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

                {/* 回答者用の説明 */}
                <Card className="mb-4 perspective-1000">
                  <h2 className='text-lg font-bold'>お題を<span className='text-amber-600'>答える人</span>はこちら</h2>
                  <motion.div
                    className={`absolute right-3 px-4 py-2 rounded-full font-bold text-sm font-bold
                                        ${answerId ? 'bg-green-200 text-green-600' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {answerId ? '決定済' : '未決定'}
                  </motion.div>
                  <div className='mt-2  h-25 relative'>
                    <motion.div
                      animate={{ scaleY: [0.9, 1] }}
                      transition={{ duration: 1, repeatType: "reverse", type: 'spring', bounce: 0.5, repeat: Infinity, ease: "easeOut" }}
                    >
                      <Human
                        colorClass={answerId ? 'bg-yellow-400' : 'bg-yellow-400/70'}
                        className='top-0' />
                    </motion.div>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <div>
                      <p className='text-xs text-left text-gray-500 font-semibold'>回答者</p>
                      <p className='font-bold text-lg'><span className=''>1</span>人まで </p>
                    </div>
                    <Button value="回答ページへ" icon={<TbBallBowling />} onClick={handleCheckAnswer} />
                  </div>
                </Card>
              </IconContext.Provider>
            </div>
          </Card>
        </div>
      </div>
      <section className="p-4 pb-7 bg-white/70 ">
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
                  <p className='font-bold'>{score.user_name}</p>
                  <p className='font-bold text-md text-xl'>{score.point}<span className='text-sm'>点</span></p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      {isAnswerModalOpen && <Modal
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
      >
        <div className="p-4 text-center">
          <h2 className="text-2xl font-bold text-gray-500 mb-4">確認</h2>
          <p className="mb-4 font-bold">
            まだAnswerが決まっていません<br />
            あなたがAnswerになりますか？
          </p>
          <Button value="いいえ" onClick={() => setIsAnswerModalOpen(false)} />
          <Button value="はい" onClick={() => {
            resetDrawingData(roomId);
            handleSetAnswer();
            setdbAnswerInput(roomId, '');
            setdbAnswerResult(roomId, '');
            setStatusRoom(roomId, 'DRAWING');
            setIsAnswerModalOpen(false);
          }}
            className="ml-4" />
        </div>
      </Modal>
      }
      {modalType === 'roomSetting' && (
        <Modal isOpen={true} onClose={close} className='w-full'>
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4 text-center">ルーム設定</h2>
            {threeThemes.length > 0 && (
              <div className='mt-6 rounded-lg'>
                <h3 className='text-lg font-bold mb-2 text-gray-700'>お題候補</h3>
                <p className='text-sm text-gray-500 mb-2'>以下の候補からお題を選んでください</p>
                {threeThemes.map((theme) => (
                  <motion.button
                    initial={{ x: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 * threeThemes.findIndex(t => t.id === theme.id) }}
                    animate={{ x: 0, opacity: 1 }}
                    key={theme.id}
                    className='w-full bg-amber-400 rounded-full font-bold p-2 pl-4 mb-2 flex items-center justify-center gap-2'
                    onClick={async () => {
                      const result = await setRoomTheme(roomId, roomSetting, theme.id);
                      if (!result.success) {
                        console.error('Failed to set room theme:', result.error);
                        showToast('お題の変更に失敗しました', { variant: 'error' });
                        return;
                      }
                      showToast('お題を変更しました', { variant: 'success' });
                      close();
                    }}
                  >
                    <span>{theme.theme}</span>
                  </motion.button>
                ))}
              </div>
            )}
            <RoomSetting setRoomData={setRoomSetting} />
            <div className='grid grid-cols-2 gap-3 mt-2'>
              <Button
                onClick={() => {
                  close();
                }}
                value="閉じる"
                className="w-full mt-4"
              />
              <Button
                onClick={handleChangeRoomTheme}
                value="お題を選ぶ"
                className="w-full mt-4"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
