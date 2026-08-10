# モバイル版フッター追加 実装計画

作成日: 2026-08-11
対象: `app/layout.tsx`、新規 `components/organisms/Footer.tsx`

## 1. 目的

モバイル端末（スマートフォン・タブレット）で閲覧しているときだけ、画面下部に
ヘッダーと同じ「リキッドグラス風」の角丸フッターを表示する。アイコンを横並びにした
簡易ナビゲーションとして機能させる。

## 2. 確認済みの方針（ヒアリング済み）

1. モバイル判定は、`components/pages/DrawPage.tsx` に既にある実装
   （`/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)`）と同じUser-Agent判定方式を使う。
   画面幅によるレスポンシブ表示（CSSブレークポイント）や `/mobile` ページ限定ではない。
2. フッターに並べるアイコン（遷移先）は以下の4つ。既存の `AccessMenu.tsx`
   （ハンバーガーメニュー）と同じ項目・同じアイコンを使う。
   - ホーム `/` … `TbHome`
   - ロビー `/lobby` … `TbUsersGroup`
   - 試し書き `/drawing` … `TbPencil`
   - 美術館 `/museum` … `MdOutlineMuseum`

## 3. デザイン仕様

`components/organisms/Header.tsx` の見た目をそのまま踏襲し、上下を反転させる。

Headerの実装（参考）:
```
h-14 fixed top-2 left-1/2 -translate-x-1/2 border border-2 border-white
rounded-full w-[75%] min-w-[300px] z-40 shadow-md bg-white/50 backdrop-blur-xs
```

フッターはこれと同じクラス構成で、`top-2` を `bottom-2` に変える（`fixed bottom-2 left-1/2
-translate-x-1/2` で画面下中央に固定）。中身はハンバーガーメニューの代わりに
4アイコンを `flex justify-around items-center` で横並びにする。

- 新しいCSS・新しいライブラリは追加しない（`liquid-glass-react` パッケージは
  `package.json` に依存関係としてあるが、Header自体もこれを使わずTailwindのクラスだけで
  「リキッドグラス風」を表現しているため、フッターも同様にTailwindクラスのみで実装する）。
- アイコンサイズ・色は `AccessMenu.tsx` の `IconContext.Provider` と同程度（1.5em前後）を踏襲。
- 現在地のハイライト（アクティブタブ表現）は本計画のスコープ外とする（既存のHeader/AccessMenuにも
  現在地ハイライトの仕組みがなく、踏襲する既存デザインに存在しないため）。必要であれば別途追加を検討。

## 4. モバイル判定の実装方針

`components/pages/DrawPage.tsx` の既存パターンをそのまま踏襲する。

```tsx
"use client";
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
}, []);

if (!isMobile) return null;
```

- `navigator.userAgent` はブラウザにしか存在しないため、コンポーネントは `"use client"` にし、
  初回レンダリング（サーバー・クライアントとも）では `isMobile = false` としてフッターを
  描画しない。マウント後の `useEffect` でUser-Agentを判定し、モバイルであれば
  再レンダリングでフッターを表示する。これによりSSR時とクライアント初回描画のHTMLが一致し、
  hydrationエラーを避ける。

## 5. 配置場所

`app/layout.tsx`（ルートレイアウト）に `<Header />` と同様に `<Footer />` を追加する。
全ページ共通で、モバイル端末からのアクセス時のみ自動的に表示される。

```tsx
// app/layout.tsx（追加分のみ）
import Footer from "@/components/organisms/Footer";

<body ...>
  <BgObject />
  <Header />
  <Toaster maxVisible={3} />
  <div className="pt-14">{children}</div>
  <footer className="text-center p-4 text-gray-500 text-sm">
    &copy; 2026, Takeru
  </footer>
  <Footer /> {/* 追加: モバイル時のみ表示される固定フッター */}
</body>
```

- 既存のコピーライト表示用 `<footer>`（ページ最下部の通常フロー要素）はそのまま変更しない。
  新しい `<Footer />` は画面下部に固定表示される別要素（liquid glassの丸型バー）であり、
  役割・見た目ともに競合しないため、既存要素を置き換えずに追加する形にする。
- `app/mobile/layout.tsx` は `<html>`/`<body>` を独自に持つ別レイアウトになっており
  （ルートレイアウトと二重構造になっている、既存の未整理ファイルの可能性がある）、
  今回のスコープでは触れない。`/mobile` ページも通常どおりルートレイアウト配下に
  含まれるため、User-Agentがモバイルであれば同様にフッターが表示される。

## 6. コンテンツとフッター固定表示の重なり対策

フッターは `fixed` 配置のため、ページ本文と重なる可能性がある。Headerに対して
`pt-14`（ヘッダー高さ分の余白）を入れているのと同様に、モバイル表示時はページ末尾に
フッター高さ分の余白（例: `pb-20`程度）を持たせることを検討する。ただし以下の理由で
本計画では必須タスクとしない。

- 影響範囲がルートレイアウト配下の全ページに及ぶため、余白追加によるレイアウト崩れが
  ないか実装時に個別確認が必要。
- まずはフッター自体を表示させ、実機（またはUser-Agentを偽装したブラウザ）で見た目を
  確認したうえで、重なりが実際に問題になる画面があれば個別に対応する方が安全。

## 7. 実装タスク一覧

1. `components/organisms/Footer.tsx` を新規作成
   - `"use client"`、User-Agent判定による `isMobile` state（DrawPage.tsxと同じロジック）
   - `isMobile` が `false` の間は `null` を返す
   - Headerと同じクラス構成のliquid glass角丸バー（`bottom-2` 固定）
   - `TbHome` / `TbUsersGroup` / `TbPencil` / `MdOutlineMuseum` の4アイコンを
     `next/link` の `Link` でそれぞれ `/`・`/lobby`・`/drawing`・`/museum` に紐付け、
     `flex justify-around items-center` で横並びに配置
2. `app/layout.tsx` に `<Footer />` を追加（`<Header />` と同階層、bodyの末尾付近）
3. 動作確認
   - ブラウザの開発者ツールでUser-Agentをモバイル端末に偽装し、フッターが表示されることを確認
   - デスクトップUser-Agentでは表示されないことを確認
   - 各アイコンタップでそれぞれの遷移先に正しく遷移することを確認
   - 主要ページ（トップ・ロビー・ルーム内・美術館など）でフッターが本文と重なって
     操作の妨げになっていないか目視確認

## 8. 未確定事項（実装着手前に確認したい点）

- コンテンツとの重なり対策（6節の余白追加）を今回のタスクに含めるか、まず表示確認してから
  必要に応じて追加するか
- 現在地のアクティブタブ表現（ハイライト）を今回含めるか、範囲外とするか
