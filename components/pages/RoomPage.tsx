"use client";

import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { showToast } from '@/components/common/toast';
import TutorialHelpButton from '@/components/molecules/TutorialHelpButton';
import AnswerConfirmModal from '@/components/organisms/room/AnswerConfirmModal';
import AnswererGuideCard from '@/components/organisms/room/AnswererGuideCard';
import DrawerGuideCard from '@/components/organisms/room/DrawerGuideCard';
import GameStartedModal from '@/components/organisms/room/GameStartedModal';
import RoomIdCard from '@/components/organisms/room/RoomIdCard';
import RoomSettingModal from '@/components/organisms/room/RoomSettingModal';
import UserScoreBoard from '@/components/organisms/room/UserScoreBoard';
import StatusBar from '@/components/organisms/StatusBat';
import { useModalContext } from '@/hooks/useModalContext';
import { usePresence } from '@/hooks/usePresence';
import useStatus from '@/hooks/useStatus';
import useUserInfo from '@/hooks/useUserInfo';
import useRoom from '@/hooks/RoomPage/useRoom';
import { getOrCreateUser, getUserId } from '@/lib/user';
import type { ScoreEntry } from '@/type/roomType';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconContext } from 'react-icons';
import { TbArrowLeft, TbDice5 } from 'react-icons/tb';
import { useTutorial } from '@/hooks/tutorial/useTutorial';
import { roomTutorialSteps } from '@/hooks/tutorial/steps/room';
import Link from 'next/link';
import AutoGuideCard from '../organisms/room/AutoGuideCard';

export default function RoomPage({ title, shortId, scores, creatorId }: { title: string, shortId: string, scores: ScoreEntry[], creatorId: string }) {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { open, modalType, close } = useModalContext();
  const { status, answerId } = useStatus(roomId);
  const answerer = useUserInfo(answerId || null);
  useTutorial({ key: 'room', steps: roomTutorialSteps });

  const room = useRoom(roomId);
  const presenceUser = getOrCreateUser();
  const { users } = usePresence(roomId, presenceUser.id, presenceUser.username);
  const isGameMaster = !!creatorId && getUserId() === creatorId;
  const [gameStartedPrompt, setGameStartedPrompt] = useState<{ isAnswerer: boolean } | null>(null);

  // ステータスが既に進行中の場合（お手軽スタート直後、またはバック操作等で戻ってきた場合）は
  // 自分の役割に応じた画面へ移動するか確認するモーダルを表示する（自動遷移はしない）
  useEffect(() => {
    if (status === 'WAITING' || status === '') return;
    const myUserId = getUserId();
    const isAnswerer = !!myUserId && myUserId === answerId;
    setGameStartedPrompt({ isAnswerer });
  }, [status, answerId]);

  const handleQuickStart = () => {
    if (!isGameMaster) {
      showToast('ルーム作成者のみが始めることができます。', { variant: 'error' });
      return;
    }
    if (status !== 'WAITING' && status !== 'FINISHED') {
      showToast('すでにゲームが開始されています。', { variant: 'error' });
      return;
    }
    room.handleQuickStart(users);
  };

  const handleConfirmGameStarted = () => {
    if (!gameStartedPrompt) return;
    router.push(gameStartedPrompt.isAnswerer ? `/room/${roomId}/answer` : `/room/${roomId}/drawing`);
    setGameStartedPrompt(null);
  };

  return (
    <div>
      {/* <BgObject /> */}
      <Link href={`/`} className='z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full'>
        <TbArrowLeft size='2em' />
      </Link>
      <TutorialHelpButton
        id="tutorial-room-reset"
        tutorialKey="room"
        className="z-50 fixed bottom-4 right-3"
      />
      <div className="w-full p-8">
        <div className="max-w-lg mx-auto">
          <RoomIdCard title={title} shortId={shortId} />
          <div id="tutorial-room-status">
            <StatusBar status={status}></StatusBar>
          </div>
          {/* <Card className="mb-4 pb-1 bg-gray-100 rounded-3xl"> */}
          <AutoGuideCard roomId={roomId} handleQuickStart={handleQuickStart} />
          <div className="text-center">
            <IconContext.Provider value={{ size: '1.5em' }}>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                {/* 書く人用の説明 */}
                <DrawerGuideCard roomId={roomId} isAnswerer={!!gameStartedPrompt?.isAnswerer} />
                {/* 回答者用の説明 */}
                <AnswererGuideCard answerId={answerId} answerer={answerer} onCheckAnswer={room.handleCheckAnswer} />
              </div>
            </IconContext.Provider>
          </div>
          <Button
            onClick={() => open('roomSetting')}
            value='お題を変更する'
            className='w-full'
          />
          {/* </Card> */}
        </div>
      </div>
      <UserScoreBoard scores={scores} users={users} />
      <AnswerConfirmModal
        isOpen={room.isAnswerModalOpen}
        onClose={() => room.setIsAnswerModalOpen(false)}
        onConfirm={room.confirmAnswerer}
      />
      <GameStartedModal
        isOpen={!!gameStartedPrompt}
        isAnswerer={!!gameStartedPrompt?.isAnswerer}
        onCancel={() => setGameStartedPrompt(null)}
        onConfirm={handleConfirmGameStarted}
      />
      {modalType === 'roomSetting' && (
        <RoomSettingModal
          isOpen
          onClose={close}
          setRoomSetting={room.setRoomSetting}
          threeThemes={room.threeThemes}
          onSearchTheme={room.handleSearchTheme}
          onSelectTheme={(themeId) => room.selectTheme(themeId, close)}
        />
      )}
    </div>
  );
}
