"use client";

import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import TutorialHelpButton from '@/components/molecules/TutorialHelpButton';
import AnswerConfirmModal from '@/components/organisms/room/AnswerConfirmModal';
import AnswererGuideCard from '@/components/organisms/room/AnswererGuideCard';
import DrawerGuideCard from '@/components/organisms/room/DrawerGuideCard';
import RoomIdCard from '@/components/organisms/room/RoomIdCard';
import RoomSettingModal from '@/components/organisms/room/RoomSettingModal';
import ScoreBoard from '@/components/organisms/room/ScoreBoard';
import StatusBar from '@/components/organisms/StatusBat';
import { useModalContext } from '@/hooks/useModalContext';
import useStatus from '@/hooks/useStatus';
import useRoom from '@/hooks/RoomPage/useRoom';
import type { ScoreEntry } from '@/type/roomType';
import { useParams } from 'next/navigation';
import { IconContext } from 'react-icons';
import { TbArrowLeft } from 'react-icons/tb';
import AccessUser from '../organisms/AccessUser';
import { useTutorial } from '@/hooks/tutorial/useTutorial';
import { roomTutorialSteps } from '@/hooks/tutorial/steps/room';
import Link from 'next/link';

export default function RoomPage({ title, shortId, scores }: { title: string, shortId: string, scores: ScoreEntry[] }) {
  const params = useParams();
  const roomId = params.id as string;
  const { open, modalType, close } = useModalContext();
  const { status, answerId } = useStatus(roomId);
  useTutorial({ key: 'room', steps: roomTutorialSteps });

  const room = useRoom(roomId);

  return (
    <div>
      {/* <BgObject /> */}
      <Link href={`/`} className='z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full'>
        <TbArrowLeft size='2em' />
      </Link>
      <TutorialHelpButton
        id="tutorial-room-reset"
        tutorialKey="room"
        className="z-50 fixed top-24 left-3"
      />
      <div className="w-full p-8">
        <div className="max-w-lg mx-auto">
          <RoomIdCard title={title} shortId={shortId} />
          <div id="tutorial-room-status">
            <StatusBar status={status}></StatusBar>
          </div>
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
                <DrawerGuideCard roomId={roomId} />
                {/* 回答者用の説明 */}
                <AnswererGuideCard answerId={answerId} onCheckAnswer={room.handleCheckAnswer} />
              </IconContext.Provider>
            </div>
          </Card>
        </div>
      </div>
      <ScoreBoard scores={scores} />
      <AnswerConfirmModal
        isOpen={room.isAnswerModalOpen}
        onClose={() => room.setIsAnswerModalOpen(false)}
        onConfirm={room.confirmAnswerer}
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
