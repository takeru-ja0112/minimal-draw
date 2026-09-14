import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

function cookieName(roomId: string): string {
  return `room_access_${roomId}`;
}

/**
 * password_hash自体をHMAC鍵として使うトークンを生成する
 *
 * password_hashはDBにしか存在しないため、これを知らないクライアントは
 * 正しいトークンを偽造できない。またパスワードが変更・解除されると
 * password_hashごと変わるため、過去に発行したトークンは自動的に無効になる
 */
function computeToken(roomId: string, passwordHash: string): string {
  return createHmac('sha256', passwordHash).update(roomId).digest('hex');
}

/**
 * このブラウザが指定ルームの入室パスワード検証を既にパスしているか確認する
 */
export async function hasRoomAccess(roomId: string, passwordHash: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(roomId))?.value;
  if (!token) {
    return false;
  }

  const expected = computeToken(roomId, passwordHash);
  const tokenBuf = Buffer.from(token, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  if (tokenBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(tokenBuf, expectedBuf);
}

/**
 * 入室パスワード検証済みであることをこのブラウザに記録する
 */
export async function grantRoomAccess(roomId: string, passwordHash: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName(roomId), computeToken(roomId, passwordHash), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 12, // 12時間
    path: `/room/${roomId}`,
  });
}
