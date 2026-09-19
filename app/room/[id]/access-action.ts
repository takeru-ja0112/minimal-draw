'use server';

import { roomPasswordSchema } from '@/lib/roomPassword';
import { prisma } from '@/lib/prisma';
import { grantRoomAccess } from '@/lib/server/roomAccess';
import { verifyRoomPasswordHash } from '@/lib/server/roomPasswordHash';
import { z } from 'zod';

const WRONG_PASSWORD = 'パスワードが違います。';

/**
 * ルームのパスワードを検証し、正しければ入室用の署名Cookieを発行する。
 * パスワード未設定のルームは常に成功(ゲートが古い状態で表示された場合の救済)。
 */
export async function verifyRoomPassword(roomId: string, password: string) {
  if (!z.uuid().safeParse(roomId).success) {
    return { success: false, error: 'ルームが見つかりません。' };
  }

  const parsed = roomPasswordSchema.safeParse(password);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { has_password: true, secret: { select: { password_hash: true } } },
    });

    if (!room) return { success: false, error: 'ルームが見つかりません。' };
    if (!room.has_password) return { success: true, error: null };

    const hash = room.secret?.password_hash;
    if (!hash || !(await verifyRoomPasswordHash(parsed.data, hash))) {
      return { success: false, error: WRONG_PASSWORD };
    }

    await grantRoomAccess(roomId);
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'パスワードの確認に失敗しました。' };
  }
}
