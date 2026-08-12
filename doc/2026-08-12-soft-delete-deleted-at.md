# ソフトデリート (deleted_at) 実装計画

作成日: 2026-08-12
対象: `prisma/schema.prisma` 全モデル、`lib/prisma.ts`、各 `app/**/action.ts` / `app/api/**/route.ts`

## 1. 目的

- 全テーブルに `deleted_at` カラムを追加する
- `deleted_at` が設定されているレコードは、通常の参照系クエリでは「存在しないもの」として自動的に除外されるようにする
- 物理削除 (`DELETE`) ではなく、`deleted_at` に削除日時をセットする論理削除 (ソフトデリート) を行えるようにする

## 2. 対象モデル

`prisma/schema.prisma` に定義されている以下8モデル全てが対象。

| モデル名 | テーブル名 (`@@map`) |
|---|---|
| MUser | m_user |
| Room | rooms |
| Drawing | drawings |
| Theme | theme |
| Point | points |
| AnswerInput | answer_inputs |
| Subscription | subscriptions |
| HistoryDrawing | history_drawings |

## 3. 全体方針

`grep` で調査したところ、`prisma.<model>.findMany / findUnique / findFirst / create / update / upsert / delete / deleteMany` の呼び出しはリポジトリ全体（`app/user`, `app/room`, `app/lobby`, `app/museum`, `app/api/rooms` 配下）で50箇所以上あり、すべての呼び出し箇所に個別に `where: { deleted_at: null }` を書き足す方式は書き漏れのリスクが高く現実的ではない。

そのため、[Prisma Client Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query) の `query` コンポーネントを使い、`lib/prisma.ts` で生成する Prisma Client 自体に以下の共通挙動を仕込む方式を採る。

1. 読み取り系操作 (`findMany` / `findFirst` / `findUnique` / `count` / `aggregate` / `groupBy`) には自動的に `deleted_at: null` の条件を注入する
2. 削除系操作 (`delete` / `deleteMany`) は物理削除を行わず、`update` / `updateMany` に読み替えて `deleted_at: 現在時刻` をセットする

これにより、各 `action.ts` / `route.ts` 側のコードは一切変更せずに、ソフトデリートの除外・実行を横断的に適用できる（対象となる読み取り呼び出しは `app/lobby`, `app/room`, `app/museum`, `app/api/rooms` 配下だけで30箇所以上あることを確認済み）。

なお、Prisma v6まであった `$use` ミドルウェアはv7では廃止されているため、このプロジェクト（Prisma `^7.9.1`）で横断的な処理を入れる手段は実質 `$extends`（Client Extensions）一択となる。

## 4. スキーマ変更

各モデルに以下のカラムを追加する（既存の `created_at` / `updated_at` と同じ `@db.Timestamptz(6)` 型に合わせる）。

```prisma
deleted_at DateTime? @db.Timestamptz(6)
```

参照頻度の高いテーブル（`Room`, `Drawing`, `HistoryDrawing`, `Point`）は一覧取得系クエリが多いため、`@@index([deleted_at])` もしくは既存の検索条件と組み合わせた複合indexの追加を検討する（例: `Drawing` なら `@@index([room_id, deleted_at])`）。

## 5. マイグレーション適用方法

`prisma/migrations` ディレクトリはまだ存在せず、現状は `prisma db push`（マイグレーション履歴を持たない）運用になっている。ただし `prisma.config.ts` には `migrations: { path: 'prisma/migrations' }` の設定がすでに用意されており、いつでも `prisma migrate dev` に切り替えられる状態になっている（＝履歴管理の準備自体は済んでいるが、まだ使われていない）。

今回はDBスキーマ変更としては最初の一歩でもあるため、
- 現状踏襲: `npx prisma db push` でDBに反映する
- 履歴管理開始: `npx prisma migrate dev --name add_deleted_at_to_all_models` でマイグレーション履歴を今回から開始する

のどちらにするかを後述の未確定事項として確認する。

## 6. 実装詳細（Prisma Client Extension）

`lib/prisma.ts` を Client Extension 対応に変更する。イメージ:

```ts
import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const READ_OPS = ['findMany', 'findFirst', 'aggregate', 'count', 'groupBy'] as const;

function createSoftDeleteClient() {
  return new PrismaClient({ adapter }).$extends({
    name: 'soft-delete',
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          // 読み取り系: 未削除のみを対象にする
          if (READ_OPS.includes(operation as (typeof READ_OPS)[number])) {
            args.where = { ...args.where, deleted_at: null };
            return query(args);
          }

          // findUnique はユニークキー以外の条件を持てないため findFirst 相当に変換する
          if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
            return query({ ...args, where: { ...args.where, deleted_at: null } });
            // 実装時は findFirst への operation 差し替えが必要（下記「注意点」参照）
          }

          // 削除系: 物理削除ではなく deleted_at を更新する論理削除に読み替える
          if (operation === 'delete') {
            return query({ ...args, data: { deleted_at: new Date() } }); // 実際は update operation への差し替えが必要
          }
          if (operation === 'deleteMany') {
            return query({ ...args, data: { deleted_at: new Date() } }); // 同上
          }

          return query(args);
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createSoftDeleteClient> };

export const prisma = globalForPrisma.prisma || createSoftDeleteClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

※ 上記は方針を示すための概略コードであり、`operation` の差し替え（`delete`→`update`、`findUnique`→`findFirst`）は Prisma Client Extensions の実際のAPI仕様に沿って実装時に検証・調整する。

## 7. 既存の削除系呼び出しへの影響

現状、物理削除 (`delete` / `deleteMany`) を行っている箇所は以下の3箇所のみ。

- [app/room/[id]/action.ts:100](app/room/%5Bid%5D/action.ts) — `prisma.drawing.deleteMany({ where: { room_id } })`
- [app/room/[id]/action.ts:254](app/room/%5Bid%5D/action.ts) — `prisma.drawing.deleteMany({ where: { room_id } })`
- [app/room/[id]/answer/action.ts:297](app/room/%5Bid%5D/answer/action.ts) — `prisma.subscription.deleteMany({ where: { user_id } })`

Extension導入後はコード変更なしにこれらは自動的にソフトデリート（`deleted_at` 更新）に置き換わる。物理削除ではなくなるため、DBに行は残り続ける点を踏まえて挙動として問題ないか確認する。

## 8. 注意点・設計上の論点（実装前に検討が必要）

- **Subscription の `user_id` ユニーク制約との競合**
  `Subscription.user_id` は `@unique` かつ `upsert`（[app/room/[id]/answer/action.ts:270](app/room/%5Bid%5D/answer/action.ts)）で使われている。対象行が論理削除済みでも物理的にはDBに残るため、同じ `user_id` で再度 `upsert` すると「update」経路に入り、`deleted_at` は自動ではクリアされない。その結果、更新したはずのレコードが引き続き「存在しないもの」として扱われ続ける不整合が起きうる。

- **upsert 全般への影響**
  同様の問題は他の `upsert` 呼び出しにも当てはまる。
  - `MUser.upsert`（[app/user/action.ts:13](app/user/action.ts)）
  - `AnswerInput.upsert` ×2（[app/room/[id]/answer/action.ts:217, 242](app/room/%5Bid%5D/answer/action.ts)）
  - `Subscription.upsert`（[app/room/[id]/answer/action.ts:270](app/room/%5Bid%5D/answer/action.ts)）

  対応方針として、`upsert` の `update` データに `deleted_at: null` を明示的に含めて「更新時に自動的に復活させる」挙動にするか、更新前に論理削除状態を判定して挙動を分けるかを決める必要がある。

- **MUser 論理削除時のカスケードが効かなくなる**
  `Room.creator/answerer`、`Drawing.user`、`Point.user`、`Subscription.user`、`HistoryDrawing.user` にはDBの外部キーレベルで `onDelete: Cascade` / `SetNull` が設定されているが、これは物理削除 (`DELETE`) にのみ有効。ソフトデリートは内部的に `UPDATE` になるため、`MUser` を論理削除しても関連レコードは自動連動しない。退会時に関連データもまとめて非表示にしたい場合は、拡張機能内かサーバーアクション側でトランザクションを組み、関連モデルの `deleted_at` も明示的に更新する実装が別途必要。

- **削除済みレコードを意図的に取得したいケースへの対応（エスケープハッチ）**
  管理画面や復元機能のために、フィルタを無視して削除済みレコードを含めて取得できる経路が必要。案として、Extensionを適用しない生の `PrismaClient` を管理用途に別途エクスポートする、または呼び出し時に明示的なオプトアウト手段を用意する。

- **`findUnique` の内部変換によるクエリ最適化への影響**
  `deleted_at` フィルタを追加するために `findUnique` を `findFirst` 相当に変換すると、一意キーによるインデックスシークの効率がわずかに変わる可能性がある。`deleted_at` へのindex付与で軽減する。

- **Theme / AnswerInput にもソフトデリートが本当に必要か**
  `Theme`（お題マスタ）や `AnswerInput`（1ルームにつき1行の回答一時データ）は、ユーザーが直接「削除」する対象というよりマスタ／一時データに近い。全テーブル一律で `deleted_at` を追加する方針は理解しつつ、実際に論理削除運用が必要かは利用イメージを確認したい。

- **HistoryDrawing への書き込み経路がコードベース内に見当たらない**
  `app/museum/action.ts` に4箇所の `findMany` があるのみで、`HistoryDrawing` に対する `create` / `update` / `delete` 系の呼び出しがリポジトリ内に見つからなかった（別プロセスやDB直接操作で投入されている可能性がある）。読み取り側の自動フィルタは同様に適用できるが、書き込み経路が不明なため、ソフトデリート導入の影響範囲を完全に洗い出せていない可能性がある点に留意する。

- **既存の `onDelete: Cascade` / `SetNull` は現状どの操作からもトリガーされていない**
  調査の結果、`MUser` を物理削除する操作自体がコードベースに存在しない（退会機能は未実装）ため、現状これらのカスケードルールは実質的に使われていない。ただし将来的に退会機能を実装する際は、物理削除ではなく論理削除ベースで作ることになるため、本計画の「MUser論理削除時のカスケード」設計が直接影響する。

## 9. 実装タスク一覧

1. `prisma/schema.prisma` の全8モデルに `deleted_at` を追加し、必要に応じてindexを追加
2. `npx prisma db push` でDBに反映
3. `lib/prisma.ts` を Client Extension 対応に変更（読み取り系の自動フィルタ、削除系のソフトデリート化、削除済みレコードを取得するためのエスケープハッチ）
4. 既存の `upsert` 呼び出し4箇所（8節参照）について、論理削除済み行への復活挙動を実装
5. 既存の `deleteMany` 呼び出し3箇所（7節参照）が意図通りソフトデリートとして機能するか確認
6. `MUser` 論理削除時の関連データ連動方針を確定し、必要であれば実装
7. ローカルDBで動作確認
   - ロビー一覧・美術館ページなどの一覧系画面で、論理削除済みレコードが表示されないこと
   - 削除操作を行った際、DB上は `DELETE` ではなく `deleted_at` の `UPDATE` になっていること（実SQLログ等で確認）
   - `upsert` を伴う画面（ユーザー登録、回答入力、Push通知購読）で論理削除済み行への再登録が正しく動作すること
8. 必要であれば管理者向けの復元 (restore) / 完全削除用のAPIを追加

## 10. 未確定事項（実装着手前に確認したい点）

- マイグレーション方式は現状通り `prisma db push` でよいか、`prisma migrate dev` に切り替えて履歴管理を始めるか
- `Subscription.user_id` の `@unique` 制約と論理削除の競合をどう解決するか（upsert時に自動復活させる／その他の方式）
- `MUser` を論理削除した際、関連レコード（Room / Drawing / Point / Subscription / HistoryDrawing）も連動して非表示にするか
- `Theme`（お題マスタ）や `AnswerInput`（回答一時データ）にも本当にソフトデリートが必要か、それとも一部テーブルは対象外でよいか
- 削除済みレコードの復元・完全削除（物理削除）を行う管理画面やAPIが必要か、それとも今回はソフトデリートの実装のみで復元機能は将来対応とするか
