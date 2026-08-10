# M_USERテーブル新設とユーザーID系リレーション化 実装計画

作成日: 2026-08-10
対象: DBスキーマ全体（`prisma/schema.prisma`）、ユーザーIDを扱う全サーバーアクション、関連コンポーネント

## 1. 目的

ユーザー情報（現状はユーザーID・ユーザー名がテーブルごとにバラバラに保存されている）を
`m_user` テーブルに一元管理し、他テーブルのユーザーID系カラムをすべて外部キー（FK）による
リレーションとして管理する。

## 2. 現状分析

### 2.1 ユーザーの実体

現状「ユーザー」はDBに実体を持たない。`lib/user.ts` の `generateUUID()` でブラウザ側だけで
IDを生成し `localStorage` に保存しているだけで、サーバーへの登録は一切行っていない。
そのユーザーIDが、ルーム作成・描画・得点登録などの際に各テーブルへそのまま書き込まれている。

### 2.2 現在ユーザーIDを保持しているカラム

| テーブル | カラム | Null許容 | 用途 |
| --- | --- | --- | --- |
| `rooms` | `created_by_userId` | Yes | ルーム作成者 |
| `rooms` | `answer_id` | Yes | 現在の回答者 |
| `drawings` | `user_id` | No | 描き手 |
| `points` | `user_id` | No | 得点対象者 |
| `subscriptions` | `user_id` | No（`@unique`） | Push通知購読者 |
| `history_drawings` | `user_id` | No | 描き手（美術館履歴） |

### 2.3 現在の冗長なユーザー名カラム

`rooms.created_by_name` / `drawings.user_name` / `points.user_name` / `history_drawings.user_name` —
いずれもその時点でクライアントから渡された表示名をそのまま保存しているだけで、`m_user` が
正になった後は不要（JOINで取得できる）。

## 3. 確認済みの方針（ヒアリング済み）

1. 物理テーブル名は既存の命名規則（小文字snake_case）に合わせて **`m_user`** とする。Prismaモデル名は `MUser`。
2. 既存データは、全テーブルからdistinctなuser_idを抽出して事前に `m_user` へbackfillしてからFK制約を追加する（既存データを一切欠損させない）。
3. 冗長なユーザー名カラム（`created_by_name` / `user_name`）は削除し、`m_user` とのJOINに一元化する。

## 4. `m_user` テーブル設計

```prisma
model MUser {
  id         String   @id @db.Uuid           // クライアント生成UUIDをそのまま格納（DB側では自動生成しない）
  username   String?                          // 未設定の場合はnull
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @updatedAt @db.Timestamptz(6)

  createdRooms    Room[]           @relation("RoomCreator")
  answeredRooms   Room[]           @relation("RoomAnswerer")
  drawings        Drawing[]
  points          Point[]
  subscription    Subscription?
  historyDrawings HistoryDrawing[]

  @@map("m_user")
}
```

**重要な注意点**: `id` に `@default(dbgenerated("gen_random_uuid()"))` を付けない。
既存の他テーブル（`rooms.id` など）はDB側でUUIDを自動採番しているが、ユーザーIDは
これまで通りクライアント（`lib/user.ts`）が生成したUUIDをそのまま使う。ここを変えると
既存の `localStorage` 上のユーザーIDと不整合を起こすため変更しない。

## 5. Prismaスキーマの変更（全体像）

```prisma
model Room {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  short_id          String
  status            String   @default("WAITING")
  current_theme     String?
  current_theme_id  Int?
  answer_id         String?  @db.Uuid
  created_by_userId String?  @db.Uuid
  room_name         String?
  level             String?
  genre             String?
  created_at        DateTime @default(now()) @db.Timestamptz(6)

  creator  MUser? @relation("RoomCreator", fields: [created_by_userId], references: [id], onDelete: SetNull)
  answerer MUser? @relation("RoomAnswerer", fields: [answer_id], references: [id], onDelete: SetNull)

  @@map("rooms")
}

model Drawing {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  room_id       String   @db.Uuid
  user_id       String   @db.Uuid
  canvas_data   Json
  element_count Int
  theme         String?
  created_at    DateTime @default(now()) @db.Timestamptz(6)

  user MUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("drawings")
}

model Point {
  id      String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  room_id String @db.Uuid
  user_id String @db.Uuid
  point   Int    @default(0)

  user MUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("points")
}

model Subscription {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String   @unique @db.Uuid
  room_id      String   @db.Uuid
  subscription Json
  created_at   DateTime @default(now()) @db.Timestamptz(6)

  user MUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model HistoryDrawing {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  room_id       String   @db.Uuid
  user_id       String   @db.Uuid
  canvas_data   Json
  element_count Int
  theme         String?
  created_at    DateTime @default(now()) @db.Timestamptz(6)

  user MUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("history_drawings")
}
```

`Theme` モデルはユーザーを参照しないため変更なし。

`created_by_userId` / `answer_id` は同一モデル（`MUser`）への2本のリレーションになるため、
Prismaの仕様上 `@relation("名前")` で明示的に区別する（`RoomCreator` / `RoomAnswerer`）。

`onDelete` ポリシー（提案・要レビュー）:
- `rooms.created_by_userId` / `rooms.answer_id` … `SetNull`（ユーザーが消えてもルーム自体は残す）
- `drawings` / `points` / `subscriptions` / `history_drawings` の `user_id` … `Cascade`（ユーザーに紐づく実績データも一緒に消す）

現状ユーザーを削除する機能は存在しないため実害はないが、将来の「退会機能」等を見据えた場合の
初期方針として提案する。要件があれば変更する。

## 6. DBマイグレーション手順（実行順）

Prismaの `migrate dev` はshadow DB用に直接接続（セッションモード/ポート5432）が必要だが、
このサンドボックス環境からは直接接続がブロックされておりpgbouncer（トランザクションモード/
ポート6543）経由のみ疎通できることを確認済み。そのため本マイグレーションは以下のいずれかで
実行する想定とする（実装着手時に選定）。

- Supabase ダッシュボードのSQL Editorで直接実行
- 直接接続が可能な環境から `prisma migrate dev` / `psql` で実行

### Step 1: `m_user` テーブル作成

```sql
CREATE TABLE m_user (
  id UUID PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Step 2: 既存データのbackfill

同一user_idが複数テーブルに存在する場合、既にusernameが入っていれば上書きしない
（`COALESCE` で先勝ちにする）。

```sql
-- rooms.created_by_userId → created_by_name
INSERT INTO m_user (id, username)
SELECT DISTINCT ON (created_by_userId) created_by_userId, created_by_name
FROM rooms
WHERE created_by_userId IS NOT NULL
ORDER BY created_by_userId, created_at DESC
ON CONFLICT (id) DO UPDATE SET username = COALESCE(m_user.username, EXCLUDED.username);

-- rooms.answer_id（名前情報なし）
INSERT INTO m_user (id, username)
SELECT DISTINCT answer_id, NULL
FROM rooms
WHERE answer_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- drawings.user_id → user_name
INSERT INTO m_user (id, username)
SELECT DISTINCT ON (user_id) user_id, user_name
FROM drawings
ORDER BY user_id, created_at DESC
ON CONFLICT (id) DO UPDATE SET username = COALESCE(m_user.username, EXCLUDED.username);

-- points.user_id → user_name
INSERT INTO m_user (id, username)
SELECT DISTINCT ON (user_id) user_id, user_name
FROM points
ORDER BY user_id, id DESC
ON CONFLICT (id) DO UPDATE SET username = COALESCE(m_user.username, EXCLUDED.username);

-- history_drawings.user_id → user_name
INSERT INTO m_user (id, username)
SELECT DISTINCT ON (user_id) user_id, user_name
FROM history_drawings
ORDER BY user_id, created_at DESC
ON CONFLICT (id) DO UPDATE SET username = COALESCE(m_user.username, EXCLUDED.username);

-- subscriptions.user_id（名前情報なし）
INSERT INTO m_user (id, username)
SELECT DISTINCT user_id, NULL
FROM subscriptions
ON CONFLICT (id) DO NOTHING;
```

backfill後、以下で孤立参照が無いことを確認してからFKを追加する。

```sql
SELECT created_by_userId FROM rooms WHERE created_by_userId IS NOT NULL
  AND created_by_userId NOT IN (SELECT id FROM m_user);
-- 他テーブルも同様に確認（結果0件であること）
```

### Step 3: FK制約の追加

```sql
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_created_by_userid FOREIGN KEY (created_by_userId)
    REFERENCES m_user(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_rooms_answer_id FOREIGN KEY (answer_id)
    REFERENCES m_user(id) ON DELETE SET NULL;

ALTER TABLE drawings
  ADD CONSTRAINT fk_drawings_user_id FOREIGN KEY (user_id)
    REFERENCES m_user(id) ON DELETE CASCADE;

ALTER TABLE points
  ADD CONSTRAINT fk_points_user_id FOREIGN KEY (user_id)
    REFERENCES m_user(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
  ADD CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id)
    REFERENCES m_user(id) ON DELETE CASCADE;

ALTER TABLE history_drawings
  ADD CONSTRAINT fk_history_drawings_user_id FOREIGN KEY (user_id)
    REFERENCES m_user(id) ON DELETE CASCADE;
```

### Step 4: 冗長カラムの削除

FK・アプリケーション側の切り替えが完了し、動作確認が済んでから実行する（後戻りしにくい破壊的操作のため最後に回す）。

```sql
ALTER TABLE rooms DROP COLUMN created_by_name;
ALTER TABLE drawings DROP COLUMN user_name;
ALTER TABLE points DROP COLUMN user_name;
ALTER TABLE history_drawings DROP COLUMN user_name;
```

## 7. アプリケーション層の変更

### 7.1 新規: `ensureUser` サーバーアクション

FK制約がある以上、`m_user` に存在しないIDでは書き込みできない。ユーザーIDを伴う
書き込みの直前に必ず該当ユーザーをupsertする共通関数を新設する。

`app/user/action.ts`（新規、`'use server'`）:

```ts
export async function ensureUser(userId: string, username?: string) {
  return prisma.mUser.upsert({
    where: { id: userId },
    create: { id: userId, username: username ?? null },
    update: username !== undefined ? { username } : {},
  });
}
```

### 7.2 呼び出し箇所の追加

| 呼び出し元 | ファイル | 備考 |
| --- | --- | --- |
| ユーザー名設定確定時 | `lib/user.ts` の `setUsernameSchema` 成功時 | ルーム作成前でも名前登録した時点で `m_user` に反映される、最も早いタイミング |
| `createRoomByUsername` | `app/lobby/action.ts` | `userId` がある場合のみ |
| `saveDrawing` | `app/room/[id]/drawing/action.ts` | |
| `registerParticipantScore` | `app/room/[id]/action.ts` | |
| `subscribePush` | `app/room/[id]/answer/action.ts` | このタイミングではusernameを受け取っていないため `username` 引数なしで呼ぶ（既存ユーザーなら名前は上書きしない） |
| `setdbAnswer` | `app/room/[id]/answer/action.ts` | `rooms.answer_id` がFKになるため、更新前に必須 |

### 7.3 読み取り側の変更（JOIN化）

`created_by_name` / `user_name` を直接読んでいた箇所を、Prismaの `include` でリレーション先の
`username` を取得する形に変更する。

- `app/lobby/action.ts`: `getRooms` / `getRoomByPageSearch` / `getRoom` / `getRoomsByUserId` に `include: { creator: true }` を追加し、呼び出し元では `room.creator?.username` を参照
- `app/museum/action.ts`: `getArts` に `include: { user: true }` を追加
- `components/pages/LobbyPage.tsx`, `components/pages/AnswerPage.tsx` など `created_by_name` / `user_name` を直接参照している箇所をすべて洗い出し、ネストしたプロパティ参照に置き換える
- `type/roomType.ts`（`Room`）, `type/AnswerType.ts`（`Drawing`）, `type/DrawingDataType.ts` の型定義を、フラットな名前フィールドからリレーションオブジェクト参照に更新

### 7.4 ロジック修正が必要な箇所

`saveDrawing`（`app/room/[id]/drawing/action.ts`）の既存データ判定は現在
`room_id` + `user_name` の組み合わせで検索しているが、`user_name` カラム削除に伴い
**`room_id` + `user_id` の組み合わせに変更する**（本来こちらが正しいキーであり、副次的な
バグ修正にもなる）。

## 8. 影響範囲一覧（変更が必要なファイル）

- `prisma/schema.prisma`（`MUser`モデル追加、各モデルにリレーション追加、名前カラム削除）
- `app/user/action.ts`（新規、`ensureUser`）
- `lib/user.ts`（`setUsernameSchema` から `ensureUser` を呼ぶよう変更）
- `app/lobby/action.ts`（`createRoomByUsername` に `ensureUser` 追加、読み取り系に `include` 追加）
- `app/room/[id]/action.ts`（`registerParticipantScore` に `ensureUser` 追加）
- `app/room/[id]/answer/action.ts`（`subscribePush` / `setdbAnswer` に `ensureUser` 追加）
- `app/room/[id]/drawing/action.ts`（`saveDrawing` に `ensureUser` 追加、既存判定キーを `user_id` に変更）
- `app/museum/action.ts`（読み取り系に `include` 追加）
- `components/pages/LobbyPage.tsx` / `AnswerPage.tsx` 等、`created_by_name` / `user_name` を直接参照しているコンポーネント
- `type/roomType.ts` / `type/AnswerType.ts` / `type/DrawingDataType.ts`

前回計画済みの「TOP画面 名前登録・ルーム作成・ルーム検索」（`doc/2026-08-10-top-name-registration-and-room-search.md`）は、
`room.created_by_name` を直接表示する設計になっている。本変更を先に実装する場合はTOP側の設計も
`room.creator?.username` 参照に合わせて修正が必要（実装順序に応じてどちらかの計画書を更新する）。

## 9. 実装タスク一覧

1. `prisma/schema.prisma` に `MUser` モデルとリレーションを追加（この時点ではまだ名前カラムは残す）
2. Step1〜3のSQLをDBに適用（テーブル作成 → backfill → 孤立参照確認 → FK追加）
3. `npx prisma generate` でクライアント再生成
4. `app/user/action.ts` に `ensureUser` を実装
5. `lib/user.ts` の `setUsernameSchema` から `ensureUser` を呼び出すよう変更
6. 各書き込み系アクション（7.2の表）に `ensureUser` 呼び出しを追加
7. 各読み取り系アクションに `include` を追加し、コンポーネント側の参照を `creator.username` / `user.username` に置き換え
8. `saveDrawing` の既存判定キーを `user_id` ベースに修正
9. 型定義（`type/*.ts`）を更新
10. 動作確認（ルーム作成・入室・描画・得点登録・Push購読・美術館表示の一連の流れ）
11. 動作確認が取れてからStep4（冗長カラムのDROP）を実行

## 10. リスク・注意点

- **破壊的変更**: カラム削除（Step4）は取り消しが難しい。Step1〜3・アプリ側変更の動作確認が
  完全に終わるまでStep4は実行しない。
- **孤立参照**: backfillが漏れているとFK追加時にエラーになる。Step2実行後に必ず孤立参照チェックを行う。
- **`answer_id` の名前不一致**: 実DBのカラム名は `answer_id` だが、意味的には「回答者のuser_id」であり、
  今回のリレーション名は `answerer` とする（既存コードのフィールド名 `answer_id` 自体はリネームしない）。
- **サンドボックス環境からのDDL実行不可**: 現在の作業環境（このセッション）は直接DB接続がブロック
  されているため、Step1〜4のSQLは別途Supabase SQL Editor等で実行する必要がある。

## 11. 未確定事項（実装着手前に確認したい点）

- `onDelete` ポリシー（`SetNull` / `Cascade` の割り当て）は本計画の提案どおりで問題ないか
- `ensureUser` の呼び出しタイミング（本計画では「名前確定時」＋「各書き込み直前」の二重化を提案）でよいか
- TOP画面計画（`doc/2026-08-10-top-name-registration-and-room-search.md`）との実装順序（本変更を先にやるか、TOP機能を先にやるか）
