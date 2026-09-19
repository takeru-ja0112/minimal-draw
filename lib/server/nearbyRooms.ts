import { getNearbyGeohashes, type Coordinates } from '@/lib/geohash';
import { prisma } from '@/lib/prisma';
import type { NearbyRoom } from '@/type/roomType';

const NEARBY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_RESULTS = 30;

/**
 * 待機中で作成から24時間以内のルームのうち、現在地のセルと隣接セルにあるものを返す。
 * 論理削除済みは lib/prisma.ts の拡張が自動で除外する。
 */
export function findNearbyRooms(coordinates: Coordinates): Promise<NearbyRoom[]> {
  return prisma.room.findMany({
    select: { id: true, short_id: true, room_name: true, has_password: true },
    where: {
      status: 'WAITING',
      created_at: { gte: new Date(Date.now() - NEARBY_WINDOW_MS) },
      secret: { is: { geohash: { in: getNearbyGeohashes(coordinates) } } },
    },
    orderBy: { created_at: 'desc' },
    take: MAX_RESULTS,
  });
}
