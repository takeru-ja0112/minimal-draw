import { CreateRoom } from "@/type/roomType";
import { z } from "zod";


const forbiddenChars = /[<>&\/\\'"]/;
const roomSchema =
  z
    .string()
    .max(30, "ルーム名は30文字以内で入力してください。")
    .refine((val) => !forbiddenChars.test(val),
      {
        message: 'ルーム名に使用できない文字が含まれています。',
      });


function validateRoomName(name: string) {
  const parseResult = roomSchema.safeParse(name);
  return parseResult as { success: boolean; error?: z.ZodError };
}

export function setRoomSchema({
  roomName,
  setRoomError,
  setCreateRoomData,
}: {
  roomName: string,
  setRoomError: React.Dispatch<React.SetStateAction<string>>,
  setCreateRoomData: React.Dispatch<React.SetStateAction<CreateRoom>>
}
) {
  setRoomError('');
  const result = validateRoomName(roomName);
  if (result.success && roomName) {
    setCreateRoomData(prev => ({ ...prev, roomName }));
    return { success: true, error: null };
  } else {
    // ユーザー名が空の場合処理
    if (roomName.length === 0) {
      setCreateRoomData(prev => ({ ...prev, roomName }));
      setRoomError('ルーム名は必須です。');
      return;
    }
    if (roomName.length > 10) {
      setRoomError('ルーム名は10文字以内で入力してください。');
      return;
    }
  }
}

/**
 * ショートIDのバリデーションスキーマ
 */
const allowedShortIdChars = /^[A-Za-z0-9]+$/;
const shortIdSchema =
  z
    .string()
    .length(6, "IDは6文字で入力してください。")
    .refine((val) => allowedShortIdChars.test(val), {
      message: 'IDは半角大文字英字と数字のみ使用できます。',
    });

export function validateShortId(id: string) {
  const parseResult = shortIdSchema.safeParse(id);
  return parseResult as { success: boolean; error?: z.ZodError };
}

export function searchRoomSchema(id: string) {
  const result = validateShortId(id);
  if (result.success) {
    return { success: true, error: null };
  } else {
    // IDが空の場合処理
    if (id.length === 0) {
      return { success: false, error: 'IDは必須です。' };
    }
    if (id.length <= 6) {
      return { success: false, error: 'IDは6文字で入力してください。' };
    }
  }
}