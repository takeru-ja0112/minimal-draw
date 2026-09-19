import type { PresenceUser } from "@/hooks/usePresence";
import { CreateRoom, ScoreEntry } from "@/type/roomType";
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
 * 検索用ID(search_code)のバリデーションスキーマ
 * 5桁の半角数字のみ。先頭ゼロ(00123等)を保持するため、数値ではなく文字列として扱う。
 */
export const SEARCH_CODE_LENGTH = 5;
const searchCodeSchema =
  z
    .string()
    .regex(/^[0-9]*$/, "IDは数字のみ入力できます。")
    .length(SEARCH_CODE_LENGTH, `IDは${SEARCH_CODE_LENGTH}桁の数字で入力してください。`);

export function validateSearchCode(id: string) {
  return searchCodeSchema.safeParse(id);
}

/**
 * ID検索の入力チェック。クライアント・サーバー双方で同じ判定を使う。
 * 失敗時は画面に出すメッセージを error に入れて返す。
 */
export function searchRoomSchema(id: string): { success: true; error: null } | { success: false; error: string } {
  if (id.length === 0) {
    return { success: false, error: 'IDは必須です。' };
  }
  const result = validateSearchCode(id);
  if (result.success) {
    return { success: true, error: null };
  }
  return { success: false, error: result.error.issues[0].message };
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
  iconName?: string | null;
  iconColor?: string | null;
};

/**
 * スコア一覧（DB由来・オフラインでも残る）と現在の接続中ユーザー一覧を
 * user_id で突合し、得点降順のボード表示用データを作る
 *
 * アイコンはオンライン中のプレゼンス情報（最新の設定）を優先し、
 * オフラインの場合はDB保存済みのユーザー情報にフォールバックする
 */
export function buildScoreBoardEntries(
  scores: ScoreEntry[],
  users: PresenceUser[],
): BoardEntry[] {
  const onlineUsers = new Map(users.map((u) => [u.user_id, u]));

  const fromScores: BoardEntry[] = scores.map((s) => {
    const online = onlineUsers.get(s.user_id);
    return {
      user_id: s.user_id,
      username: s.user?.username ?? '名無し',
      point: s.point,
      isOnline: !!online,
      iconName: online?.icon_name ?? s.user?.icon_name,
      iconColor: online?.icon_color ?? s.user?.icon_color,
    };
  });

  const scoreIds = new Set(scores.map((s) => s.user_id));
  const fromOnlineOnly: BoardEntry[] = users
    .filter((u) => !scoreIds.has(u.user_id))
    .map((u) => ({
      user_id: u.user_id,
      username: u.user_name,
      point: 0,
      isOnline: true,
      iconName: u.icon_name,
      iconColor: u.icon_color,
    }));

  return [...fromScores, ...fromOnlineOnly].sort((a, b) => b.point - a.point);
}
