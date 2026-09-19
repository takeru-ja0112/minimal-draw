import Geohash from 'latlon-geohash';
import { z } from 'zod';

// 保存・検索とも同じ精度(約150m四方)。位置の特定を避けるため保存精度もこの桁数に固定する
export const ROOM_GEOHASH_PRECISION = 7;

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

export function encodeRoomGeohash({ latitude, longitude }: Coordinates): string {
  return Geohash.encode(latitude, longitude, ROOM_GEOHASH_PRECISION);
}

/**
 * 現在地のセルと隣接8セル。セル境界付近で「近いのに前方一致しない」取りこぼしを防ぐ。
 */
export function getNearbyGeohashes(coordinates: Coordinates): string[] {
  const center = encodeRoomGeohash(coordinates);
  return [center, ...Object.values(Geohash.neighbours(center))];
}
