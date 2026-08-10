"use server";

import { prisma } from '@/lib/prisma';

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

// 描画データを保存（room_idとuser_nameが一致する場合は更新）
export async function saveDrawing(
  roomId: string,
  userId: string,
  canvasData: CanvasData,
  userName : string,
  theme: string
) {
  try {
    // 要素数を計算
    const elementCount = canvasData.lines.length + canvasData.circles.length + canvasData.rects.length;

    // 既存のデータをチェック（room_idとuser_nameで検索）
    const existing = await prisma.drawing.findFirst({
      where: { room_id: roomId, user_name: userName },
      select: { id: true },
    });

    let data;

    if (existing) {
      // 既存データがあれば更新
      data = await prisma.drawing.update({
        where: { id: existing.id },
        data: {
          user_id: userId,
          canvas_data: canvasData,
          element_count: elementCount,
          theme: theme,
        },
      });
    } else {
      // 既存データがなければ新規挿入
      data = await prisma.drawing.create({
        data: {
          room_id: roomId,
          user_id: userId,
          user_name: userName,
          canvas_data: canvasData,
          element_count: elementCount,
          theme: theme,
        },
      });
    }

    return { success: true, error: null, data, isUpdate: !!existing };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to save drawing', data: null };
  }
}



// ルームのお題を取得
export async function getTheme(roomId: string) {
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
