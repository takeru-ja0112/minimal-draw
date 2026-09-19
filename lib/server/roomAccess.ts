import { prisma } from '@/lib/prisma';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { z } from 'zod';

const COOKIE_NAME = 'room_access';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;
const MAX_GRANTED_ROOMS = 10;
const MIN_SECRET_LENGTH = 32;

// locked のときだけ入室を止める。not_found は従来どおり各画面/アクションの既存処理に任せる
export type RoomAccessState = 'open' | 'granted' | 'locked' | 'not_found';

export const ROOM_ACCESS_DENIED_MESSAGE = 'このルームにアクセスする権限がありません。';

const uuidSchema = z.uuid();

function getSecret(): string {
  const secret = process.env.ROOM_ACCESS_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`ROOM_ACCESS_SECRET が未設定、または${MIN_SECRET_LENGTH}文字未満です。`);
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function encodeCookie(roomIds: string[]): string {
  const payload = Buffer.from(JSON.stringify(roomIds)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeCookie(value: string | undefined): string[] {
  if (!value) return [];
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return [];

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return [];

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

async function readGrantedRoomIds(): Promise<string[]> {
  const store = await cookies();
  return decodeCookie(store.get(COOKIE_NAME)?.value);
}

/** Server Action / Route Handler からのみ呼べる(Cookie の書き込みを伴う) */
export async function grantRoomAccess(roomId: string): Promise<void> {
  const current = await readGrantedRoomIds();
  const next = [...current.filter((id) => id !== roomId), roomId].slice(-MAX_GRANTED_ROOMS);

  const store = await cookies();
  store.set(COOKIE_NAME, encodeCookie(next), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

// 同一リクエスト内で layout / page / Server Action から呼ばれてもDBアクセスは1回
export const getRoomAccess = cache(async (roomId: string): Promise<RoomAccessState> => {
  if (!uuidSchema.safeParse(roomId).success) return 'not_found';

  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { has_password: true } });
  if (!room) return 'not_found';
  if (!room.has_password) return 'open';

  return (await readGrantedRoomIds()).includes(roomId) ? 'granted' : 'locked';
});

export async function isRoomAccessible(roomId: string): Promise<boolean> {
  return (await getRoomAccess(roomId)) !== 'locked';
}

/** アクセス権がなければ例外を投げる(Server Action の先頭で使う) */
export async function requireRoomAccess(roomId: string): Promise<void> {
  if (!(await isRoomAccessible(roomId))) {
    throw new Error(ROOM_ACCESS_DENIED_MESSAGE);
  }
}
