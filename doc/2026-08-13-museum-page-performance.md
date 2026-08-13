# /museum ページの読み込みが遅い件 原因調査と修正案

作成日: 2026-08-13
対象ファイル: `app/museum/page.tsx`、`app/museum/action.ts`、`components/pages/MuseumPage.tsx`、
`components/molecules/ArtCard.tsx`、`components/molecules/ArtSection.tsx`、`prisma/schema.prisma`

## 1. 症状

`/museum` への遷移が他のページと比べて明らかに遅い。

## 2. 原因（影響が大きいと思われる順）

### 2.1 Konva Canvas（`<canvas>`）を40枚、遅延なしで即座に全マウントしている

- `components/molecules/ArtSection.tsx:25-30` で `highCountArts`（20件）・`lowCountArts`（20件）を
  そのまま `.map` して `ArtCard` を並べており、画面外にあるカードも含めて **初回描画で40枚**
  レンダリングする。
- `components/molecules/ArtCard.tsx:76-88` の各 `ArtCard` は `react-konva` の `<Stage>` を持ち、
  マウントするたびに実際の `<canvas>` 要素とKonvaの描画エンジンインスタンスが1つ生成され、
  `canvas_data.lines/circles/rects` を全て図形としてKonvaに登録・描画する。
  `Stage`/`Layer`/`Line` 等のReactラッパー自体の初期化コストも軽くない。
- しかも「画数が多い作品」セクション（`getArtsByCountDesc`, `app/museum/action.ts:5-21`）は
  `orderBy: { element_count: "desc" }` で**わざとDB内で最も画数（ストローク数）が多い＝
  最も描画データが重い20件**を取得している。1本のストローク（`lines` の各要素）自体も
  ポインタ移動のたびに座標が追加される可変長の点列（`hooks/DrawPage/handleDraw.ts` 参照）なので、
  画数が多い作品ほど総座標点数も多くなりやすく、この20件が最もKonvaの描画コストが高い。
- 結果として、ページを開いた瞬間に「重い描画データを持つ20枚を含む計40枚のcanvas」を
  同時に生成・描画することになり、メインスレッドが長時間ブロックされる。
- 同種の懸念は管理画面のKonvaプレビュー導入時にも指摘済みで
  （[2026-08-12-admin-drawing-konva-preview.md](2026-08-12-admin-drawing-konva-preview.md) 3.5節）、
  そちらは「サムネイルサイズを小さくする」「重くなったらIntersectionObserverで遅延マウントする」
  という段階的対応を予定として明記していた。Museum側は最初の実装
  （[2026-08-12-museum-page-search-sections.md](2026-08-12-museum-page-search-sections.md)）の時点で
  この対策が未実施のまま横スクロールセクションとして本番投入されている。

### 2.2 `export const dynamic = 'force-dynamic'` によりキャッシュが一切効かない

- `app/museum/page.tsx:1` で明示的に `force-dynamic` を指定しているため、アクセスのたびに
  静的化・ISR・Data Cacheのいずれも使われず、毎回サーバー側でPrismaクエリ3本
  （`getArtsByCountDesc` / `getArtsByCountAsc` / `getThemeList`）を実行してからSSRしている。
- 他ページでは同様の指定が見送られている（`app/lobby/page.tsx:15` に
  `// export const dynamic = 'force-dynamic';` とコメントアウトされた形跡があり、
  パフォーマンス上の理由で意図的に外されたと思われる）。Museumはギャラリー的な
  一覧表示で秒単位のリアルタイム性は不要なはずだが、`force-dynamic` のままになっている。

### 2.3 `canvas_data` を含む重いJSONペイロードをそのままRSC→クライアントへ渡している

- 3クエリとも `include: { user: true }`（`app/museum/action.ts:8, 26, 65`）でユーザーの全カラムを
  含めており、必要なのは `username` のみ。
- `canvas_data`（`lines`/`circles`/`rects` の全点列）もサイズ制限なくそのまま取得し、
  Server Component（`app/museum/page.tsx`）からClient Component（`MuseumPage`）へ
  40件分をpropsとして渡している。件数×点数が多いほどRSCペイロード（≒初回HTML/JSに埋め込まれる
  シリアライズ済みデータ）が肥大化し、通信量とパース時間が増える。

### 2.4 `HistoryDrawing` に並び替え・絞り込み用のインデックスが無い

- `prisma/schema.prisma:118-132` の `HistoryDrawing` には `@@index([deleted_at])` しか無く、
  `element_count`（`getArtsByCountDesc`/`getArtsByCountAsc`のORDER BY）や
  `theme`（`getThemeList`のDISTINCT+ORDER BY、`getArtsByTheme`のWHERE）にはインデックスが無い。
- 現状件数が少なければ体感差は小さいが、`lib/prisma.ts` のソフトデリート拡張により
  全読み取りに `deleted_at: null` が自動付与されるため、実質「`deleted_at`でフィルタしてから
  `element_count`/`theme`でソート」という複合条件になっている。データが増えるほど
  フルスキャン＋ソートのコストが線形以上に効いてきて、かつ2.2により**そのコストを
  毎リクエスト再計算**することになる。

### 2.5 （補足）`react-konva` がコード分割されていない

- 管理画面では `components/admin/DrawingPreviewCell.tsx:8` が
  `dynamic(() => import("./CanvasDataPreview"), { ssr: false })` でKonva依存コンポーネントを
  遅延ロードしている一方、`ArtCard`/`ArtDetailModal` は通常のimportで `MuseumPage` から
  直接読み込まれており、初回JSバンドルにKonva一式が含まれる。ページ表示に必須ではない
  タイミング（スクロールして見るまで／クリックして拡大するまで）で読み込まれるコードが
  先読みされている。

## 3. 修正案

優先度が高い順（2.1・2.2が体感速度への影響が大きいと推測される）。

1. **カードの遅延マウント**（2.1対応）
   - `ArtCard` の `<Stage>` 部分を、`IntersectionObserver` で画面内に入ったときだけ
     マウントするようにする（管理画面側で既に検討されている方針を踏襲）。
   - もしくは、まず「初期表示は数枚のみ描画し、残りはスクロール/ボタン操作で追加表示する」
     ような簡易ページネーションでも同等の効果が見込める。
2. **`force-dynamic` の見直し**（2.2対応）
   - リアルタイム性が不要であれば `export const dynamic = 'force-dynamic'` を削除し、
     `export const revalidate = 60`（秒数は要件次第）等のISRに切り替える。
   - 即時反映が必要な場合でも、`app/lobby/page.tsx` がなぜ `force-dynamic` を外したのか
     経緯を確認し、同様の判断が museum にも適用できないか検討する。
3. **取得データの絞り込み**（2.3対応）
   - `include: { user: true }` を `select: { ..., user: { select: { username: true } } }` に変更し、
     不要なユーザーカラムの取得・シリアライズを避ける。
   - サムネイル表示に必要な範囲で `canvas_data` を間引く／圧縮する余地がないか検討する
     （例: 点列の間引き、表示に使わない情報の除外）。すぐには難しければ2.1の遅延マウントを優先する。
4. **インデックス追加**（2.4対応）
   - `HistoryDrawing` に `@@index([element_count])` と `@@index([theme])`
     （実クエリのパターン次第では `@@index([deleted_at, element_count])` のような複合indexも検討）を追加し、
     `prisma migrate dev` でマイグレーションを作成する。
5. **Konvaのコード分割**（2.5対応）
   - `ArtCard`/`ArtDetailModal` を `next/dynamic(..., { ssr: false })` で遅延importし、
     `components/admin/DrawingPreviewCell.tsx` と同じパターンに揃える。

## 4. 確認事項

- museumギャラリーとして、表示更新の即時性（`force-dynamic`）が本当に必要かどうか
  （不要なら案2を優先的に着手したい）。
- `history_drawings` の現在の行数・今後の増加見込み（案4の優先度判断に影響）。
- 案1（遅延マウント）とページネーションのどちらの方向性を採用するか
  （横スクロールUIの現行デザインを維持するなら遅延マウント、シンプルさ優先なら件数を絞る方向）。
