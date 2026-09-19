'use server';

import { ensureUser } from '@/app/user/action';
import { prisma } from '@/lib/prisma';
import { requireRoomAccess } from '@/lib/server/roomAccess';
import type { RoomSettingType, Theme } from '@/type/roomType';

/**  ルームのステータスを変更
 *
 *  @param roomId ルームID
 *  @param status 'WATING' | 'DRAWING' | 'ANSWERING' | 'FINISHED' | 'RESETTING'
 */
export async function setStatusRoom(
  roomId: string,
  status: 'WATING' | 'DRAWING' | 'ANSWERING' | 'FINISHED' | 'RESETTING',
) {
  await requireRoomAccess(roomId);
  try {
    const data = await prisma.room.update({
      where: { id: roomId },
      data: {
        status,
        ...(status === 'DRAWING' ? { current_drawing_index: 0 } : {}),
      },
    });

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to update room status', data: null };
  }
}

// ルームのを情報を取得
export async function getInfoRoom(roomId: string) {
  await requireRoomAccess(roomId);
  try {
    const data = await prisma.room.findUnique({ where: { id: roomId } });

    if (!data) {
      return { success: false, error: 'Failed to fetch room status', data: null };
    }

    return { success: true, error: null, data: data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch room status', data: null };
  }
}

async function getRandomTheme(roomId?: string) {
  if (roomId) {
    const roomInfoResult = await getInfoRoom(roomId);
    if (roomInfoResult.success && roomInfoResult.data) {
      const roomInfo = roomInfoResult.data;
      if (roomInfo.level === null || roomInfo.genre === null) {
        return { success: false, error: 'No themes found for the specified settings', data: null };
      }
      try {
        const data = await prisma.theme.findMany({
          where: {
            level: roomInfo.level,
            genre: roomInfo.genre,
          },
          select: { id: true, theme: true },
        });

        if (!data || data.length === 0) {
          return { success: false, error: 'No themes found for the specified settings', data: null };
        }

        const randomTheme = data[Math.floor(Math.random() * data.length)];
        return { success: true, error: null, data: randomTheme };
      } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'Failed to fetch random theme', data: null };
      }
    }
  }

  // ルームIDが提供されていない場合、またはルーム情報の取得に失敗した場合は全体からランダムに取得

  try {
    const data = await prisma.theme.findMany({ select: { id: true, theme: true } });

    if (!data) {
      return { success: false, error: 'null', data: null };
    }
    const randomTheme = data[Math.floor(Math.random() * data.length)];
    return { success: true, error: null, data: randomTheme };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch random theme', data: null };
  }
}

/**
 * ルーム設定をリセットして初期状態に戻す
 * その際にお題を再取得する
 */
export async function resetRoomSettings(roomId: string) {
  await requireRoomAccess(roomId);
  const themeResult = await getRandomTheme(roomId);
  const newTheme = themeResult.success && themeResult.data ? themeResult.data : null;

  try {
    await prisma.drawing.deleteMany({ where: { room_id: roomId } });
  } catch (error) {
    console.error('Unexpected error during drawing clearance:', error);
    return { success: false, error: 'Failed to clear drawings during reset', data: null };
  }

  try {
    const data = await prisma.room.update({
      where: { id: roomId },
      data: {
        answer_id: null,
        status: 'WAITING',
        current_drawing_index: 0,
        current_theme: newTheme?.theme || null,
        current_theme_id: newTheme?.id || null,
      },
    });

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to reset room settings', data: null };
  }
}

/**
 * ルームの回答者をリセットする関数
 *
 * ゲームが終了した際に他の回答を確認するために回答者権限をリセットする
 *
 * @param roomId
 * @returns
 */
export async function resetRoomAnswer(roomId: string) {
  await requireRoomAccess(roomId);
  try {
    const data = await prisma.room.update({
      where: { id: roomId },
      data: { answer_id: null, status: 'FINISHED' },
    });

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to reset room answerer', data: null };
  }
}

/**
 * ルームのお題を変更する関数
 *
 * @param roomId
 * @param roomSetting
 * @returns
 */
export async function changeRoomTheme(
  roomIdOrParams: string | { roomId: string; roomSetting: RoomSettingType },
  roomSettingParam?: RoomSettingType,
) {
  const roomId = typeof roomIdOrParams === 'object' ? roomIdOrParams.roomId : roomIdOrParams;
  await requireRoomAccess(roomId);
  const roomSetting = typeof roomIdOrParams === 'object' ? roomIdOrParams.roomSetting : roomSettingParam;

  if (!roomSetting) {
    return { success: false, error: 'roomSetting is required', data: null };
  }
  let data;
  try {
    data = await prisma.theme.findMany({
      where: { level: roomSetting.level, genre: roomSetting.genre },
      select: { id: true, theme: true },
    });
  } catch (error) {
    console.error('Failed to fetch themes for change:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error), data: null };
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'No themes found for the specified settings', data: null };
  }

  const randomTheme = data[Math.floor(Math.random() * data.length)];

  try {
    const updateData = await prisma.room.update({
      where: { id: roomId },
      data: {
        current_theme: randomTheme.theme,
        current_theme_id: randomTheme.id,
        level: roomSetting.level,
        genre: roomSetting.genre,
      },
    });

    return { success: true, error: null, data: updateData };
  } catch (error) {
    console.error('Unexpected error during theme change:', error);
    return { success: false, error: 'Failed to change room theme', data: null };
  }
}

/**
 * 指定のお題をルームに設定する関数
 */
export async function setRoomTheme(roomId: string, roomSetting: RoomSettingType, themeId: string) {
  await requireRoomAccess(roomId);
  try {
    const themeData = await prisma.theme.findUnique({
      where: { id: Number(themeId) },
      select: { id: true, theme: true },
    });

    if (!themeData) {
      return { success: false, error: 'Theme not found', data: null };
    }

    const updateData = await prisma.room.update({
      where: { id: roomId },
      data: {
        current_theme: themeData.theme,
        current_theme_id: themeData.id,
        level: roomSetting.level,
        genre: roomSetting.genre,
      },
    });

    return { success: true, error: null, data: updateData };
  } catch (error) {
    console.error('Unexpected error during theme setting:', error);
    return { success: false, error: 'Failed to set room theme', data: null };
  }
}

const shuffle = (array: Theme[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 0からiの範囲でランダムな索引を選択
    [array[i], array[j]] = [array[j], array[i]]; // 要素を入れ替え
  }
  return array;
};

/**
 * お題を３個取得する関数
 */
export async function getThreeThemes({ level, genre }: { level: string; genre: string }) {
  try {
    const data = await prisma.theme.findMany({
      where: { level, genre },
      select: { id: true, theme: true },
    });

    const shuffledData = shuffle(data.map((t) => ({ id: String(t.id), theme: t.theme })));

    const threeThemes = shuffledData.slice(0, 3);

    return { success: true, error: null, data: threeThemes };
  } catch (error) {
    console.error('Unexpected error during fetching three themes:', error);
    return { success: false, error: 'Failed to fetch three themes', data: null };
  }
}

/**
 * 描画データをリセットする関数
 */
export async function resetDrawingData(roomId: string) {
  await requireRoomAccess(roomId);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.drawing.deleteMany({ where: { room_id: roomId } });
      await tx.room.update({
        where: { id: roomId },
        data: { current_drawing_index: 0 },
      });
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error during drawing data reset:', error);
    return { success: false, error: 'Failed to reset drawing data' };
  }
}

/**
 * お手軽スタート: ランダムに決定した回答者IDでゲームを開始する
 *
 * answer_id・statusの更新と、前回分の描画・回答データのクリアを1つのトランザクションで行う
 */
export async function startQuickGame(roomId: string, answererId: string, roomSetting?: RoomSettingType) {
  await requireRoomAccess(roomId);
  try {
    await ensureUser(answererId);

    if (roomSetting) {
      await changeRoomTheme(roomId, roomSetting);
    }

    const data = await prisma.$transaction(async (tx) => {
      await tx.drawing.deleteMany({ where: { room_id: roomId } });
      await tx.answerInput.upsert({
        where: { room_id: roomId },
        create: { room_id: roomId, text: '', result: '' },
        update: { text: '', result: '' },
      });
      return tx.room.update({
        where: { id: roomId },
        data: { answer_id: answererId, status: 'DRAWING', current_drawing_index: 0 },
      });
    });

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error during quick start:', error);
    return { success: false, error: 'Failed to start quick game', data: null };
  }
}

/**
 * 回答者が描画受付を締め切り、共有位置を先頭に戻して回答を開始する。
 */
export async function startAnswering(roomId: string, userId: string) {
  await requireRoomAccess(roomId);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const drawingCount = await tx.drawing.count({ where: { room_id: roomId } });
      if (drawingCount === 0) {
        return { success: false as const, error: 'NO_DRAWINGS', data: null };
      }

      const updated = await tx.room.updateMany({
        where: {
          id: roomId,
          answer_id: userId,
          status: 'DRAWING',
        },
        data: {
          status: 'ANSWERING',
          current_drawing_index: 0,
        },
      });

      if (updated.count !== 1) {
        return { success: false as const, error: 'NOT_ANSWERER_OR_INVALID_STATUS', data: null };
      }

      const room = await tx.room.findUnique({ where: { id: roomId } });
      return { success: true as const, error: null, data: room };
    }, { isolationLevel: 'Serializable' });

    return result;
  } catch (error) {
    console.error('Unexpected error while starting answer phase:', error);
    return { success: false as const, error: 'FAILED_TO_START_ANSWERING', data: null };
  }
}

/**
 * 不正解確定後、回答者だけが共有中のイラスト位置を1つ進める。
 * expectedIndexを更新条件に含め、二重送信による複数進行を防ぐ。
 */
export async function advanceAnswerDrawing(
  roomId: string,
  userId: string,
  expectedIndex: number,
) {
  await requireRoomAccess(roomId);
  if (!Number.isInteger(expectedIndex) || expectedIndex < 0) {
    return { success: false as const, error: 'INVALID_INDEX', data: null };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const drawingCount = await tx.drawing.count({ where: { room_id: roomId } });
      if (expectedIndex >= drawingCount - 1) {
        return { success: false as const, error: 'LAST_DRAWING', data: null };
      }

      const updated = await tx.room.updateMany({
        where: {
          id: roomId,
          answer_id: userId,
          status: 'ANSWERING',
          current_drawing_index: expectedIndex,
        },
        data: { current_drawing_index: { increment: 1 } },
      });

      if (updated.count !== 1) {
        return { success: false as const, error: 'PROGRESS_CONFLICT', data: null };
      }

      await tx.answerInput.upsert({
        where: { room_id: roomId },
        create: { room_id: roomId, text: '', result: '' },
        update: { text: '', result: '' },
      });

      return { success: true as const, error: null, data: expectedIndex + 1 };
    });

    return result;
  } catch (error) {
    console.error('Unexpected error while advancing answer drawing:', error);
    return { success: false as const, error: 'FAILED_TO_ADVANCE_DRAWING', data: null };
  }
}

/**
 * ルームIDでそのルームの得点を取得する関数
 */
export async function getRoomScores(roomId: string) {
  await requireRoomAccess(roomId);
  try {
    const data = await prisma.point.findMany({ where: { room_id: roomId }, include: { user: true } });

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch room scores', data: null };
  }
}

/**
 * 部屋に入った時に参加者得点をDBに登録する関数
 */
export async function registerParticipantScore(roomId: string, userId: string, userName: string) {
  await requireRoomAccess(roomId);
  try {
    const existing = await prisma.point.findMany({
      where: { room_id: roomId, user_id: userId },
      select: { id: true },
    });

    if (existing && existing.length > 0) {
      return { success: true, error: null, data: existing, isSkipped: true };
    }

    await ensureUser(userId, userName);

    const data = await prisma.point.create({
      data: { room_id: roomId, user_id: userId, point: 0 },
    });

    return { success: true, error: null, data, isSkipped: false };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to register participant score', data: null };
  }
}
