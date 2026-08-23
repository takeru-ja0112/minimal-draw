# DrawPage.tsx SRP準拠リファクタリング 実装計画

作成日: 2026-08-22
対象: `components/pages/DrawPage.tsx`、新規 `components/organisms/draw/*`、新規 `hooks/useIsMobile.ts`

## 1. 目的

`components/pages/DrawPage.tsx`（330行）に、お題表示・ツールバー・ツール選択・
描画キャンバス・保存フロー・各種モーダル・モバイル判定など、変更理由の異なる
複数の責務が同居している。単一責任の原則（SRP）に従ってビュー層を分割し、
`DrawPage.tsx` を「状態の受け渡しとコンポーネント組み立てに専念するコンテナ」
に整理する。

ロジック層（`hooks/DrawPage/handleDraw.ts` の `useDraw`）は既に分離済みのため、
本計画のスコープは **ビュー層（JSX）の分割** に限定する。

## 2. 現状の責務分析

| 行 | 内容 |
|---|---|
| 55-66 | モバイル判定・お題変更検知の副作用ロジック |
| 77-108 | お題・ふりがな表示、検索ボタン |
| 113-119 | Undo/Redo/リセットのツールバー |
| 121-168 | 描画ツール選択（データ定義とレンダリングが混在） |
| 169-232 | Konva描画キャンバス本体（Stage/Layer/図形描画） |
| 236-278 | 保存ボタン・保存確認モーダル・保存メッセージ |
| 280-291 | お題説明の初回モーダル |
| 293-323 | 回答締切モーダル（遷移ロジック込み） |
| 325-330 | お題変更通知モーダル |

## 3. 方針（SOLID適用ポイント）

- **SRP**: 各コンポーネントが「変更理由」を1つに限定する（お題表示／ツール操作／
  描画／保存／通知）よう分割する。`DrawPage` はコンポジションのみを担当する。
- **OCP**: `ToolSelector` が持つツール一覧（直線・円・長方形・消しゴム・移動）を
  配列定義として `constants/drawTools.tsx` に外出しする。ツール追加時に
  `ToolSelector` 本体のロジックを変更せずに済む。
- **DIP（緩やかに）**: 各organismは `useDraw` の戻り値をまるごと受け取らず、
  必要なpropsのみを受け取る設計にし、`useDraw` の内部実装変更の影響範囲を
  局所化する。

既存のディレクトリ構成（`atoms/molecules/organisms/pages`、
`organisms/answer`・`organisms/lobby`のようなfeature別サブフォルダ）に合わせ、
`components/organisms/draw/` を新設する。

## 4. 分割設計

### 4.1 新規ファイル一覧

| ファイル | 責務 |
|---|---|
| `components/organisms/draw/ThemeHeader.tsx` | お題・ふりがな表示、検索ボタン（`handleSearchTheme`込み） |
| `components/organisms/draw/DrawToolbar.tsx` | Undo/Redo/リセットボタン群 |
| `constants/drawTools.tsx` | ツール定義（key/label/icon）の配列。SVGアイコンをJSXで持つため`.tsx` |
| `components/organisms/draw/ToolSelector.tsx` | ツール選択UI（ラジオボタン＋ハイライトアニメーション） |
| `components/organisms/draw/DrawCanvas.tsx` | Konva Stage/Layer、図形描画、カウントバッジ、マウス/タッチイベント振り分け |
| `components/organisms/draw/SaveControl.tsx` | 保存ボタン＋保存確認モーダル＋保存メッセージ一式 |
| `components/organisms/draw/ThemeModal.tsx` | お題説明の初回モーダル |
| `components/organisms/draw/RoomClosedModal.tsx` | 回答締切時の強制モーダル＋遷移ロジック |
| `components/organisms/draw/ThemeChangedModal.tsx` | お題変更通知モーダル |
| `hooks/useIsMobile.ts` | UA判定ロジック（`DrawPage.tsx`・`Footer.tsx`と重複している実装の共通化） |

既存の [Footer.tsx](../doc/2026-08-11-mobile-footer.md) にも同一のUser-Agent判定
ロジックがあるため、`useIsMobile` フックへの切り出しはこちらの重複解消も兼ねる。

### 4.2 各コンポーネントのprops設計（案）

```tsx
// ThemeHeader.tsx
type Props = {
  theme?: string;
  furigana?: string;
  isThemeOpen: boolean;
};

// DrawToolbar.tsx
type Props = {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
};

// ToolSelector.tsx
type Props = {
  tool: ToolType;
  onChange: (tool: ToolType) => void;
};

// DrawCanvas.tsx
type Props = {
  count: number;
  lines: number[][];
  circles: CircleShape[];
  rects: RectShape[];
  selectedShape: SelectedShape;
  w: number;
  h: number;
  isMobile: boolean;
  onMouseDown: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseMove: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseUp: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
};

// SaveControl.tsx
type Props = {
  isSaving: boolean;
  saveMessage: string;
  hasShapes: boolean; // lines/circles/rects のいずれかが存在するか
  onConfirmSave: () => void; // handleSave + setIsBlocked(false) + saveToSessionStorage をまとめて呼ぶ
};

// ThemeModal.tsx
type Props = {
  isOpen: boolean;
  theme?: string;
  furigana?: string;
  onConfirm: () => void;
};

// RoomClosedModal.tsx
type Props = {
  roomId: string;
  saveMessage: string;
  onLeave: () => void; // handleSave + setIsBlocked(false) + saveToSessionStorage + 遷移
};

// ThemeChangedModal.tsx
type Props = {
  onClose: () => void;
};
```

`ToolType` / `CircleShape` / `RectShape` / `SelectedShape` は `useDraw` 側の型を
そのままexportして再利用する（現状 `hooks/DrawPage/handleDraw.ts` 内でinline定義
されているため、型を切り出してexportする作業を含む）。

### 4.3 DrawPage.tsx の最終形（イメージ）

```tsx
export default function DrawPage({ roomId, theme, furigana, mode }: DrawPageProps) {
  const draw = useDraw(roomId);
  const { status, currentTheme } = useStatus(roomId);
  const isMobile = useIsMobile();
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(true);
  const [isBlocked, setIsBlocked] = useState(true);
  const [isChangeTheme, setIsChangeTheme] = useState(false);
  useBlocker(() => {}, isBlocked);

  useEffect(() => {
    if (currentTheme && currentTheme !== theme) setIsChangeTheme(true);
  }, [currentTheme]);

  const finalizeSave = () => {
    draw.handleSave();
    setIsBlocked(false);
    draw.saveToSessionStorage();
  };

  return (
    <>
      <Link href={mode === 'demo' ? '/' : `/room/${roomId}`} className="...">
        <TbArrowLeft size="2em" />
      </Link>
      {mode !== 'demo' && (
        <>
          <AccessUser roomId={roomId} />
          <ThemeHeader theme={theme} furigana={furigana} isThemeOpen={isThemeOpen} />
        </>
      )}
      <div className="max-w-xl mx-auto backdrop-blur bg-white/30 border border-white p-4 rounded-2xl shadow-md">
        <DrawToolbar onUndo={draw.handleUndo} onRedo={draw.handleRedo} onReset={draw.handleReset} />
        <ToolSelector tool={draw.tool} onChange={draw.setTool} />
        <DrawCanvas {...draw} isMobile={isMobile} />
      </div>
      {mode !== 'demo' && (
        <SaveControl
          isSaving={draw.isSaving}
          saveMessage={draw.saveMessage}
          hasShapes={draw.lines.length > 0 || draw.circles.length > 0 || draw.rects.length > 0}
          onConfirmSave={finalizeSave}
        />
      )}
      {mode !== 'demo' && (
        <ThemeModal
          isOpen={isThemeOpen}
          theme={theme}
          furigana={furigana}
          onConfirm={() => { setIsThemeOpen(false); setIsChangeTheme(false); }}
        />
      )}
      {status === 'ANSWERING' && (
        <RoomClosedModal roomId={roomId} saveMessage={draw.saveMessage} onLeave={finalizeSave} />
      )}
      {isChangeTheme && <ThemeChangedModal onClose={() => setIsChangeTheme(false)} />}
    </>
  );
}
```

`SaveControl` の保存ボタン開閉状態（`isSaveOpen`）は保存フロー専用のUI状態のため、
`DrawPage` から渡さず `SaveControl` 内部の `useState` に閉じ込める（外部からの
制御は不要なため）。

## 5. 実装タスク一覧

1. `hooks/useIsMobile.ts` を新規作成し、`DrawPage.tsx` のUA判定ロジックを移植
   （将来的に `Footer.tsx` 側も置き換える余地があるが、本計画では `DrawPage.tsx`
   のみ対応し、`Footer.tsx` の書き換えはスコープ外とする）
2. `constants/drawTools.tsx` を新規作成し、ツール定義配列（`line`/`circle`/`rect`/
   `eraser`/`move`のkey・label・SVGアイコン）を移植
3. `hooks/DrawPage/handleDraw.ts` 側で使っている型（`ToolType`・`CircleShape`・
   `RectShape`・`SelectedShape`等）をexportし、他コンポーネントから参照できるようにする
4. `components/organisms/draw/` 配下に以下を新規作成し、該当JSXを移植
   - `ThemeHeader.tsx`
   - `DrawToolbar.tsx`
   - `ToolSelector.tsx`（`drawTools.tsx` を利用）
   - `DrawCanvas.tsx`
   - `SaveControl.tsx`
   - `ThemeModal.tsx`
   - `RoomClosedModal.tsx`
   - `ThemeChangedModal.tsx`
5. `DrawPage.tsx` を上記コンポーネントの組み立てのみに書き換える
6. 動作確認
   - デモモード（`mode="demo"`）でお題表示・保存UI・お題モーダルが非表示になること
   - 通常モードでUndo/Redo/リセット、ツール切り替え、描画（マウス・タッチ両方）が
     従来通り動作すること
   - 保存フロー（確認モーダル→保存→セッションストレージ保存→ブロッカー解除）が
     従来通り動作すること
   - 回答締切モーダル（`status === 'ANSWERING'`）表示時の強制遷移が従来通り動作すること
   - お題変更検知モーダルが従来通り表示されること
   - 既存のスタイル・アニメーション（`motion`のレイアウトアニメーション含む）が
     崩れていないこと

## 6. 決定事項（2026-08-22 ヒアリング結果）

- `useIsMobile` フックは `Footer.tsx` の重複ロジックにも適用する → **対応する**
  （4.1節の対象に `Footer.tsx` の書き換えを追加。`Footer.tsx` 内の
  `isBrowser`／standalone判定ロジックは対象外とし、UA判定部分のみ置き換える）
- `SaveControl` をボタン部とモーダル部でさらに分割するか → **分割しない**
  （4.1節の案の通り、保存フロー一式で1コンポーネントとする）

## 7. 実装結果

上記方針で実装完了。

- `hooks/useIsMobile.ts` を新規作成し、`DrawPage.tsx` と `Footer.tsx` 両方の
  UA判定ロジックを置き換え
- `constants/drawTools.tsx` にツール定義を切り出し
- `type/DrawShapeType.ts` に `ToolType`／`CircleShape`／`RectShape`／`SelectedShape`
  を切り出し、`hooks/DrawPage/handleDraw.ts` から参照するよう変更
- `components/organisms/draw/` 配下に `ThemeHeader`／`DrawToolbar`／`ToolSelector`／
  `DrawCanvas`／`SaveControl`／`ThemeModal`／`RoomClosedModal`／`ThemeChangedModal`
  を新規作成
- `components/pages/DrawPage.tsx` を上記コンポーネントの組み立てのみに書き換え
- `npx tsc --noEmit` でエラーなしを確認。`npx eslint` の結果もリファクタリング前と
  同数（6 errors, 2 warnings）で、新規の問題は作り込んでいないことを確認済み
  （残存する警告・エラーはいずれも移植元コードに元々存在していたもの）
