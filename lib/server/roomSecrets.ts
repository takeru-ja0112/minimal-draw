import type { Coordinates } from '@/lib/geohash';
import { encodeRoomGeohash } from '@/lib/geohash';
import type { Prisma } from '@/lib/generated/prisma/client';
import { hashRoomPassword } from '@/lib/server/roomPasswordHash';

/**
 * room_secrets に保存する内容を作る。パスワードも位置もなければ undefined(行を作らない)。
 * パスワードはハッシュ化し、位置は座標のままではなく geohash にして渡す。
 */
export async function buildRoomSecretCreate(input: {
  password: string;
  location?: Coordinates;
}): Promise<Prisma.RoomSecretCreateWithoutRoomInput | undefined> {
  if (input.password === '' && !input.location) return undefined;

  return {
    password_hash: input.password === '' ? null : await hashRoomPassword(input.password),
    geohash: input.location ? encodeRoomGeohash(input.location) : null,
  };
}
