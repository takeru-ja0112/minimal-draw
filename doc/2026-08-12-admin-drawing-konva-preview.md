# 管理画面 drawings/history_drawings のKonva実イラスト表示 実装計画

作成日: 2026-08-12
対象: `app/admin/drawings/page.tsx`, `app/admin/history-drawings/page.tsx`, `components/admin/**`（新規）
前提: [2026-08-12-admin-panel.md](2026-08-12-admin-panel.md) を元にGeminiにより管理画面が実装済み

## 1. 目的

現状 `app/admin/drawings/page.tsx` / `app/admin/history-drawings/page.tsx` の一覧表では、`canvas_data`
列を `<details><pre>{JSON.stringify(...)}</pre></details>` による生JSON表示にしている。
これを、実際にユーザーが描いたイラストの見た目（既存の美術館ページ `ArtCard` / `ArtDetailModal` と
同様のreact-konvaによる図形描画）で確認できるように変更する。

## 2. 現状の関連実装

- `canvas_data`（Prisma上は `Json` 型）は `{ lines: number[][], circles: {x,y,radius}[], rects: {x,y,width,height}[] }`
  という形状で保存されている（`type/DrawingDataType.ts` 参照）。
- 描画時のCanvasサイズは `hooks/DrawPage/handleDraw.ts` で `w = 300, h = 300` に固定されている
  （デバイスによらず常に300×300の座標空間で `lines`/`circles`/`rects` の座標が保存される）ため、
  再描画側も300×300を基準サイズとして扱えばよい。
- 既に美術館ページ（`app/museum/page.tsx`）向けに同じデータ形状を実イラストとして描画する実装がある。
  - `components/molecules/ArtCard.tsx`: 一覧カード用の小さいサムネイル（`Stage` を `scale 0.6` で
    180×180描画、実質300×300相当を縮小表示）
  - `components/molecules/ArtDetailModal.tsx`: クリック時に開く拡大表示モーダル（`Stage` 300×300）
  - どちらも `"use client"` コンポーネントで、`react-konva` の `Stage`/`Layer`/`Line`/`Circle`/`Rect` を
    そのまま `canvas_data.lines/circles/rects` にmapして描画しているだけのシンプルな実装。
- 管理画面側 (`app/admin/drawings/page.tsx` など) は `page.tsx` 自体が async Server Component であり、
  `prismaAdminReadonly.drawing.findMany` の結果をそのままテーブル行として出力している。Konva/Canvas は
  ブラウザAPI（`<canvas>`）に依存するため、既存の `ArtCard` 等と同様に描画部分だけ独立した
  `"use client"` コンポーネントに切り出す必要がある。

## 3. 方針

### 3.1 描画用コンポーネントの新規作成

`components/admin/` 配下に、管理画面専用のKonvaプレビュー用コンポーネントを追加する
（美術館側の `ArtCard`/`ArtDetailModal` は「お題見出し」「作成者イニシャル」などUI要件が
admin用途と異なるため流用せず、描画ロジックのみを踏襲した専用コンポーネントとして新規作成する）。

- `components/admin/CanvasDataPreview.tsx`（`"use client"`）
  - Props: `canvasData: Prisma.JsonValue`, `size?: number`（正方形の一辺のピクセル数）
  - `canvas_data` は元々 `w=300, h=300` の座標空間なので、`scale = size / 300` として
    `Stage` に `scale={{ x: scale, y: scale }}` を指定し、`width={size} height={size}` で描画する。
  - 管理画面一覧のテーブル行内に収まる小サイズ（例: `size=96`）のサムネイルとして使う。
- `components/admin/DrawingPreviewCell.tsx`（`"use client"`）
  - テーブルの1セル分を担当する薄いラッパー。`CanvasDataPreview` を小サイズで表示しつつ、
    クリックすると `components/organisms/Modal` を使った拡大表示（`CanvasDataPreview size=300`）を
    開閉するstateを持つ（`ArtDetailModal` のクリック→モーダル、という既存UXパターンを踏襲）。
  - 拡大モーダル内には、参考情報として `theme` / `element_count` / `id` に加え、デバッグ用途で
    生JSONを見たい場合のための折りたたみ（既存の `<details><pre>`）も残す
    （3.3節「生JSON表示の扱い」参照）。

### 3.2 `canvas_data` のパース・防御的処理

Prismaの `canvas_data` フィールドは型上 `Prisma.JsonValue`（`any` に近い）であり、
`DrawingDataType.canvas_data` が期待する `{ lines, circles, rects }` の形状を保証しない
（過去データの欠損・不正値の可能性がある）。`CanvasDataPreview` 内、または
`lib/admin/parseCanvasData.ts`（新規）として以下のような防御的パース関数を用意し、
不正な値でも例外を投げずに空配列にフォールバックする。

```ts
type ParsedCanvasData = {
  lines: number[][];
  circles: { x: number; y: number; radius: number }[];
  rects: { x: number; y: number; width: number; height: number }[];
};

function parseCanvasData(value: unknown): ParsedCanvasData {
  const obj = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    lines: Array.isArray(obj.lines) ? (obj.lines as number[][]) : [],
    circles: Array.isArray(obj.circles) ? (obj.circles as ParsedCanvasData['circles']) : [],
    rects: Array.isArray(obj.rects) ? (obj.rects as ParsedCanvasData['rects']) : [],
  };
}
```

これにより、壊れた/空の `canvas_data` を持つ行でも管理画面全体がクラッシュしないようにする。

### 3.3 生JSON表示の扱い

生JSON表示（現状の `<details><pre>`）は完全に削除せず、拡大モーダル内の折りたたみとして残す方針とする。
- 一覧テーブルの列自体は「サムネイル（実イラスト）」に置き換える。
- 「生データを見たい」という開発・デバッグ目的のニーズは残る可能性があるため、モーダルを開いた後の
  補助情報として `<details>` を残す（列自体を2つに増やすとテーブル幅がさらに広がるため、
  折りたたみ側に寄せる）。

### 3.4 一覧ページ側の変更

`app/admin/drawings/page.tsx` / `app/admin/history-drawings/page.tsx` の「描画データ (JSON)」列を、
以下のように置き換える。

```tsx
<td className="px-6 py-4">
  <DrawingPreviewCell
    canvasData={drawing.canvas_data}
    theme={drawing.theme}
    elementCount={drawing.element_count}
  />
</td>
```

Server Component側の変更はこのpropsの受け渡しのみで、データ取得ロジック（`prismaAdminReadonly` 経由）
自体は変更不要。

### 3.5 パフォーマンス上の懸念とその対策方針

現状の一覧は `findMany`（ページネーションなし）で全件を一度に描画しており、行ごとに
`react-konva` の `Stage`（`<canvas>` 要素）を1つ生成する。件数が多い場合、同時に多数のCanvasを
マウントするとレンダリング負荷・メモリ使用量が無視できなくなる可能性がある。

今回のスコープでは以下の軽量な対策のみ実施し、抜本対応（ページネーション導入）は
[2026-08-12-admin-panel.md](2026-08-12-admin-panel.md) の未確定事項と合わせて別途判断する。

- サムネイルサイズを小さく保つ（`size=96` 程度、`Stage` の実ピクセル数を抑える）
- 一覧が空/対象データが極端に少ない現状の運用を前提に、まずは全件同時描画で実装し、
  体感的に重くなった場合にIntersectionObserverによる遅延マウント（画面内に入った行だけ
  `CanvasDataPreview` を実際にマウントする）を追加する、という段階的対応とする

## 4. 実装タスク一覧

1. `lib/admin/parseCanvasData.ts` を新規作成し、防御的パース関数を実装
2. `components/admin/CanvasDataPreview.tsx` を新規作成（`react-konva` の `Stage`/`Layer`/`Line`/`Circle`/`Rect`
   をサイズ可変で描画する共通コンポーネント）
3. `components/admin/DrawingPreviewCell.tsx` を新規作成（サムネイル表示＋クリックで拡大モーダル、
   モーダル内に生JSON折りたたみを残す）
4. `app/admin/drawings/page.tsx` の「描画データ (JSON)」列を `DrawingPreviewCell` に置き換え
5. `app/admin/history-drawings/page.tsx` の「描画データ (JSON)」列を `DrawingPreviewCell` に置き換え
6. ローカルで動作確認
   - 正常な `canvas_data` を持つ行が実イラストとしてサムネイル表示されること
   - サムネイルクリックで300×300の拡大モーダルが開閉できること
   - `lines`/`circles`/`rects` のいずれかが欠損・空・不正な形状のデータでもエラーにならず表示できること
   - ソフトデリート済み行（`deleted_at` あり）でもプレビューが表示されること
   - 件数が多い場合の一覧表示のレスポンス（体感速度）を確認し、必要ならIntersectionObserver対応を検討

## 5. 未確定事項（実装着手前に確認したい点）

- サムネイルの表示サイズ（今回案は一辺96px）で一覧の視認性として十分か
- 生JSON表示を完全に廃止してよいか、それとも3.3節の方針（拡大モーダル内に残す）でよいか
- 一覧のデータ件数の見込み（数十件程度か、数百〜数千件規模になり得るか）。件数次第で
  3.5節の遅延マウント対応やページネーション導入を今回のスコープに含めるべきか判断が変わる
- `theme` が未設定（null）の行のモーダル表示文言（一覧側は「未設定」表示済みのため、モーダルも
  同様の文言でよいか）
