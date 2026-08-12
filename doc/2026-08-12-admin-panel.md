# 管理者画面 実装計画

作成日: 2026-08-12
対象: `middleware.ts`（新規）、`app/admin/**`（新規）、`lib/prisma.ts`

## 1. 目的

運営が `m_user` / `drawings` / `history_drawings` / `rooms` / `theme` の内容を確認・削除・（themeのみ）追加できる、
アプリのナビゲーションからは一切リンクしない、URLを直接叩いてアクセスする管理者専用画面を追加する。
アクセス制御はアプリ内の認証（デバイスUUIDベースのユーザー識別）とは別に、ミドルウェアによる
Basic認証（ブラウザ標準のID/パスワードダイアログ）で行う。

## 2. 全体方針

### 2.1 アクセス経路

- URLはアプリ内のどこからもリンクしない。`app/admin/` 配下にNext.jsの通常ページとして実装し、
  `/admin`、`/admin/users`、`/admin/rooms`、`/admin/drawings`、`/admin/history-drawings`、`/admin/themes`
  に直接アクセスする形とする。
- 検索エンジンにインデックスされないよう `app/admin/**` の各 `page.tsx` に
  `export const metadata = { robots: { index: false, follow: false } }` を設定する
  （`public/robots.txt` は現状存在しないため、今回新規に作らず metadata 側で対応する）。

### 2.2 認証方式（Basic認証）

- ルート直下に `middleware.ts` を新規作成し、`matcher: ['/admin/:path*']` で `/admin` 配下のみを対象にする。
- `Authorization: Basic base64(user:pass)` ヘッダを検証し、一致しなければ
  `401` を `WWW-Authenticate: Basic realm="Admin"` ヘッダ付きで返す。これによりブラウザ標準のID/パスワード
  入力ダイアログが表示される（独自ログイン画面は作らない）。
- 認証情報は環境変数で管理する。`.env` に以下を追加する。
  - `ADMIN_BASIC_AUTH_USER`
  - `ADMIN_BASIC_AUTH_PASSWORD`
- 比較はミドルウェア（Edge runtime）内での単純な文字列一致で行う。Basic認証はそもそも平文に近い方式であり、
  用途も内部運用者向けの簡易ゲートのため、タイミングセーフ比較などの追加対策は今回は行わない
  （必要になった場合は将来的に `runtime = 'nodejs'` 指定 + `node:crypto` の `timingSafeEqual` に切り替える）。
- 本番運用が HTTPS 経由であることを前提とする（Basic認証は平文送信のため、HTTP運用の場合は別途検討が必要。
  デプロイ先はVercel想定のため通常は問題ない）。

### 2.3 データアクセス方針

- 既存の `lib/prisma.ts` の `prisma`（Client Extension適用済み）は、読み取り系操作に自動で
  `deleted_at: null` を注入する仕様になっている（[2026-08-12-soft-delete-deleted-at.md](2026-08-12-soft-delete-deleted-at.md) で導入済み・実装済み）。
  そのため管理画面の一覧でも今のままだと論理削除済みの行が一切見えず、`deleted_at` 列を表示しても
  常にnullにしかならない。
- 管理画面は「削除済みかどうかも含めて全件を確認できる」ことに意味があるため、`lib/prisma.ts` に
  ソフトデリートフィルタを適用しない読み取り専用クライアントを追加でexportする（例: `prismaAdminReadonly`、
  内部的には拡張前の `rawClient` をそのまま指す）。一覧表示（`findMany`）にのみこれを使い、
  削除の実行自体は必ず既存の拡張済み `prisma` を経由させる。
- 削除処理は既存の拡張済み `prisma` をそのまま使うだけでよい。
  - `prisma.room.delete` / `prisma.drawing.delete` / `prisma.historyDrawing.delete`（およびそれぞれの `deleteMany`）は
    既に物理削除ではなく `deleted_at` 更新への読み替えが実装済み。
  - `prisma.mUser.delete` / `deleteMany` は既に `Room`（作成者・回答者）/ `Drawing` / `Point` / `Subscription` /
    `HistoryDrawing` を同一トランザクションでまとめて論理削除するカスケード処理が実装済み
    （`lib/prisma.ts` の `cascadeSoftDeleteForUsers`）。
  - つまり要件にある「m_user削除時に紐づくデータも削除されるフック」は**実装済み**であり、
    管理画面側は単に `prisma.mUser.delete({ where: { id } })` を呼び出すサーバーアクションを
    用意するだけでよい。
- `Theme` は元々ソフトデリート対象外（マスタデータ）のため、追加・削除ともに通常の
  `prisma.theme.create` / `prisma.theme.delete`（物理削除）を使う。

## 3. ルーティング / ディレクトリ構成（案）

```
middleware.ts                          # Basic認証（/admin配下のみ）
app/admin/
  layout.tsx                           # 管理画面共通レイアウト（最低限のスタイルのみ）
  page.tsx                             # 各管理ページへのリンク一覧（index）
  users/
    page.tsx                           # m_user 一覧・削除
    actions.ts                         # deleteUser(id)
  rooms/
    page.tsx                           # rooms 一覧・削除
    actions.ts                         # deleteRoom(id)
  drawings/
    page.tsx                           # drawings 一覧・削除
    actions.ts                         # deleteDrawing(id)
  history-drawings/
    page.tsx                           # history_drawings 一覧・削除
    actions.ts                         # deleteHistoryDrawing(id)
  themes/
    page.tsx                           # theme 一覧（ジャンル別）・追加フォーム・削除
    actions.ts                         # createTheme(data) / deleteTheme(id)
```

- 一覧は Server Component で直接 `prismaAdminReadonly.<model>.findMany` を呼び出し、削除・追加は
  `'use server'` の Server Action + `<form action={...}>` で実装する（既存の `app/user/action.ts` などの
  パターンを踏襲）。JS無効でも動作する素朴なHTMLフォームを基本とする。
- 削除ボタンは誤操作防止のため、確認ダイアログ（`onSubmit` で `confirm()`）を出す小さなクライアント
  コンポーネント（例 `components/admin/ConfirmSubmitButton.tsx`）を1つ共通化して使い回す。

## 4. 各画面の仕様

### 4.1 `m_user`（`/admin/users`）

- 一覧: `id`, `username`, `created_at`, `updated_at`, `deleted_at` を全件テーブル表示（`deleted_at` が
  非nullの行は行全体をグレーアウトするなどして削除済みだと視覚的に分かるようにする）。
- 削除: 行ごとに削除ボタン。`prisma.mUser.delete({ where: { id } })` を呼び出す。
  → 既存実装により `Room` / `Drawing` / `Point` / `Subscription` / `HistoryDrawing` が自動で連動削除される。

### 4.2 `drawings` / `history_drawings`（`/admin/drawings`, `/admin/history-drawings`）

- 一覧: `id`, `room_id`, `user_id`, `element_count`, `theme`, `created_at`, `deleted_at` を表示。
  `canvas_data`（JSON）はそのまま表示すると1行が肥大化するため、`<details><summary>` で折りたたみ表示
  にする（「全カラム表示」の要件は満たしつつ視認性を確保）。
- 削除: 行ごとに削除ボタン。`prisma.drawing.delete` / `prisma.historyDrawing.delete` を呼び出す
  （既存実装によりソフトデリートとして処理される）。

### 4.3 `rooms`（`/admin/rooms`）

- 一覧: `id`, `short_id`, `status`, `current_theme`, `current_theme_id`, `answer_id`, `created_by_userId`,
  `room_name`, `level`, `genre`, `created_at`, `deleted_at` を全件表示。
- 削除: 行ごとに削除ボタン。`prisma.room.delete` を呼び出す（ソフトデリート）。
  ※ ルーム削除時に紐づく `drawings` / `history_drawings` を連動削除するかは要件に明記が無いため、
  今回は連動させない（3節「未確定事項」参照）。

### 4.4 `theme`（`/admin/themes`）

- 一覧: `genre` ごとにグルーピングして表示（ページ上部にジャンル選択タブ or `?genre=` クエリでの絞り込み）。
  各行は `id`, `theme`, `level`, `genre`, `kanji`, `katakana`, `furigana` を全件表示。
- 追加: `theme` / `level` / `genre` / `kanji` / `katakana` / `furigana` を入力するフォームを一覧上部に設置し、
  `prisma.theme.create` で追加する。
- 削除: 行ごとに削除ボタン。`Theme` はソフトデリート対象外なので `prisma.theme.delete`（物理削除）を使う。

## 5. 実装タスク一覧

1. `.env` / `.env.example`（無ければ新規作成を検討）に `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASSWORD` を追加
2. `middleware.ts` を新規作成し、`/admin/:path*` に対するBasic認証を実装
3. `lib/prisma.ts` にソフトデリートフィルタなしの読み取り専用クライアントを追加export
4. `components/admin/ConfirmSubmitButton.tsx`（共通の削除確認ボタン）を作成
5. `app/admin/layout.tsx` / `app/admin/page.tsx`（index）を作成
6. `app/admin/users/`（一覧・削除）を作成
7. `app/admin/rooms/`（一覧・削除）を作成
8. `app/admin/drawings/`（一覧・削除）を作成
9. `app/admin/history-drawings/`（一覧・削除）を作成
10. `app/admin/themes/`（一覧・ジャンル絞り込み・追加・削除）を作成
11. 各 `page.tsx` に `robots: { index: false, follow: false }` のmetadataを設定
12. ローカルで動作確認
    - Basic認証: 誤った資格情報で401になること、正しい資格情報でブラウザの認証ダイアログを突破できること
    - `/admin` 配下以外（トップページ等）が今まで通りBasic認証を求められないこと
    - 各一覧が全カラム・全件（削除済み含む）表示されること
    - `m_user` 削除時に紐づく `rooms` / `drawings` / `points` / `subscriptions` / `history_drawings` が
      連動して `deleted_at` 更新されること
    - `theme` の追加・削除が正しく反映されること

## 6. 未確定事項（実装着手前に確認したい点）

- **一覧の件数規模とページネーションの要否**: 現状のデータ量が不明。件数次第では `findMany` に
  `take`/`skip` を用いたページネーションが必要になる。
- **rooms削除時、紐づく drawings / history_drawings を連動削除するか**: 要件には明記が無いため今回は
  連動させない前提だが、運用上ゴミデータになる懸念があれば `room` にも `mUser` と同様のカスケード処理を
  追加するかを確認したい。
- **Basic認証の資格情報の運用方法**: 環境変数1組（全管理者共通）で問題ないか、複数管理者を想定して
  ユーザーごとに分けたいか。
- **物理削除・復元機能の要否**: 今回は要件通りソフトデリート（theme除く）のみとし、復元UIや完全削除UIは
  スコープ外とする想定でよいか。
- **canvas_data の表示形式**: 折りたたみ表示（生JSON）で十分か、簡易的な図形サマリ（要素数・種類の内訳）
  程度に加工した方がよいか。
