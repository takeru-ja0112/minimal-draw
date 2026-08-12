# 過去作品ギャラリー（Museum）画数・テーマ検索セクション化 実装計画

作成日: 2026-08-12
対象ファイル: `app/museum/action.ts`、`app/museum/page.tsx`、`components/pages/MuseumPage.tsx`、
新規: `components/molecules/ArtCard.tsx`、`components/molecules/ArtSection.tsx`、
`components/molecules/ThemeSearchForm.tsx`、`components/molecules/ArtDetailModal.tsx`

## 1. 目的

現在 `/museum` は `getArts()`（作成日時降順・全件）のみを使い、1つの横並びグリッドで
全作品を表示している。これを以下の3セクション構成に変更する。

1. 画数が多い作品（上位）
2. 画数が少ない作品（上位）
3. テーマ条件（選択式）＋画数（オプション）で検索した作品

各セクションはカードごとに「お題（テーマ）」と「作成者名」を表示し、
セクション単位で横スクロール可能にする。カードをタップ（クリック）すると
その作品を拡大表示する。

## 2. 現状の実装と使えるもの

- `app/museum/action.ts` には既に以下が用意済み（`getArts` 以外は未使用）:
  - `getArtsByCountDesc()` … `element_count desc`、`take: 20` → セクション1にそのまま使える
  - `getArtsByCountAsc()` … `element_count asc`、`take: 20` → セクション2にそのまま使える
  - `getArtsByTheme(theme, order?)` … `theme` で絞り込み。ただし画数を「オプションの追加条件」
    として使う仕組みがなく、`order` は `element_count` の並び順にしか使えない。
    → セクション3の要件を満たすには拡張が必要（3章参照）。
- `app/museum/action.ts` には `"use server"` ディレクティブが無い（他の `action.ts` —
  例: `app/room/[id]/action.ts` — は先頭に `'use server';` を付けてクライアント
  コンポーネントから直接呼べる Server Action にしている）。
  テーマ検索はユーザー操作（プルダウン選択・任意で画数条件入力）に応じて
  クライアント側から動的に結果を取りたいので、`museum/action.ts` にも
  `'use server'` を追加し、`MuseumPage.tsx`（`"use client"`）から直接呼び出せるようにする。
- `components/pages/MuseumPage.tsx` は現在1つのコンポーネントに
  「Konvaサムネイル描画（lines/circles/rects の map）」「カードのレイアウト」
  「横スクロールコンテナ」が全部ベタ書きされている。3セクション化すると
  この描画ロジックが3箇所で重複するため、`ArtCard` として切り出す。
- `components/organisms/Modal.tsx` が既に汎用モーダル（`isOpen/onClose/children`）
  として存在する。拡大表示はこれをそのまま使う。
- `components/pages/AnswerPage.tsx:495-528` に等倍サイズ（`width={300} height={300}`、
  スケール指定なし）の Stage 描画があり、拡大表示のサイズ感の参考にする。
- `お題（theme）` は `HistoryDrawing.theme`（`prisma/schema.prisma:114`）に
  作成時点の文字列としてスナップショット保存されているだけで、マスタテーブル
  `Theme`（`prisma/schema.prisma:64-74`）への外部キーではない。
  → プルダウンの選択肢は「実際に作品で使われた theme の重複無し一覧」を
  `HistoryDrawing` から `distinct` 取得して作る（存在しないテーマを選んで
  検索結果0件になる事態を避けるため、マスタ `Theme` 全件ではなくこちらを使う）。

## 3. `app/museum/action.ts` の変更

```ts
'use server';

import { prisma } from "@/lib/prisma";

// 既存の getArts / getArtsByCountDesc / getArtsByCountAsc はそのまま維持

// 新規: テーマ選択肢の取得（プルダウン用、重複なし・null除外）
export async function getThemeList(): Promise<string[]> {
    try {
        const data = await prisma.historyDrawing.findMany({
            where: { theme: { not: null } },
            select: { theme: true },
            distinct: ["theme"],
            orderBy: { theme: "asc" },
        });
        return data.map((d) => d.theme as string);
    } catch (error) {
        console.error("Error fetching theme list:", error);
        return [];
    }
}

// 変更: theme必須 + element_count はオプションの絞り込み条件として使う
export async function getArtsByTheme(
    theme: string,
    minElementCount?: number,
    order: "asc" | "desc" = "desc",
) {
    try {
        const data = await prisma.historyDrawing.findMany({
            include: { user: true },
            where: {
                theme,
                ...(minElementCount != null
                    ? { element_count: { gte: minElementCount } }
                    : {}),
            },
            orderBy: { element_count: order },
            take: 20,
        });
        return data;
    } catch (error) {
        console.error("Error fetching arts by theme:", error);
        return [];
    }
}
```

補足:
- `minElementCount` は「この画数以上」というオプション条件にする案（他に
  ちょうど・以下などの案もあるが、まずは一番使い頻度が高そうな下限指定のみ実装し、
  必要になれば `maxElementCount` も追加する）。UI側は数値未入力なら
  `minElementCount` を渡さない。
- `getArtsByTheme` の返り値の型は `getArts` 系と同じ（`user: true` include）なので
  `DrawingDataType[]` にキャストして使える（既存 `page.tsx` の書き方を踏襲）。

## 4. `app/museum/page.tsx` の変更

サーバーコンポーネントとして、セクション1・2・テーマ選択肢を並列取得して
`MuseumPage` に渡す（テーマ検索結果自体はユーザー操作後にクライアント側で取得するため
ここでは取得しない）。

```tsx
import { getArtsByCountAsc, getArtsByCountDesc, getThemeList } from "@/app/museum/action";
import MuseumPage from "@/components/pages/MuseumPage";
import type { DrawingDataType } from "@/type/DrawingDataType";

export default async function Page() {
  const [highCountArts, lowCountArts, themeList] = await Promise.all([
    getArtsByCountDesc(),
    getArtsByCountAsc(),
    getThemeList(),
  ]);

  return (
    <MuseumPage
      highCountArts={highCountArts as unknown as DrawingDataType[]}
      lowCountArts={lowCountArts as unknown as DrawingDataType[]}
      themeList={themeList}
    />
  );
}
```

`getArts()`（作成日時降順の全件取得）は新レイアウトでは使わなくなる。呼び出し元が
無くなるが、他画面から使われていないか一応 grep で確認したうえで、未使用なら
`action.ts` から削除する（実装時に確認）。

## 5. 新規コンポーネント

### 5.1 `components/molecules/ArtCard.tsx`

サムネイル1枚分の描画ロジックを現行 `MuseumPage.tsx` から切り出す。
お題見出しに加えて作成者名を表示するようヘッダー部分を拡張する。

```tsx
"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import Card from "@/components/atoms/Card";

export default function ArtCard({
  art,
  onClick,
}: {
  art: DrawingDataType;
  onClick?: () => void;
}) {
  return (
    <Card className="cursor-pointer" >
      <div onClick={onClick}>
        <div className="p-4 bg-yellow-500 rounded-lg rounded-b-none text-center">
          <h2 className="text-md font-semibold text-yellow-900/70">お題</h2>
          <h2 className="text-xl font-semibold">{art.theme}</h2>
        </div>
        <div className="bg-white border-4 rounded-lg border-yellow-500 rounded-t-none flex justify-center items-center">
          <Stage scale={{ x: 0.6, y: 0.6 }} width={180} height={180}>
            <Layer>
              {art.canvas_data.lines.map((line, i) => (
                <Line key={`line-${i}`} points={line} stroke="black" strokeWidth={3} />
              ))}
              {art.canvas_data.circles.map((circle, i) => (
                <Circle key={`circle-${i}`} x={circle.x} y={circle.y} radius={circle.radius} stroke="black" strokeWidth={3} />
              ))}
              {art.canvas_data.rects.map((rect, i) => (
                <Rect key={`rect-${i}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} stroke="black" strokeWidth={3} />
              ))}
            </Layer>
          </Stage>
        </div>
        <p className="text-center text-sm text-gray-500 mt-1">
          作成者: {art.user?.username ?? "不明"}
        </p>
      </div>
    </Card>
  );
}
```

（`Transformer` は編集用UIなので閲覧専用のミュージアム表示からは外す。既存実装に
含まれていたが選択・変形操作は不要なため削除する。）

### 5.2 `components/molecules/ArtSection.tsx`

タイトル＋横スクロールの塊を共通化。3セクションとも同じラッパーを使う。

```tsx
"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import ArtCard from "./ArtCard";

export default function ArtSection({
  title,
  arts,
  onSelectArt,
  emptyMessage = "該当する作品がありません",
}: {
  title: string;
  arts: DrawingDataType[];
  onSelectArt: (art: DrawingDataType) => void;
  emptyMessage?: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-600 px-6 mb-2">{title}</h2>
      {arts.length === 0 ? (
        <p className="text-sm text-gray-400 px-6">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto w-full">
          <div className="flex gap-4 min-w-max px-6 pb-2">
            {arts.map((art) => (
              <div key={art.id} className="w-[200px] shrink-0">
                <ArtCard art={art} onClick={() => onSelectArt(art)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
```

既存は `grid grid-cols-10`（固定10列でスクロール）だったが、件数がまちまちな
3セクション構成には `flex` + `shrink-0` の方が扱いやすいので変更する。

### 5.3 `components/molecules/ThemeSearchForm.tsx`

テーマ（選択式・必須）と画数（オプション、下限値の数値入力）の検索フォーム。

```tsx
"use client";

import { useState } from "react";

export default function ThemeSearchForm({
  themeList,
  onSearch,
  loading,
}: {
  themeList: string[];
  onSearch: (theme: string, minCount?: number) => void;
  loading: boolean;
}) {
  const [theme, setTheme] = useState(themeList[0] ?? "");
  const [minCount, setMinCount] = useState("");

  return (
    <form
      className="flex flex-wrap items-end gap-3 px-6 mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!theme) return;
        onSearch(theme, minCount ? Number(minCount) : undefined);
      }}
    >
      <label className="flex flex-col text-sm">
        テーマ
        <select
          className="border rounded px-2 py-1"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          {themeList.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm">
        画数（この画数以上・任意）
        <input
          type="number"
          min={0}
          className="border rounded px-2 py-1 w-28"
          value={minCount}
          onChange={(e) => setMinCount(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading || !theme}
        className="bg-yellow-500 text-white rounded px-4 py-1.5 disabled:opacity-50"
      >
        検索
      </button>
    </form>
  );
}
```

### 5.4 拡大表示（`Modal.tsx` の再利用）

新規コンポーネントを1つ切り出す（`ArtDetailModal.tsx`）か、`MuseumPage.tsx` 内に
インラインで書くかは実装時に判断してよいが、独立させたほうが見通しが良い。

```tsx
"use client";

import type { DrawingDataType } from "@/type/DrawingDataType";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import Modal from "@/components/organisms/Modal";

export default function ArtDetailModal({
  art,
  onClose,
}: {
  art: DrawingDataType | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!art} onClose={onClose}>
      {art && (
        <div className="text-center">
          <h2 className="text-md font-semibold text-yellow-900/70">お題</h2>
          <h2 className="text-xl font-semibold mb-2">{art.theme}</h2>
          <div className="flex justify-center">
            <Stage width={300} height={300}>
              <Layer>
                {art.canvas_data.lines.map((line, i) => (
                  <Line key={`line-${i}`} points={line} stroke="black" strokeWidth={3} />
                ))}
                {art.canvas_data.circles.map((circle, i) => (
                  <Circle key={`circle-${i}`} x={circle.x} y={circle.y} radius={circle.radius} stroke="black" strokeWidth={3} />
                ))}
                {art.canvas_data.rects.map((rect, i) => (
                  <Rect key={`rect-${i}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} stroke="black" strokeWidth={3} />
                ))}
              </Layer>
            </Stage>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            作成者: {art.user?.username ?? "不明"}
          </p>
        </div>
      )}
    </Modal>
  );
}
```

AnswerPage の等倍Stage（300x300）と同じサイズ感を踏襲。作品の座標データが
180幅のサムネイル用に作られたものと同一なので、300x300でも余白ができるだけで
描画自体は崩れない想定（実装時に実データで確認する）。

## 6. `components/pages/MuseumPage.tsx` の変更

```tsx
"use client";

import { getArtsByTheme } from "@/app/museum/action";
import type { DrawingDataType } from "@/type/DrawingDataType";
import { useState } from "react";
import ArtSection from "@/components/molecules/ArtSection";
import ThemeSearchForm from "@/components/molecules/ThemeSearchForm";
import ArtDetailModal from "@/components/molecules/ArtDetailModal";

export default function MuseumPage({
  highCountArts,
  lowCountArts,
  themeList,
}: {
  highCountArts: DrawingDataType[];
  lowCountArts: DrawingDataType[];
  themeList: string[];
}) {
  const [selectedArt, setSelectedArt] = useState<DrawingDataType | null>(null);
  const [themeResults, setThemeResults] = useState<DrawingDataType[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(theme: string, minCount?: number) {
    setLoading(true);
    try {
      const data = await getArtsByTheme(theme, minCount);
      setThemeResults(data as unknown as DrawingDataType[]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-500">過去のイラスト</h1>
      </div>

      <ArtSection title="画数が多い作品" arts={highCountArts} onSelectArt={setSelectedArt} />
      <ArtSection title="画数が少ない作品" arts={lowCountArts} onSelectArt={setSelectedArt} />

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-600 px-6 mb-2">テーマで検索</h2>
        <ThemeSearchForm themeList={themeList} onSearch={handleSearch} loading={loading} />
        {searched && (
          <ArtSection
            title="検索結果"
            arts={themeResults}
            onSelectArt={setSelectedArt}
            emptyMessage="条件に一致する作品がありません"
          />
        )}
      </section>

      <ArtDetailModal art={selectedArt} onClose={() => setSelectedArt(null)} />
    </>
  );
}
```

## 7. 実装タスク一覧

1. `app/museum/action.ts`
   - 先頭に `'use server';` を追加
   - `getThemeList()` を新規追加（`distinct: ["theme"]`、`theme: { not: null }`）
   - `getArtsByTheme` を `(theme, minElementCount?, order = "desc")` に変更し、
     `element_count: { gte: minElementCount }` をオプション条件として追加
   - `getArts()` の呼び出し元が他に無いか grep で確認し、無ければ削除（あれば残す）
2. `components/molecules/ArtCard.tsx` を新規作成（現行 `MuseumPage.tsx` の
   Konva描画部分を移植し、作成者名表示を追加、`Transformer` は削除）
3. `components/molecules/ArtSection.tsx` を新規作成（タイトル＋横スクロール共通化）
4. `components/molecules/ThemeSearchForm.tsx` を新規作成（テーマ選択＋画数下限の任意入力）
5. `components/molecules/ArtDetailModal.tsx` を新規作成（既存 `Modal.tsx` を使った拡大表示）
6. `app/museum/page.tsx` を変更（`getArtsByCountDesc` / `getArtsByCountAsc` / `getThemeList`
   を並列取得して `MuseumPage` に渡す）
7. `components/pages/MuseumPage.tsx` を書き換え（3セクション構成、テーマ検索の
   state管理、拡大表示モーダルの開閉、`ArtCard`/`ArtSection` 等の組み込み）
8. 動作確認（`npm run dev`）
   - `/museum` にアクセスし、「画数が多い作品」「画数が少ない作品」が
     それぞれ横スクロールで表示される
   - テーマ選択＋検索ボタンで該当作品が「検索結果」セクションに表示される
   - 画数（下限）を入力した場合に結果が絞り込まれる
   - 各カードをタップ（クリック）すると拡大モーダルが開き、テーマ・作成者名・
     絵柄が表示され、背景クリックまたは閉じる操作でモーダルが閉じる
   - 作品0件のテーマ・画数条件で「該当する作品がありません」等の空表示になる

## 8. 確認事項（実装前に認識合わせしたいポイント）

- 「画数が多い/少ない作品」の表示件数（現状 `take: 20` のまま踏襲でよいか、
  横スクロールなので上限を増減するか）
- テーマ検索の画数条件は「この画数以上」のみでよいか、範囲指定（以上・以下の両方）
  まで必要か
- 拡大表示モーダルのサイズ・情報量（テーマ・作成者名のみでよいか、作成日時や
  画数の数値も表示するか）
- `getArts()`（作成日時降順の全件取得）を削除してよいか、それとも別画面用に残すか
