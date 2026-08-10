'use server';

import { prisma } from '@/lib/prisma';

// 回答内容の取得（回答者の入力・正誤結果）
export async function getAnswerInput(roomId: string) {
  try {
    const data = await prisma.answerInput.findUnique({ where: { room_id: roomId } });

    if (!data) {
      return { success: false, error: 'Failed to fetch answer input', data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch answer input', data: null };
  }
}

// 回答者が決定しているか確認
export async function isCheckAnswer(roomId: string) {
  try {
    const data = await prisma.room.findUnique({
      where: { id: roomId },
      select: { answer_id: true },
    });

    const isAnswered = data?.answer_id ? true : false;
    return {
      success: true,
      error: null,
      data: isAnswered,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch answerer',
      data: null,
    };
  }
}

// 回答者の登録
export async function setdbAnswer(roomId: string, userId: string) {
  try {
    // 既に回答者が設定されているか確認
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      select: { answer_id: true },
    });

    if (roomData?.answer_id) {
      return {
        success: false,
        error: 'Answerer already set',
        data: null,
      };
    }

    // 回答者を設定
    const data = await prisma.room.update({
      where: { id: roomId },
      data: { answer_id: userId },
    });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to set answerer',
      data: null,
    };
  }
}

// 特定ルームの描画データを取得（要素数昇順）
export async function getDrawingsByRoom(roomId: string) {
  try {
    const data = await prisma.drawing.findMany({
      where: { room_id: roomId },
      orderBy: { element_count: 'asc' },
    });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch drawings',
      data: null,
    };
  }
}

// 画面を見ているユーザーに解答権限があるかどうか確認
export async function checkAnswerRole(roomId: string, userId: string) {
  try {
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      select: { answer_id: true },
    });

    const isAnswerRole = roomData?.answer_id === userId;
    return {
      success: true,
      error: null,
      isAnswerRole: isAnswerRole,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to check answer role',
      isAnswerRole: false,
    };
  }
}

// お題を取得
export async function getTheme(roomId: string) {
  try {
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      select: { current_theme: true },
    });

    return {
      success: true,
      error: null,
      data: roomData?.current_theme || null,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch theme',
      data: null,
    };
  }
}

// お題の正誤判定のため複数パターンを取得
export async function getThemePatternByRoomId(roomId: string) {
  const id = roomId;
  let themeId: number;

  try {
    const data = await prisma.room.findUnique({
      where: { id },
      select: { current_theme_id: true },
    });

    if (!data || data.current_theme_id === null) {
      return {
        success: false,
        error: 'No current theme id found',
        data: null,
      };
    }

    themeId = data.current_theme_id;
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch current theme id',
      data: null,
    };
  }

  try {
    const data = await prisma.theme.findUnique({ where: { id: themeId } });

    if (!data) {
      return {
        success: false,
        error: 'Theme not found',
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch theme patterns',
      data: null,
    };
  }
}

/**
 * 回答の登録
 */
export async function setdbAnswerInput(roomId: string, answer: string) {
  try {
    const data = await prisma.answerInput.upsert({
      where: { room_id: roomId },
      create: { room_id: roomId, text: answer },
      update: { text: answer },
    });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to set answer input',
      data: null,
    };
  }
}
/**
 * 回答結果の記録
 */
export async function setdbAnswerResult(roomId: string, result: string) {
  try {
    const data = await prisma.answerInput.upsert({
      where: { room_id: roomId },
      create: { room_id: roomId, result },
      update: { result },
    });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to set answer result',
      data: null,
    };
  }
}

/**
 * サブスクリプションテーブルに登録
 */
export async function subscribePush(userId: string, room_id: string, subscription: any) {
  try {
    const data = await prisma.subscription.upsert({
      where: { user_id: userId },
      create: { user_id: userId, room_id, subscription },
      update: { room_id, subscription },
    });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to subscribe push',
      data: null,
    };
  }
}

/**
 * サブスクリプションテーブルから削除
 */
export async function unsubscribePush(userId: string) {
  const cleanUserId = userId.trim();
  try {
    const data = await prisma.subscription.deleteMany({ where: { user_id: cleanUserId } });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to unsubscribe push',
      data: null,
    };
  }
}

/**
 * 指定のuserIdに対してポイントを加算する関数
 */
export async function addPointsToUser(roomId: string, userId: string, pointsToAdd: number) {
  try {
    // 現在のポイントを取得
    const existingPointData = await prisma.point.findFirst({
      where: { room_id: roomId, user_id: userId },
      select: { id: true, point: true },
    });

    if (!existingPointData) {
      console.error('Failed to fetch existing points');
      return {
        success: false,
        error: 'Failed to fetch existing points',
        data: null,
      };
    }

    const newPoints = (existingPointData?.point || 0) + pointsToAdd;

    // ポイントを更新
    const updateData = await prisma.point.update({
      where: { id: existingPointData?.id },
      data: { point: newPoints },
    });

    return {
      success: true,
      error: null,
      data: updateData,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to add points',
      data: null,
    };
  }
}
