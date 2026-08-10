# TOP画面 機能追加 実装計画（名前登録・ルーム作成・ルーム検索・ルーム選択）

作成日: 2026-08-10（初版）
更新日: 2026-08-10（ルーム作成機能を追加、検索機能をモーダルから常時表示セクションに変更）
更新日: 2026-08-11（ルーム作成を常時表示セクションからモーダルに戻し、「ルームをさがす」セクション右上の＋ボタンから開く方式に変更。実装済みのTOP画面に対する変更）
対象ファイル: `components/pages/Top.tsx`

> 更新内容（2026-08-11）: 「ルームをつくる」は常時表示のCardセクション（`RoomCreateSection`）
> をやめ、「ルームをさがす」セクション（`RoomSearchSection`）のヘッダー右上に配置した
> ＋アイコンボタンを押下したときだけ表示するモーダルに変更する。ルーム検索セクション自体は
> 引き続き常時表示のまま変更しない。

> 更新内容（2026-08-10）: 当初は「ルーム検索」をモーダル（`RoomSearchModal`）として計画していたが、
> 「ルーム作成」も含めてモーダルを使わず、TOP画面に常時表示される専用セクションとして
> 配置する方針に変更した。

## 1. 目的

TOP画面（`/`）から、ロビーを経由せずに以下ができるようにする。

- ユーザー名の登録・変更
- ルームの作成
- 条件（作成日付・作成者名・ルーム名）によるルーム検索（10件区切りのページネーション）
- 検索結果から任意のルームを選んでそのまま入室

## 2. 対象範囲

- 変更するのは `components/pages/Top.tsx` と、そこから新規に呼び出すコンポーネント／サーバーアクションのみ。
- `components/pages/LobbyPage.tsx` および既存のモーダル群（`CreateRoomModal` / `SearchRoomModal` / `SetUserModal`）は変更しない。挙動・デザインの参考元として流用するのみ。
- ユーザー名登録のみ、既存の `SetUserModal`（初回強制入力用）をそのままimportして使う。ルーム作成・ルーム検索は新規にモーダルを使わない専用セクションとして実装する。

## 3. 機能要件

### 3.1 名前登録機能

LobbyPage.tsx で行っているユーザー名管理をそのままTOPに持ち込む。

- 初回アクセス時（`localStorage` にユーザー名が無い場合）は既存の `SetUserModal` を表示して入力を必須化する（ここだけはモーダルのまま流用。理由: 初回訪問時の強制入力という性質上、常時表示セクションにはなじまないため）。
- あわせて、Card内にインラインの「ユーザー名」入力欄を常設し、いつでも変更できるようにする（LobbyPageの `Card` + `Input` 部分と同一構成）。
- バリデーションは既存の `lib/user.ts` の `setUsernameSchema` / `validateUsername` をそのまま流用（1〜10文字、禁止文字チェック）。新規のバリデーションロジックは作らない。

### 3.2 ルーム作成機能（2026-08-11更新: モーダル方式に変更）

「ルームをつくる」は常時表示のセクションではなく、**「ルームをさがす」セクションのヘッダー右上に
配置する＋アイコンボタン**を押下したときだけ開くモーダルにする。入力項目・作成処理のロジック自体は
変更しない（表示方法のみの変更）。

- 配置
  - `RoomSearchSection` のカード内、見出し「ルームをさがす」と同じ行の右端に丸型の＋アイコンボタンを配置する（`react-icons/tb` の `TbPlus` を使用。アイコンのみのボタンは `AccessUser.tsx` の丸型アイコンボタンと同様のスタイルに合わせる）。
  - ボタン押下で `RoomCreateModal`（後述、`RoomCreateSection` をモーダル化したもの）を開く。
- 入力項目（変更なし）
  - ルーム名（Input、`lib/room.ts` の `setRoomSchema` でバリデーション）
  - 難易度・ジャンル（既存の `components/organisms/RoomSetting.tsx` をそのまま流用）
- 「作成」ボタン押下時の処理（変更なし、LobbyPageの `createRoom` 関数と同一ロジック）
  1. ユーザー名が未設定ならエラー表示して処理中断（「ルームを作成するにはユーザー名が必要です。」）
  2. `setRoomSchema` でルーム名バリデーション
  3. 既存の `createRoomByUsername`（`app/lobby/action.ts`）をそのまま呼び出す。**サーバーアクションの新規追加・変更は不要**
  4. 成功時は `historyLocalRoom().setLocalRoom(roomId)` を呼んだ上で `/room/[id]` へ遷移
  5. 失敗時はモーダル内にエラーメッセージを表示
- モーダル固有の追加挙動
  - 成功時、遷移前に `onClose()` を呼んでモーダルを閉じる（遷移自体で画面が変わるため必須ではないが、遷移失敗時に開いたままにならないよう明示的に閉じる）。
  - キャンセルボタン、モーダル外クリック、Escで閉じられるようにする（既存の `Modal` コンポーネントの標準動作をそのまま使う）。
  - 閉じたときに入力途中の内容（ルーム名・難易度・ジャンル）をクリアするか、次回開いたときに保持するかは実装時に決める（既存の `CreateRoomModal` はクリアしない動作のため、それに合わせて保持する方針とする）。

### 3.3 ルーム検索機能

TOP画面に常時表示される「ルームをさがす」セクションを追加し、以下の条件で `rooms` テーブルを検索する。

| 検索条件 | 入力UI | 検索方法 |
| --- | --- | --- |
| 作成日付 | `<input type="date">`（Input atomに `date` type を追加） | 指定日の00:00:00〜翌日00:00:00の範囲で `created_at` を絞り込み（単一日付の完全一致） |
| 作成者名 | Input（text） | `created_by_name` の部分一致（大文字小文字無視）。空欄なら条件から除外 |
| ルーム名 | Input（text） | `room_name` の部分一致（大文字小文字無視）。空欄なら条件から除外 |

- 3条件はすべて任意入力（AND条件）。すべて未入力の場合は全件を作成日時の降順で返す。
- 1ページ10件固定（オフセットページネーション）。「前へ／次へ」ボタンと現在ページ番号を表示。
- 検索は「検索」ボタン押下時に実行（入力の都度は検索しない）。条件変更後は1ページ目から検索し直す。
- 検索結果はセクション内にインラインでリスト表示する（別画面・モーダルには遷移しない）。

`app/lobby/action.ts` の `getRoomByPageSearch` は既に本計画の内容で実装済み（`RoomSearchFilters` による日付・作成者名・ルーム名のAND条件検索、`PAGE_SIZE = 10` 固定）。**追加のサーバーアクション変更は不要**で、このセクションからそのまま呼び出す。

### 3.4 ルーム選択機能

- 検索結果の各ルームは、LobbyPage の「自分がつくったルーム」一覧と同じカードデザイン（角の三角形・ルーム名・short_id・作成者・作成日時）で表示する。
- カードをクリックすると、LobbyPageの `handleIntoRoom` と同じ処理で入室する。
  - ユーザー名が未設定の場合はエラーメッセージを表示して入室させない（「ルームに参加するにはユーザー名が必要です」）。
  - `historyLocalRoom` の `setLocalRoom` で最終アクセスルームとして記録した上で `/room/[id]` に遷移する。

## 4. サーバーアクション

新規追加・変更ともに不要。`app/lobby/action.ts` の既存関数をそのまま利用する。

- `createRoomByUsername` … ルーム作成（3.2で使用）
- `getRoomByPageSearch` … 条件検索＋ページネーション（3.3で使用、実装済み）

## 5. コンポーネント構成（2026-08-11更新）

```
components/pages/Top.tsx                        … 変更（ユーザー名Card・RoomSearchSectionの組み込み。RoomCreateSectionの直接配置は廃止）
components/organisms/top/RoomCreateModal.tsx     … 新規（RoomCreateSectionをモーダル化したもの。isOpen/onCloseを持つ）
components/organisms/top/RoomCreateSection.tsx   … 削除（RoomCreateModalに置き換え）
components/organisms/top/RoomSearchSection.tsx   … 変更（ヘッダー右上に＋ボタンを追加し、RoomCreateModalの開閉を自己管理する。userIdをpropsに追加）
components/organisms/lobby/SetUserModal.tsx      … 変更なし、初回名前登録のみそのままimportして流用
components/organisms/lobby/CreateRoomModal.tsx   … 変更なし（LobbyPage用として維持、TOPでは使わない）
components/organisms/lobby/SearchRoomModal.tsx   … 変更なし（LobbyPage用として維持、TOPでは使わない）
components/atoms/Input.tsx                       … 変更なし（既に "date" type 対応済み）
```

- `RoomCreateModal` は `RoomCreateSection` の中身（Input・RoomSetting・Buttonの並び）をそのまま流用し、外側のラッパーだけ `<Card>` から `<Modal isOpen={isOpen} onClose={onClose}>` に差し替える。内部のstate・バリデーション・`createRoomByUsername`呼び出しロジックは変更しない。
- ＋ボタンと `RoomCreateModal` の開閉状態（`isCreateModalOpen`）は `RoomSearchSection` が自己所有する（Top.tsxには持たせない）。理由: ＋ボタンが視覚的に検索セクションの一部として配置されるため、トリガーとモーダルを同じコンポーネントに閉じ込めた方が構成がシンプルになる。
- 新しいCSS/デザインは追加せず、既存の `Card` / `Button` / `Input` / `Modal` atomsとLobbyPageのルームカードのクラス構成をそのまま使う。＋ボタンのみ、`AccessUser.tsx` の丸型アイコンボタンのスタイルを踏襲した新規の小さいボタンになる。

## 6. Top.tsx / RoomSearchSection の構成（2026-08-11更新）

```tsx
// components/pages/Top.tsx（変更点のみ）
<Card>{/* ユーザー名入力（LobbyPageと同一構成、変更なし） */}</Card>
<RoomSearchSection user={user} userId={userId} setNameError={setNameError} />
{isSetUserModal && <SetUserModal ... />}
```

```tsx
// components/organisms/top/RoomSearchSection.tsx（追加分のみ）
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

// カードヘッダー部分
<div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-semibold text-gray-700">ルームをさがす</h2>
  <button onClick={() => {
    if (!user) { setNameError("ルームを作成するにはユーザー名が必要です。"); return; }
    setIsCreateModalOpen(true);
  }}>
    <TbPlus size={22} />
  </button>
</div>

{isCreateModalOpen && (
  <RoomCreateModal
    isOpen={isCreateModalOpen}
    onClose={() => setIsCreateModalOpen(false)}
    user={user}
    userId={userId}
    setNameError={setNameError}
  />
)}
```

`nameError` はユーザー名Card内に表示する共通のエラーメッセージ欄として、検索・作成どちらからも `setNameError` 経由でセットできるようにする（LobbyPageと同じUXパターン、変更なし）。

## 7. バリデーション・エッジケース

- ルーム作成: ルーム名は1〜10文字・禁止文字チェック（`setRoomSchema`）。ユーザー名未設定時は作成不可。
- ルーム検索: ルーム名・作成者名の入力は禁止文字チェックのみ行う（10文字超も検索条件としてはそのままcontains検索に使用し、作成時のような文字数エラー表示は行わない）。日付未選択時はフィルタ条件から除外（全期間対象）。
- 検索結果0件時は「該当するルームが見つかりません」を、LobbyPageの空状態表示（`TbGhost2` アイコン＋グレーテキスト）と同じ見た目で表示する。
- ページ送り時、範囲外（`page < 1` または `page > totalPages`）への遷移はボタンのdisabledで防止する。
- ルーム作成・ルーム選択（入室）はどちらもユーザー名必須。未設定の場合はユーザー名Card付近にエラーメッセージを表示し、処理を中断する（LobbyPageと同じ挙動）。

## 8. 実装タスク一覧（初版・2026-08-10時点、実施済み）

1. ~~`components/atoms/Input.tsx`: `type` の型に `"date"` を追加~~ 実施済み
2. ~~`components/organisms/top/RoomCreateSection.tsx` を新規作成~~ 実施済み（本更新で `RoomCreateModal.tsx` に置き換え）
3. ~~`components/organisms/top/RoomSearchSection.tsx` を新規作成~~ 実施済み（本更新で＋ボタン・モーダル組み込みを追加）
4. ~~`components/pages/Top.tsx`: ユーザー名Card・`SetUserModal`・`RoomCreateSection`・`RoomSearchSection` の組み込み~~ 実施済み
5. ~~動作確認~~ 実施済み

## 8-2. 実装タスク一覧（2026-08-11追加分）

1. `components/organisms/top/RoomCreateSection.tsx` の中身を移植し `components/organisms/top/RoomCreateModal.tsx` を新規作成
   - 外側ラッパーを `<Card>` → `<Modal isOpen={isOpen} onClose={onClose}>` に変更
   - Props に `isOpen: boolean` / `onClose: () => void` を追加（`user` / `userId` / `setNameError` は既存のまま）
   - 作成成功時、`router.push` の前に `onClose()` を呼ぶ
   - キャンセルボタンでも `onClose()` を呼ぶ（`CreateRoomModal` の「キャンセル」ボタンと同じ挙動）
2. `components/organisms/top/RoomCreateSection.tsx` を削除
3. `components/organisms/top/RoomSearchSection.tsx` を変更
   - Props に `userId: string` を追加
   - カード見出し「ルームをさがす」の行を `flex justify-between` にし、右端に `TbPlus` の丸型アイコンボタンを追加
   - ＋ボタン押下時、`user` が未設定なら `setNameError` でエラー表示して処理中断（既存のルーム作成・検索と同じユーザー名必須ルール）
   - `isCreateModalOpen` stateを追加し、`RoomCreateModal` を条件レンダリングする
4. `components/pages/Top.tsx` を変更
   - `<RoomCreateSection ... />` の直接配置を削除
   - `<RoomSearchSection user={user} userId={userId} setNameError={setNameError} />` に `userId` を追加で渡す
5. 動作確認（`npm run dev` で実データに対して、＋ボタン押下→モーダル表示→ルーム作成→モーダルが閉じて遷移、の一連の流れと、検索・ページ送り・ルーム選択が引き続き問題なく動作することを確認）

## 9. 確認事項（回答待ち・前提）

以下はヒアリング済みの前提として実装を進める。

- 作成日付は単一日付の完全一致検索とする（期間指定はしない）。
- （2026-08-11時点）ルーム作成は「ルームをさがす」セクション右上の＋ボタンから開くモーダル方式とする。ルーム検索セクションは引き続き常時表示のまま変更しない。
- ユーザー名の初回登録のみ、既存の `SetUserModal` をそのまま流用する（性質上モーダルのままとする）。

追加で確認したい点があれば実装着手前にご連絡ください。
