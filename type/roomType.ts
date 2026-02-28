/**
 * ルーム情報の型定義
 *
 * @param id ルームID
 * @param status ルームの状態
 * @param current_theme 現在のお題
 * @param created_at 作成日時
 * @param created_by_name 作成者の名前
 * @param room_name ルーム名
 */
export interface Room {
  id: string;
  status: string;
  current_theme: string | null;
  created_at: string;
  created_by_name: string | null;
  room_name: string | null;
  short_id: string;
}

export interface CreateRoom {
  username: string;
  userId: string;
  roomName: string;
  level: string;
  genre: string;
}

export interface RoomSettingType {
  level: string;
  genre: string;
}

export interface Theme {
  id: string;
  theme: string;
}
