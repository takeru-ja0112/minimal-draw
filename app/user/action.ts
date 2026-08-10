'use server';

import { prisma } from '@/lib/prisma';

/**
 * ユーザーをm_userに存在させる（無ければ作成、あれば必要に応じてusernameを更新）
 *
 * ユーザーIDを外部キーとして書き込む処理の直前に必ず呼び出すことで、
 * FK制約違反を防ぐ。
 */
export async function ensureUser(userId: string, username?: string) {
  try {
    const data = await prisma.mUser.upsert({
      where: { id: userId },
      create: { id: userId, username: username ?? null },
      update: username !== undefined ? { username } : {},
    });

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to ensure user', data: null };
  }
}
