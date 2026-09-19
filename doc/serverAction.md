Lobby action

### getRooms
ルーム一覧を取得（作成日時降順）

### getRoomByPageSearch
ページネーション＋検索でルーム一覧取得

### getRoom
特定のルーム情報を取得

### createRoomByUsername
ユーザー名・ルーム名・レベル・ジャンルからルーム作成＋ランダムお題設定
- `password`(任意): 4桁の数字。サーバー側でも検証し、scryptでハッシュ化して `room_secrets` に保存。`rooms.has_password` を true にし、作成者には入室Cookieを発行する
- `location`(任意): `{ latitude, longitude }`。サーバー側で検証し、7桁のgeohashにして `room_secrets` に保存する(座標そのものは保存しない)

### fetchNearbyRooms
現在地の近くのルームを取得。座標をサーバー側でzod検証(緯度-90〜90・経度-180〜180)し、現在地セル+隣接8セルの geohash で検索する。
対象は status=WAITING かつ作成から24時間以内(最大30件)。返却は `{ id, short_id, room_name, has_password }` のみ(パスワード・geohashは含まない)

### updateRoomStatus
ルームのステータス（WAITING/DRAWING/ANSWERING/RESULT）を更新

### setAnswerer
回答者IDを設定

### setTheme
お題を設定

---
room action

### setStatusRoom
ルームのステータスを変更（WATING/DRAWING/ANSWERING/FINISHED/RESETTING）

### getInfoRoom
ルームの全情報を取得

### resetRoomSettings
ルーム設定を初期化（お題再取得＋描画データ削除＋回答者リセット）

### resetRoomAnswer
回答者権限をリセット（status: FINISHED）

### verifyRoomPassword (`app/room/[id]/access-action.ts`)
パスワード付きルームのパスワードを検証し、正しければ署名付きhttpOnly Cookie(`room_access`)を発行する。パスワード未設定のルームは常に成功

### 入室アクセス確認(`roomId` を受ける全Server Action共通)
`app/room/[id]/action.ts` / `answer/action.ts` / `drawing/action.ts` の `roomId` を受ける関数は、先頭で `requireRoomAccess(roomId)` を呼ぶ。
パスワード付きルームで入室Cookieがなければ例外を投げる(page は `isRoomAccessible` で判定して何も返さない)

---

### setStatusRoom
ルームのステータスを変更（WATING/DRAWING/ANSWERING/FINISHED/RESETTING）

### getInfoRoom
ルームの全情報を取得

### resetRoomSettings
ルーム設定を初期化（お題再取得＋描画データ削除＋回答者リセット）

### resetRoomAnswer
回答者権限をリセット（status: FINISHED）