import type { Coordinates } from '@/lib/geohash';
import type { Prisma } from '@/lib/generated/prisma/client';

/**
 * ルーム情報の型定義
 *
 * @param id ルームID
 * @param status ルームの状態
 * @param current_theme 現在のお題
 * @param created_at 作成日時
 * @param creator 作成者（m_userとのリレーション）
 * @param room_name ルーム名
 */
export interface Room {
  id: string;
  status: string;
  current_theme: string | null;
  created_at: Date;
  creator: { username: string | null } | null;
  room_name: string | null;
  short_id: string;
  has_password: boolean;
}

/**
 * 近くのルーム検索の結果(一覧表示に必要な公開情報のみ)
 */
export type NearbyRoom = Pick<Room, 'id' | 'short_id' | 'room_name' | 'has_password'>;

export interface CreateRoom {
  username: string;
  userId: string;
  roomName: string;
  level: string;
  genre: string;
  /** 4桁の数字。未指定ならパスワードなし */
  password?: string;
  /** 指定時のみ、サーバー側でgeohash化して保存する(近くの検索に表示される) */
  location?: Coordinates;
}

export interface RoomSettingType {
  level: string;
  genre: string;
}

export interface Theme {
  id: string;
  theme: string;
}

/**
 * ルームのスコア一覧（参加者情報込み）の型定義
 */
export type ScoreEntry = Prisma.PointGetPayload<{ include: { user: true } }>;
