import { CreateRoom, ScoreEntry } from "@/type/roomType";
import type { PresenceUser } from "@/hooks/usePresence";
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

/**
 * 得点順に並んだスコア一覧から、同着を考慮した順位を計算する
 *
 * 事前に得点降順でソートされている前提（同着＝直前と同じ得点は同順位、
 * それ以外は1つ前の順位+1）
 */
export function calculateRanks(scores: { point: number }[]): number[] {
  return scores.reduce<number[]>((acc, score, index) => {
    if (index === 0) {
      acc.push(1);
      return acc;
    }

    const prevScore = scores[index - 1];
    if (prevScore && prevScore.point === score.point) {
      acc.push(acc[index - 1]);
      return acc;
    }

    acc.push(acc[index - 1] + 1);
    return acc;
  }, []);
}

export type BoardEntry = {
  user_id: string;
  username: string;
  point: number;
  isOnline: boolean;
};

/**
 * スコア一覧（DB由来・オフラインでも残る）と現在の接続中ユーザー一覧を
 * user_id で突合し、得点降順のボード表示用データを作る
 */
export function buildScoreBoardEntries(
  scores: ScoreEntry[],
  users: PresenceUser[],
): BoardEntry[] {
  const onlineIds = new Set(users.map((u) => u.user_id));

  const fromScores: BoardEntry[] = scores.map((s) => ({
    user_id: s.user_id,
    username: s.user?.username ?? '名無し',
    point: s.point,
    isOnline: onlineIds.has(s.user_id),
  }));

  const scoreIds = new Set(scores.map((s) => s.user_id));
  const fromOnlineOnly: BoardEntry[] = users
    .filter((u) => !scoreIds.has(u.user_id))
    .map((u) => ({
      user_id: u.user_id,
      username: u.user_name,
      point: 0,
      isOnline: true,
    }));

  return [...fromScores, ...fromOnlineOnly].sort((a, b) => b.point - a.point);
}