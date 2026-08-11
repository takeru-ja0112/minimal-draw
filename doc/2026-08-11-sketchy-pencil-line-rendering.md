# 描画線を「ノイズ・鉛筆風」にする 実装計画

作成日: 2026-08-11
対象: `components/pages/DrawPage.tsx`、`components/pages/AnswerPage.tsx`、`components/pages/MuseumPage.tsx`
新規: `lib/sketchyDraw.ts`、`components/organisms/draw/SketchyShapes.tsx`

## 1. 目的

Konva（react-konva）で描画している直線・円・長方形を、現在の「完全に真っ直ぐで機械的な線」から
「若干ノイズがかかったような、鉛筆で描いたような線」に見た目だけを変更する。

## 2. 現状の整理

- `hooks/DrawPage/handleDraw.ts` が保持するデータは **フリーハンドの軌跡ではない**。
  - `lines`: `number[][]` で各要素は `[x1, y1, x2, y2]`（直線の始点・終点のみ）
  - `circles`: `{ x, y, radius }`
  - `rects`: `{ x, y, width, height, rotation }`
  - つまり「直線」「円」「長方形」の3種類の図形パラメータであり、点列を大量に持つペン描画ではない。
- この同じ形状データを、以下3箇所でそれぞれ個別に `<Line>` / `<Circle>` / `<Rect>`（react-konva）として描画している。
  - `components/pages/DrawPage.tsx`（描画中の画面。171〜229行目付近）
  - `components/pages/AnswerPage.tsx`（回答者が絵を見る画面。479〜513行目付近）
  - `components/pages/MuseumPage.tsx`（美術館ギャラリー。32〜67行目付近、`scale 0.6`で縮小表示）
- DBに保存される `canvas_data`（`lines`/`circles`/`rects`）は「幾何パラメータ」そのものであり、
  今回の変更は**保存データを一切変更せず、描画（レンダリング）時にのみ見た目を変換する**方針で実現できる。
  過去に保存済みの絵にも変更後は自動的に鉛筆風の見た目が適用される。

## 3. 方針（ヒアリング済み）

1. 実装方式: **自前のジッター処理**（新規ライブラリを追加しない）。
   直線・円・長方形の幾何パラメータから、描画時にランダムな微小揺らぎ（ジッター）を加えた点列を
   生成し、`tension` 付きの `Line` として描画する。`rough.js` 等の専用ライブラリは追加しない。
2. 適用範囲: **3画面すべて**（DrawPage / AnswerPage / MuseumPage）で共通の見た目になるよう、
   共通のレンダリング部品を新規作成して3箇所から利用する。

## 4. 見た目の作り方（アルゴリズム設計）

### 4.1 「ノイズ・鉛筆風」を成立させる2つの要素

1. **ジッター（揺らぎ）**: 直線・円・長方形の輪郭を、完全な直線／真円／直角ではなく、
   細かく分割した点列に微小なランダムオフセットを加えた折れ線として描く。
2. **二重ストローク**: 同じ形状を、揺らぎのパターンを変えて2回重ねて描く（1回目は通常の太さ・濃さ、
   2回目はやや細め・半透明）。鉛筆で同じ場所を数回なぞったような、線の密度にムラのある質感を作る。
   これは `rough.js` などの手描き風レンダリングでも使われる基本テクニックで、専用ライブラリを使わずに
   Konvaの `Line` を複数重ねるだけで再現できる。

### 4.2 再現性（重要な設計上の注意点）

- ジッターに単純な `Math.random()` を使うと、**再レンダリングのたびに揺らぎ方が変わってしまい**、
  保存済みの絵を開くたびに違う見た目になったり、他の図形の選択状態変更で親コンポーネントが
  再レンダリングされた際にチラつく問題が起きる。
- これを避けるため、**形状自身の座標値から決定論的にシード値を作る「シード付き疑似乱数」**
  （`mulberry32` 等の軽量な実装）を使う。同じ `[x1,y1,x2,y2]` や `{x,y,radius}` からは
  常に同じジッター結果が得られるようにする。
- これにより、DrawPageで描いている最中／DBから読み込んだAnswerPage・MuseumPageのいずれでも、
  同じ形状データなら見た目が安定する。

### 4.3 直線 (`SketchyLine`)

- 始点・終点は元の座標のまま固定し、その間を一定数（例: 6分割）に区切った中間点を作る。
- 各中間点に、線の進行方向に対して**垂直方向**の微小オフセット（例: ±1.5px程度）をシード付き乱数で加える。
- `tension` を付けた `Line` として描画し、カクカクしすぎない自然な揺らぎにする。
- 上記を「シード」を変えて2パス重ね描きする（2パス目はやや細く・半透明）。

### 4.4 円 (`SketchyCircle`)

- 円周を一定数の角度ステップ（例: 24分割）でサンプリングし、各点の半径にシード付き乱数で
  微小オフセットを加えた点列を作り、閉じた `Line`（`closed`）として描画する。
- 直線と同様に2パス重ね描きする。

### 4.5 長方形 (`SketchyRect`)

- 元の実装は Konva の `Rect` に `x, y, width, height, rotation` を渡しているだけなので、
  回転はそのまま `Group` の `rotation` に任せる（`<Group x={x} y={y} rotation={rotation}>`）。
- `Group` のローカル座標系（`(0,0)-(width,0)-(width,height)-(0,height)` の4隅）でジッターを
  適用した閉じた点列を作り、直線・円と同じ考え方で2パス重ね描きする。
- こうすることで回転計算を自前で書かずに済み、既存の `rotation` の挙動を完全に踏襲できる。

### 4.6 選択中ハイライトとの整合性

- 現状、選択中の図形は `stroke` を黄色・`strokeWidth` を太くして表現している
  （DrawPage.tsx 203〜225行目付近）。この `stroke`/`strokeWidth` は新しい `SketchyLine` /
  `SketchyCircle` / `SketchyRect` にもそのままpropsとして渡し、内部の2パスとも同じ色を使う
  （2パス目のみ透明度を落とす）。挙動・見た目の一貫性は保たれる。

### 4.7 データ・当たり判定への影響

- ジッターは**描画（見た目）のみ**の変更であり、`lines`/`circles`/`rects` の保存データ・
  DBスキーマ・消しゴムや移動ツールの当たり判定ロジック（`handleDraw.ts` の
  `distanceToSegment` 等、元の直線座標で計算している部分）には一切手を加えない。
  そのため、既存の undo/redo・消しゴム・移動機能は影響を受けない想定。

## 5. 新規作成ファイル

### 5.1 `lib/sketchyDraw.ts`

- シード付き疑似乱数生成（`mulberry32` 相当の軽量実装）
- 座標値からシード値を作るハッシュ関数
- `buildSketchyLinePoints(x1, y1, x2, y2, seed)`
- `buildSketchyCirclePoints(radius, seed)`（中心は呼び出し側で `Circle`/`Group` の位置に持たせる）
- `buildSketchyRectPoints(width, height, seed)`（ローカル座標、回転は呼び出し側の `Group` に任せる）
- ジッター幅・分割数・2パス目の不透明度などを定数として先頭にまとめ、見た目の微調整をしやすくする

### 5.2 `components/organisms/draw/SketchyShapes.tsx`

- `SketchyLine`, `SketchyCircle`, `SketchyRect` の3コンポーネントをエクスポート
- それぞれ既存の呼び出し側とほぼ同じprops（`points`/`x,y,radius`/`x,y,width,height,rotation` +
  `stroke`/`strokeWidth`）を受け取り、内部で `lib/sketchyDraw.ts` を使って2パスの `Line` を
  `Group` でまとめて描画する
- 既存呼び出し箇所の差し替えが最小限になるよう、props形状を意図的に元の `Line`/`Circle`/`Rect`
  の呼び出しに近づける

## 6. 既存3画面の変更

いずれも `import { Circle, Layer, Line, Rect, Stage } from "react-konva"` の一部を
`SketchyLine`/`SketchyCircle`/`SketchyRect` に差し替えるだけで、ループ構造・propsの受け渡し方は
そのまま維持する。

1. `components/pages/DrawPage.tsx`（199〜228行目付近）
   - `<Line>` → `<SketchyLine>`、`<Circle>` → `<SketchyCircle>`、`<KonvaRect>` → `<SketchyRect>`
2. `components/pages/AnswerPage.tsx`（481〜511行目付近）
   - 同様に3種類を差し替え
3. `components/pages/MuseumPage.tsx`（32〜67行目付近）
   - 同様に3種類を差し替え。`Stage` に `scale 0.6` がかかっているため、ジッター幅も一緒に
     縮小されて表示される（絶対px指定のジッターがStageのスケールに追従するため、追加対応は不要）

## 7. 実装タスク一覧

1. `lib/sketchyDraw.ts` を新規作成（シード付き乱数・ハッシュ・3種の点列生成関数・調整用定数）
2. `components/organisms/draw/SketchyShapes.tsx` を新規作成（`SketchyLine`/`SketchyCircle`/`SketchyRect`）
3. `DrawPage.tsx` の描画部分を差し替え
4. `AnswerPage.tsx` の描画部分を差し替え
5. `MuseumPage.tsx` の描画部分を差し替え
6. 動作確認
   - DrawPageで実際に線・円・長方形を描き、鉛筆風の見た目になっているか確認
   - 描画中（ドラッグ中でリアルタイムに座標が変わる間）の見た目が破綻しないか確認
   - undo/redo・消しゴム・移動ツールが従来どおり機能するか確認（データ非破壊であることの確認）
   - 保存 → AnswerPageで同じ絵が同じ見た目（鉛筆風）で表示されるか確認
   - MuseumPage（縮小表示）でも違和感のない見た目か確認
   - ジッター幅・二重ストロークの不透明度など、実際の見た目を見ながら `lib/sketchyDraw.ts` の
     定数を微調整

## 8. 未確定事項（実装着手前に確認したい点）

- ジッターの強さ（線の揺れ幅）は数値だけでは感覚が掴みにくいため、まず仮の値
  （振れ幅 約1.5px、2パス目の不透明度 約0.5）で実装し、実際の画面を見ながら微調整する
  という進め方でよいか
