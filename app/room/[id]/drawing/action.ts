"use server";

import { prisma } from '@/lib/prisma';
import { requireRoomAccess } from '@/lib/server/roomAccess';
import { ensureUser } from '@/app/user/action';

export type CanvasData = {
  lines: number[][];
  circles: Array<{x: number; y: number; radius: number}>;
  rects: Array<{x: number; y: number; width: number; height: number; rotation: number}>;
};

/**
 * 描画データの取得
 * ルームIDとユーザーIDでフィルタリングし、該当する描画データを返す
 */
export async function getDrawingByRoomAndUser(roomId: string , userId : string){
  await requireRoomAccess(roomId);
  try {
    const data = await prisma.drawing.findFirst({
      where: { room_id: roomId, user_id: userId },
    });

    if (!data) {
      return { success: false, error: 'Failed to fetch drawing', data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch drawing', data: null };
  }
}

// 描画データを保存（room_idとuser_idが一致する場合は更新）
export async function saveDrawing(
  roomId: string,
  userId: string,
  canvasData: CanvasData,
  userName : string,
  theme: string
) {
  await requireRoomAccess(roomId);
  try {
    // 要素数を計算
    const elementCount = canvasData.lines.length + canvasData.circles.length + canvasData.rects.length;

    await ensureUser(userId, userName);

    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        select: { status: true },
      });

      if (!room || room.status !== 'DRAWING') {
        throw new Error('DRAWING_PHASE_CLOSED');
      }

      // 既存のデータをチェック（room_idとuser_idで検索）
      const existing = await tx.drawing.findFirst({
        where: { room_id: roomId, user_id: userId },
        select: { id: true },
      });

      if (existing) {
        const data = await tx.drawing.update({
          where: { id: existing.id },
          data: {
            user_id: userId,
            canvas_data: canvasData,
            element_count: elementCount,
            theme,
          },
        });
        return { data, isUpdate: true };
      }

      const data = await tx.drawing.create({
        data: {
          room_id: roomId,
          user_id: userId,
          canvas_data: canvasData,
          element_count: elementCount,
          theme,
        },
      });
      return { data, isUpdate: false };
    }, { isolationLevel: 'Serializable' });

    return { success: true, error: null, data: result.data, isUpdate: result.isUpdate };
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error && error.message === 'DRAWING_PHASE_CLOSED'
      ? 'Drawing phase is closed'
      : 'Failed to save drawing';
    return { success: false, error: message, data: null };
  }
}



// ルームのお題を取得
export async function getTheme(roomId: string) {
  await requireRoomAccess(roomId);
  try{
    const data = await prisma.room.findUnique({
      where: { id: roomId },
      select: { current_theme: true },
    });

    return { success: true, error: null, data: data?.current_theme };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch theme', data: null };
  }
}

export async function getFurigana(roomId: string) {
  await requireRoomAccess(roomId);
  let current_theme_id: number | null = null;
  try{
    const data = await prisma.room.findUnique({
      where: { id: roomId },
      select: { current_theme_id: true },
    });

    current_theme_id = data?.current_theme_id ?? null;
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch current_theme_id', data: null };
  }

  if (current_theme_id === null) {
    return { success: false, error: 'No current theme id found', data: null };
  }

  try{
    const data = await prisma.theme.findUnique({
      where: { id: current_theme_id },
      select: { furigana: true },
    });

    return { success: true, error: null, data: data?.furigana };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch furigana', data: null };
  }
}
