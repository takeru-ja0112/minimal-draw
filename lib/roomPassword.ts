import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/**
 * ルーム入室パスワードのバリデーションスキーマ（数字4桁のみ）
 */
export const roomPasswordSchema = z
  .string()
  .regex(/^\d{4}$/, 'パスワードは数字4桁で入力してください。');

export function validateRoomPassword(password: string) {
  const parseResult = roomPasswordSchema.safeParse(password);
  return parseResult as { success: boolean; error?: z.ZodError };
}

/**
 * ルーム入室パスワードをハッシュ化する（ソルト付きscrypt）
 *
 * 保存形式: "<salt(hex)>:<derivedKey(hex)>"
 */
export async function hashRoomPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * 入力されたパスワードが保存済みハッシュと一致するか検証する
 *
 * scryptによる再計算後、timingSafeEqualで比較しタイミング攻撃を避ける
 */
export async function verifyRoomPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(hashHex, 'hex');

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}
