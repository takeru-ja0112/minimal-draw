'use server';
import { ensureUser } from '@/app/user/action';
import { coordinatesSchema } from '@/lib/geohash';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { roomPasswordSchema } from '@/lib/roomPassword';
import { grantRoomAccess } from '@/lib/server/roomAccess';
import { findNearbyRooms } from '@/lib/server/nearbyRooms';
import { buildRoomSecretCreate } from '@/lib/server/roomSecrets';
import type { CreateRoom } from '@/type/roomType';

// ルーム一覧を取得
export async function getRooms() {
  try {
    const data = await prisma.room.findMany({
      orderBy: { created_at: 'desc' },
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
      error: 'Failed to fetch rooms',
      data: null,
    };
  }
}

const PAGE_SIZE = 10;

export type RoomSearchFilters = {
  roomName?: string;
  createdByName?: string;
  createdDate?: string; // 'YYYY-MM-DD'
};

export async function getRoomByPageSearch(page: number, filters: RoomSearchFilters = {}) {
  try {
    const skip = (page - 1) * PAGE_SIZE;

    const where: Prisma.RoomWhereInput = {
      ...(filters.roomName ? { room_name: { contains: filters.roomName, mode: 'insensitive' } } : {}),
      ...(filters.createdByName
        ? { creator: { username: { contains: filters.createdByName, mode: 'insensitive' } } }
        : {}),
    };

    if (filters.createdDate) {
      const startOfDay = new Date(`${filters.createdDate}T00:00:00+09:00`);
      const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      where.created_at = {
        gte: startOfDay,
        lt: startOfNextDay,
      };
    }

    const [data, count] = await prisma.$transaction([
      prisma.room.findMany({
        where,
        include: { creator: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.room.count({ where }),
    ]);

    return {
      success: true,
      error: null,
      data,
      total: count || 0,
      page,
      pageSize: PAGE_SIZE,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch rooms by page',
      data: null,
      total: 0,
      page,
      pageSize: PAGE_SIZE,
    };
  }
}

// 特定のルームを取得
export async function getRoom(roomId: string) {
  try {
    const data = await prisma.room.findUnique({ where: { id: roomId }, include: { creator: true } });

    if (!data) {
      return {
        success: false,
        error: 'Failed to fetch room',
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
      error: 'Failed to fetch room',
      data: null,
    };
  }
}

/**
 * ユーザーIDからルーム一覧を取得
 *
 * @param userId
 * @returns
 */
export async function getRoomsByUserId(userId: string) {
  try {
    const data = await prisma.room.findMany({
      where: { created_by_userId: userId },
      include: { creator: true },
      orderBy: { created_at: 'desc' },
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
      error: 'Failed to fetch rooms by user ID',
      data: null,
    };
  }
}

// ルームを作成
export async function createRoomByUsername(createRoomData: CreateRoom) {
  const sanitizedRoomName = createRoomData.roomName;
  const sanitizedUsername = createRoomData.username;
  const sanitizedLevel = createRoomData.level;
  const sanitizedGenre = createRoomData.genre;
  const userId = createRoomData.userId || null;
  const password = createRoomData.password ?? '';
  let randomTheme;

  if (password !== '') {
    const parsedPassword = roomPasswordSchema.safeParse(password);
    if (!parsedPassword.success) {
      return { success: false, error: parsedPassword.error.issues[0].message, data: null };
    }
  }

  let location;
  if (createRoomData.location) {
    const parsedLocation = coordinatesSchema.safeParse(createRoomData.location);
    if (!parsedLocation.success) {
      return { success: false, error: '位置情報が不正です。', data: null };
    }
    location = parsedLocation.data;
  }

  try {
    const data = await prisma.theme.findMany({
      where: {
        level: sanitizedLevel,
        // ジャンルが "ランダム" の場合は genre で絞り込まない
        ...(sanitizedGenre !== 'ランダム' ? { genre: sanitizedGenre } : {}),
      },
      select: { id: true, theme: true },
    });

    if (!data) {
      return {
        success: false,
        error: 'null',
        data: null,
      };
    }
    randomTheme = data[Math.floor(Math.random() * data.length)];
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch random theme',
      data: null,
    };
  }

  try {
    if (userId) {
      await ensureUser(userId, sanitizedUsername);
    }

    // 短いルームIDを生成
    const shortId = generateShortId();
    const secret = await buildRoomSecretCreate({ password, location });

    const data = await prisma.room.create({
      data: {
        short_id: shortId,
        created_by_userId: userId,
        room_name: sanitizedRoomName,
        current_theme: randomTheme.theme,
        current_theme_id: randomTheme.id,
        level: sanitizedLevel,
        genre: sanitizedGenre,
        has_password: password !== '',
        ...(secret ? { secret: { create: secret } } : {}),
      },
    });

    // 作成者はパスワードを入力せずに入室できるようにする
    if (password !== '') {
      await grantRoomAccess(data.id);
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    };
  }
}

// ルームのステータスを更新
export async function updateRoomStatus(roomId: string, status: 'WAITING' | 'DRAWING' | 'ANSWERING' | 'RESULT') {
  try {
    const data = await prisma.room.update({
      where: { id: roomId },
      data: { status },
    });

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    };
  }
}

// 回答者を設定
export async function setAnswerer(roomId: string, answererId: string) {
  try {
    const data = await prisma.room.update({
      where: { id: roomId },
      data: { answer_id: answererId },
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

// お題を設定
export async function setTheme(roomId: string, theme: string) {
  try {
    const data = await prisma.room.update({
      where: { id: roomId },
      data: { current_theme: theme },
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
      error: 'Failed to set theme',
      data: null,
    };
  }
}

// ヘルパー関数: 短いIDを生成
function generateShortId(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

//ショートIDにて検索
export async function getRoomByShortId(shortId: string) {
  const upperShortId = shortId.toUpperCase();

  try {
    const data = await prisma.room.findFirst({ where: { short_id: upperShortId } });

    if (!data) {
      return {
        success: false,
        error: 'ルームが見つかりません。',
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
      error: 'Failed to fetch room by short ID',
      data: null,
    };
  }
}

// 近くのルームを検索する関数
export async function fetchNearbyRooms(coordinates: { latitude: number; longitude: number }) {
  const parsed = coordinatesSchema.safeParse(coordinates);
  if (!parsed.success) {
    return { success: false, error: '位置情報が不正です。', data: [] };
  }

  try {
    const data = await findNearbyRooms(parsed.data);
    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: '近くのルームの取得に失敗しました。', data: [] };
  }
}
