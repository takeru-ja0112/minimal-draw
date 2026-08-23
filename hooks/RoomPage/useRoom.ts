'use client';

import { getThreeThemes, registerParticipantScore, resetDrawingData, setRoomTheme, setStatusRoom } from '@/app/room/[id]/action';
import { isCheckAnswer, setdbAnswer, setdbAnswerInput, setdbAnswerResult } from '@/app/room/[id]/answer/action';
import { showToast } from '@/components/common/toast';
import type { RoomSettingType, Theme } from '@/type/roomType';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * RoomPage固有の状態管理とサーバーアクション呼び出しをまとめたフック
 */
export default function useRoom(roomId: string) {
  const router = useRouter();
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [roomSetting, setRoomSetting] = useState<RoomSettingType>({ level: 'normal', genre: 'ランダム' });
  const [threeThemes, setThreeThemes] = useState<Theme[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('drawing_app_user_id');
    const userName = localStorage.getItem('drawing_app_username');
    if (!userId || !userName) return;

    registerParticipantScore(roomId, userId, userName);
  }, [roomId]);

  const handleCheckAnswer = async () => {
    const { success, data: isAnswerer } = await isCheckAnswer(roomId);

    if (success && isAnswerer) {
      router.push(`/room/${roomId}/answer`);
    } else {
      setIsAnswerModalOpen(true);
    }
  };

  const handleSetAnswer = async () => {
    const userId = localStorage.getItem('drawing_app_user_id');
    if (!userId) return;

    const result = await setdbAnswer(roomId, userId);
    if (!result.success) {
      // console.error('Failed to set answerer:', result.error);
    }
    router.push(`/room/${roomId}/answer`);
  };

  const confirmAnswerer = () => {
    resetDrawingData(roomId);
    handleSetAnswer();
    setdbAnswerInput(roomId, '');
    setdbAnswerResult(roomId, '');
    setStatusRoom(roomId, 'DRAWING');
    setIsAnswerModalOpen(false);
  };

  const handleSearchTheme = async () => {
    const threeThemesData = await getThreeThemes({ level: roomSetting.level, genre: roomSetting.genre });
    setThreeThemes(threeThemesData.data || []);
  };

  const selectTheme = async (themeId: string, onSelected: () => void) => {
    const result = await setRoomTheme(roomId, roomSetting, themeId);
    if (!result.success) {
      console.error('Failed to set room theme:', result.error);
      showToast('お題の変更に失敗しました', { variant: 'error' });
      return;
    }
    showToast('お題を変更しました', { variant: 'success' });
    onSelected();
  };

  return {
    isAnswerModalOpen,
    setIsAnswerModalOpen,
    roomSetting,
    setRoomSetting,
    threeThemes,
    handleCheckAnswer,
    confirmAnswerer,
    handleSearchTheme,
    selectTheme,
  };
}
