import { ROOM_SEARCH_WINDOW_MS } from '@/lib/roomConstants';
import { prisma } from '@/lib/prisma';

/**
 * search_code が一致し、作成から24時間以内のルームを返す。
 * search_code は UNIQUE ではないため、万一重複した場合は最新のものを返す。
 * 論理削除済みは lib/prisma.ts の拡張が自動で除外する。
 */
export function findRoomBySearchCode(searchCode: string) {
  return prisma.room.findFirst({
    where: {
      search_code: searchCode,
      created_at: { gte: new Date(Date.now() - ROOM_SEARCH_WINDOW_MS) },
    },
    orderBy: { created_at: 'desc' },
  });
}
