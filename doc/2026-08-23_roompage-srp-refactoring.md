# RoomPage.tsx SRP準拠リファクタリング 実装計画

作成日: 2026-08-23
対象: `components/pages/RoomPage.tsx`、新規 `components/organisms/room/*`、
新規 `hooks/RoomPage/useRoom.ts`、`lib/room.ts`（ランク計算関数の追加）

## 1. 目的

`components/pages/RoomPage.tsx`（318行）に、ルームID表示・コピー、参加者スコア
登録、ランキング計算、描く人／回答者への案内表示、回答者確定フロー、お題変更
（ルーム設定）フローなど、変更理由の異なる複数の責務が同居している。

先行事例である [DrawPage.tsx のSRPリファクタリング](2026-08-22-drawpage-srp-refactoring.md)
と同じ方針・ディレクトリ構成を踏襲し、`RoomPage.tsx` を「状態の受け渡しと
コンポーネント組み立てに専念するコンテナ」に整理する。

## 2. 現状の責務分析

| 行 | 内容 |
|---|---|
| 39-47 | `handleCheckAnswer`: 回答者確定済みか判定し、確定済みなら回答ページへ遷移、未確定なら確認モーダルを開く |
| 48-58 | `handleSetAnswer`: 自分を回答者として登録し回答ページへ遷移 |
| 60-63 | `handleChangeRoomTheme`: お題候補（3件）を取得 |
| 65-76 | `handleIdCopy`: ルームIDのクリップボードコピーとトースト表示 |
| 78-84 | 参加者スコア登録の副作用（`useEffect`） |
| 86-100 | スコアからの同着順位計算（`ranks` の `reduce`） |
| 105-112 | 戻るリンク・チュートリアルヘルプボタン |
| 115-128 | ルーム名・ルームID表示＋コピーボタン（`tutorial-room-info`） |
| 129-131 | ステータスバー表示 |
| 133-138 | 「お題を変更する」ボタン（`roomSetting` モーダルを開く） |
| 142-174 | 「描く人」への案内カード |
| 176-202 | 「回答者」への案内カード（`handleCheckAnswer` 呼び出し） |
| 208-243 | スコアボード（ランキング表示） |
| 244-266 | 回答者確定の確認モーダル（`はい` 押下時に複数の副作用呼び出しが直書き） |
| 267-315 | ルーム設定モーダル（お題候補選択＋ `RoomSetting` フォーム） |

## 3. 方針（SOLID適用ポイント）

- **SRP**: 「ルームID表示」「描く人／回答者への案内」「スコアボード」
  「回答者確定モーダル」「ルーム設定モーダル」をそれぞれ独立したコンポーネントに
  分割する。状態管理・サーバーアクション呼び出しは `hooks/RoomPage/useRoom.ts`
  に集約し、`RoomPage.tsx` はコンポジションのみを担当する。
- **OCP**: 同着順位の計算ロジックを `lib/room.ts` の純粋関数 `calculateRanks`
  として切り出す。並び替えルールや同着判定条件を変更する際に `ScoreBoard`
  本体のJSXに触れずに済む。
- **DIP（緩やかに）**: 現状 `AnswerConfirmModal`（回答確認モーダル）や
  `RoomSettingModal`（お題選択ボタン）が `resetDrawingData` / `setdbAnswer*` /
  `setRoomTheme` などのサーバーアクションをJSX内で直接呼び出しており、
  ビュー（モーダル）がインフラ（サーバーアクション）に直接依存している。
  これらを `useRoom` フック側の関数（`confirmAnswerer` / `selectTheme` など）
  にまとめ、モーダル側は単一のコールバックpropのみに依存する形に改める。

既存の `organisms/answer`・`organisms/draw`・`organisms/lobby` のようなfeature別
サブフォルダに合わせ、`components/organisms/room/` を新設する。

## 4. 分割設計

### 4.1 新規ファイル一覧

| ファイル | 責務 |
|---|---|
| `components/organisms/room/RoomIdCard.tsx` | ルーム名・ルームID表示、コピーボタン（アニメーション込み） |
| `components/organisms/room/DrawerGuideCard.tsx` | 「描く人」への案内カード（アニメーション含む静的表示＋描画ページへのリンク） |
| `components/organisms/room/AnswererGuideCard.tsx` | 「回答者」への案内カード（確定状態バッジ＋回答ページへの導線） |
| `components/organisms/room/ScoreBoard.tsx` | スコア一覧表示（`lib/room.ts` の `calculateRanks` を利用） |
| `components/organisms/room/AnswerConfirmModal.tsx` | 回答者確定の確認モーダル（`onConfirm` コールバックのみに依存） |
| `components/organisms/room/RoomSettingModal.tsx` | お題候補選択＋ `RoomSetting` フォームを内包する設定モーダル |
| `hooks/RoomPage/useRoom.ts` | ルームIDコピー状態、参加者登録副作用、回答者確定フロー、お題変更フローなど本ページ固有のロジック一式 |
| `lib/room.ts`（既存ファイルに追加） | `calculateRanks(scores)`: 同着順位を計算する純粋関数 |

### 4.2 各コンポーネントのprops設計（案）

```tsx
// RoomIdCard.tsx
type Props = {
  title: string;
  shortId: string;
};
// isCopy状態とhandleIdCopyはコンポーネント内部のuseStateに閉じ込める
// （外部からの制御が不要なUI状態のため）

// DrawerGuideCard.tsx
type Props = {
  roomId: string;
};

// AnswererGuideCard.tsx
type Props = {
  answerId: string;
  onCheckAnswer: () => void;
};

// ScoreBoard.tsx
type Props = {
  scores: ScoreEntry[]; // 現状anyだが、型を明示化する（6章参照）
};

// AnswerConfirmModal.tsx
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // resetDrawingData + handleSetAnswer + setdbAnswerInput
                          // + setdbAnswerResult + setStatusRoom をまとめて呼ぶ
};

// RoomSettingModal.tsx
type Props = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomSetting: RoomSettingType;
  setRoomSetting: React.Dispatch<React.SetStateAction<RoomSettingType>>;
  threeThemes: Theme[];
  onSearchTheme: () => void; // handleChangeRoomTheme
  onSelectTheme: (themeId: string) => void; // setRoomTheme呼び出し+トースト+close
};
```

### 4.3 `hooks/RoomPage/useRoom.ts` の設計（案）

```tsx
export default function useRoom(roomId: string) {
  const router = useRouter();
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [roomSetting, setRoomSetting] = useState<RoomSettingType>({ level: 'normal', genre: 'ランダム' });
  const [threeThemes, setThreeThemes] = useState<Theme[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('drawing_app_user_id');
    const userName = localStorage.getItem('drawing_app_username');
    if (!userId || !userName) return;
    registerParticipantScore(roomId, userId, userName);
  }, [roomId]);

  const handleCheckAnswer = async () => {
    const { success, data: isAnswerer } = await isCheckAnswer(roomId);
    if (success && isAnswerer) {
      router.push(`/room/${roomId}/answer`);
    } else {
      setIsAnswerModalOpen(true);
    }
  };

  const confirmAnswerer = async () => {
    const userId = localStorage.getItem('drawing_app_user_id');
    if (!userId) return;
    resetDrawingData(roomId);
    await setdbAnswer(roomId, userId);
    setdbAnswerInput(roomId, '');
    setdbAnswerResult(roomId, '');
    setStatusRoom(roomId, 'DRAWING');
    setIsAnswerModalOpen(false);
    router.push(`/room/${roomId}/answer`);
  };

  const handleSearchTheme = async () => {
    const data = await getThreeThemes({ level: roomSetting.level, genre: roomSetting.genre });
    setThreeThemes(data.data || []);
  };

  const selectTheme = async (themeId: string, onClose: () => void) => {
    const result = await setRoomTheme(roomId, roomSetting, themeId);
    if (!result.success) {
      showToast('お題の変更に失敗しました', { variant: 'error' });
      return;
    }
    showToast('お題を変更しました', { variant: 'success' });
    onClose();
  };

  return {
    isAnswerModalOpen, setIsAnswerModalOpen,
    roomSetting, setRoomSetting,
    threeThemes,
    handleCheckAnswer, confirmAnswerer,
    handleSearchTheme, selectTheme,
  };
}
```

`isCopy` はUI専用の一時状態であり他コンポーネントから参照されないため、
`useRoom` には含めず `RoomIdCard.tsx` 内部の `useState` に閉じ込める
（DrawPageリファクタリング時の `SaveControl` の `isSaveOpen` と同じ考え方）。

### 4.4 RoomPage.tsx の最終形（イメージ）

```tsx
export default function RoomPage({ title, shortId, scores }: RoomPageProps) {
  const params = useParams();
  const roomId = params.id as string;
  const { open, modalType, close } = useModalContext();
  const { status, answerId } = useStatus(roomId);
  useTutorial({ key: 'room', steps: roomTutorialSteps });

  const room = useRoom(roomId);

  return (
    <div>
      <Link href="/" className="...">
        <TbArrowLeft size="2em" />
      </Link>
      <TutorialHelpButton id="tutorial-room-reset" tutorialKey="room" className="..." />
      <div className="w-full p-8">
        <div className="max-w-lg mx-auto">
          <RoomIdCard title={title} shortId={shortId} />
          <StatusBar status={status} />
          <AccessUser roomId={roomId} />
          <Card className="mb-4 pb-1 bg-gray-100 rounded-3xl">
            <Button onClick={() => open('roomSetting')} value="お題を変更する" className="mb-4 w-full" />
            <div className="text-center">
              <IconContext.Provider value={{ size: '1.5em' }}>
                <DrawerGuideCard roomId={roomId} />
                <AnswererGuideCard answerId={answerId} onCheckAnswer={room.handleCheckAnswer} />
              </IconContext.Provider>
            </div>
          </Card>
        </div>
      </div>
      <ScoreBoard scores={scores} />
      <AnswerConfirmModal
        isOpen={room.isAnswerModalOpen}
        onClose={() => room.setIsAnswerModalOpen(false)}
        onConfirm={room.confirmAnswerer}
      />
      {modalType === 'roomSetting' && (
        <RoomSettingModal
          isOpen
          onClose={close}
          roomId={roomId}
          roomSetting={room.roomSetting}
          setRoomSetting={room.setRoomSetting}
          threeThemes={room.threeThemes}
          onSearchTheme={room.handleSearchTheme}
          onSelectTheme={(themeId) => room.selectTheme(themeId, close)}
        />
      )}
    </div>
  );
}
```

## 5. 実装タスク一覧

1. `lib/room.ts` に `calculateRanks(scores: ScoreEntry[]): number[]` を追加し、
   `RoomPage.tsx` の `ranks` の `reduce` ロジックを移植
2. `type/roomType.ts`（または適切な型定義ファイル）に `ScoreEntry` 型を追加し、
   `RoomPage` の `scores: any[]` を型付けする
3. `hooks/RoomPage/useRoom.ts` を新規作成し、参加者登録副作用・回答者確定フロー・
   お題変更フローを移植
4. `components/organisms/room/` 配下に以下を新規作成し、該当JSXを移植
   - `RoomIdCard.tsx`
   - `DrawerGuideCard.tsx`
   - `AnswererGuideCard.tsx`
   - `ScoreBoard.tsx`（`calculateRanks` を利用）
   - `AnswerConfirmModal.tsx`
   - `RoomSettingModal.tsx`
5. `RoomPage.tsx` を上記コンポーネントの組み立てのみに書き換える
6. 動作確認
   - ルームID表示・コピー（トースト表示・アイコン切り替え）が従来通り動作すること
   - 参加者スコアの自動登録が従来通り行われること
   - 「お題を描く」リンク、「回答ページへ」ボタン（確定済み／未確定の分岐）が
     従来通り動作すること
   - 回答者確定モーダルの「はい」押下時、`resetDrawingData` → 回答者登録 →
     `setdbAnswerInput`/`setdbAnswerResult` → `setStatusRoom('DRAWING')` →
     回答ページ遷移の順序が従来通り維持されること
   - スコアボードの同着順位表示・王冠アイコン表示が従来通りであること
   - ルーム設定モーダルのお題候補取得・選択・トースト表示が従来通り動作すること
   - `npx tsc --noEmit` / `npx eslint` の結果がリファクタリング前と同数（悪化なし）
     であること

## 6. 検討事項（ヒアリング候補）

- `scores: any[]` の型付け（`ScoreEntry` 型新設）を本計画のスコープに含めるか。
  既存の型の緩さに起因する副作用箇所ではあるが、SRPリファクタリングの本質的な
  スコープではないため、着手前に対応要否を確認したい。
- `RoomIdCard` のコピー成功トースト・アニメーションの持ち時間（2秒）などの
  マジックナンバーを定数化するか（本計画では現状踏襲とし対象外とする想定）。

## 7. 実装結果

上記方針で実装完了。

- `lib/room.ts` に `calculateRanks` を追加し、`RoomPage.tsx` の `ranks` 計算ロジックを移植
- `type/roomType.ts` に `ScoreEntry`（`Prisma.PointGetPayload<{ include: { user: true } }>`）を
  追加し、`scores: any[]` を型付け
- `hooks/RoomPage/useRoom.ts` を新規作成し、参加者登録副作用・回答者確定フロー
  （`handleCheckAnswer` / `handleSetAnswer` / `confirmAnswerer`）・お題変更フロー
  （`handleSearchTheme` / `selectTheme`）を移植。既存の副作用の発火順序・
  await有無（`confirmAnswerer` 内で各サーバーアクションをawaitせず並行発火する点を含む）は
  元の実装のまま維持
- `components/organisms/room/` 配下に `RoomIdCard`／`DrawerGuideCard`／
  `AnswererGuideCard`／`ScoreBoard`／`AnswerConfirmModal`／`RoomSettingModal`
  を新規作成。`RoomSettingModal` は `roomSetting` の現在値をJSX内で参照しないため
  props設計案から `roomSetting` を除外（`setRoomSetting` のみ受け取る）
- `components/pages/RoomPage.tsx` を上記コンポーネントの組み立てのみに書き換え
- `npx tsc --noEmit` でエラーなしを確認。`npx eslint`（変更ファイル個別 / プロジェクト
  全体の両方）でも新規のエラー・警告は発生せず、既存の警告（他ファイル由来）のみ
  であることを確認済み
