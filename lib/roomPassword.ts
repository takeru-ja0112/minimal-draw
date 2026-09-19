import { z } from 'zod';

export const ROOM_PASSWORD_LENGTH = 4;

export const ROOM_PASSWORD_MESSAGES = {
  length: 'パスワードは4桁必要です',
  digits: '数字のみ入力可能です',
} as const;

// 数字以外の指摘を優先するため、digits → length の順に検証する
export const roomPasswordSchema = z
  .string()
  .refine((value) => /^\d*$/.test(value), { message: ROOM_PASSWORD_MESSAGES.digits })
  .refine((value) => value.length === ROOM_PASSWORD_LENGTH, { message: ROOM_PASSWORD_MESSAGES.length });

/**
 * 任意入力のパスワード欄用。未入力はエラーなし(パスワードなし)。
 * 入力がある場合のみ 4桁の数字を要求し、最初のエラーメッセージを返す。
 */
export function getRoomPasswordError(value: string): string | null {
  if (value === '') return null;
  const result = roomPasswordSchema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
}
