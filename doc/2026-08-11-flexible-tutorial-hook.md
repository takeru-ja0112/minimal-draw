# チュートリアル表示の汎用化 実装計画（RoomPage・AnswerPageへの適用）

作成日: 2026-08-11
対象ファイル: `hooks/tutorial/useTutorial.ts`、`components/pages/Top.tsx`、
`components/pages/RoomPage.tsx`、`components/pages/AnswerPage.tsx`

## 1. 目的

現在 `hooks/tutorial/useTutorial.ts` はTOP画面専用のステップ（名前設定・ルーム検索など）が
ハードコードされており、TOP画面（`Top.tsx`）でしか使えない。これを汎用化し、
`RoomPage.tsx`（ルーム画面）・`AnswerPage.tsx`（回答画面）でもそれぞれ独自のステップ内容で
チュートリアルを表示できるようにする。

## 2. 現状の実装と問題点

```ts
// hooks/tutorial/useTutorial.ts（現状）
export function resetTutorial() {
    localStorage.removeItem('has_seen_tutorial');
    window.dispatchEvent(new Event('start_tutorial'));
}

export function useTutorial() {
    useEffect(() => {
        const driverObj = driver({
            steps: [ /* TOP画面専用のステップが7個ハードコード */ ],
            onDestroyed: () => localStorage.setItem('has_seen_tutorial', 'true'),
        });
        window.addEventListener('start_tutorial', startTutorial);
        const isCompleted = localStorage.getItem('has_seen_tutorial');
        if (!isCompleted) startTutorial();
        ...
    }, []);
}
```

問題点:

- `steps` がハードコードされており、他画面から呼び出しても常にTOP画面のステップが表示される。
- 初回表示済みフラグが `has_seen_tutorial` という単一の `localStorage` キーのため、
  仮にステップだけ差し替えられたとしても、TOPで一度チュートリアルを見ると
  RoomPage・AnswerPageのチュートリアルが「見た事にされて」自動表示されなくなる
  （逆に言うと3画面が同じフラグを共有してしまう）。
- `start_tutorial` イベント名も固定のため、`resetTutorial()` を呼ぶとどの画面にいても
  同じイベントが飛び、複数画面でフックが有効なケースがあれば混線する
  （現状は単一ページ内呼び出しのみなので顕在化していないが、汎用化すると問題になる）。

## 3. 方針

`useTutorial` を「ステップとキーを外から渡せる汎用フック」に変更する。
ページごとに異なる `key`（`'top'` / `'room'` / `'answer'`）を渡すことで、
`localStorage` のフラグとカスタムイベント名をページごとに分離する。

- 完了フラグ: `has_seen_tutorial_${key}`
- 再表示トリガーのイベント名: `start_tutorial_${key}`
- `resetTutorial(key)` も `key` を必須引数にする（呼び出し側でどのチュートリアルを
  リセットするか明示する）

これにより、TOP・ルーム・回答の3チュートリアルは完全に独立して
「初回のみ自動表示 → 各画面のヘルプボタンでいつでも再表示」という挙動になる。

## 4. `useTutorial.ts` の変更内容

```ts
// hooks/tutorial/useTutorial.ts（変更後のインターフェース）
import type { Config, DriveStep } from 'driver.js';

export type TutorialStep = DriveStep;

type UseTutorialOptions = {
    key: string;                 // 'top' | 'room' | 'answer' など画面を識別するキー
    steps: TutorialStep[];       // 表示するステップ（呼び出し側で組み立てる）
    driverOptions?: Partial<Config>; // showProgress / ボタン文言など上書きしたい場合
};

export function resetTutorial(key: string) {
    localStorage.removeItem(`has_seen_tutorial_${key}`);
    window.dispatchEvent(new Event(`start_tutorial_${key}`));
}

export function useTutorial({ key, steps, driverOptions }: UseTutorialOptions) {
    useEffect(() => {
        if (steps.length === 0) return; // 対象要素が揃っていない等でステップが空なら何もしない

        const driverObj = driver({
            showProgress: true,
            doneBtnText: '閉じる',
            nextBtnText: '次へ',
            prevBtnText: '戻る',
            ...driverOptions,
            steps,
            onDestroyed: () => {
                localStorage.setItem(`has_seen_tutorial_${key}`, 'true');
            },
        });

        const startTutorial = () => driverObj.drive();
        const eventName = `start_tutorial_${key}`;
        window.addEventListener(eventName, startTutorial);

        const isCompleted = localStorage.getItem(`has_seen_tutorial_${key}`);
        if (!isCompleted) startTutorial();

        return () => {
            window.removeEventListener(eventName, startTutorial);
            driverObj.destroy();
        };
        // steps はページ側で useMemo 済みの安定参照を渡す前提（後述）
    }, [key, steps, driverOptions]);
}
```

補足:

- `steps` を呼び出し側が動的に組み立てるケース（例: `AnswerPage` で回答者かどうかにより
  ステップを出し分ける）があるため、呼び出し側では `useMemo` でステップ配列を
  安定させてから渡す（毎レンダーで新配列になり `useEffect` が再実行され続けるのを防ぐ）。
- `steps.length === 0` の場合は何もしない（対象要素が無い状態でdriver.jsを開始しない）。

## 5. ステップ定義の切り出し

各画面のステップ配列は `useTutorial.ts` から分離し、以下のように画面ごとのファイルに置く。

```
hooks/tutorial/useTutorial.ts        … 変更（汎用フック本体・resetTutorial）
hooks/tutorial/steps/top.ts          … 新規（現行のTOP用ステップをそのまま移植）
hooks/tutorial/steps/room.ts         … 新規（RoomPage用ステップ）
hooks/tutorial/steps/answer.ts       … 新規（AnswerPage用ステップ）
```

`top.ts` は既存の7ステップ（`#tutorial-name-setting` など）をそのまま移す
（要素IDの変更なし、`Top.tsx` 側の修正は呼び出し方法のみ）。

## 6. RoomPage への適用

### 6.1 対象要素とID付与

`components/pages/RoomPage.tsx` に以下のIDを追加する（見た目・挙動の変更はなし、
`id` 属性の追加のみ）。

| ID | 対象箇所（現在の行付近） |
| --- | --- |
| `tutorial-room-info` | ルーム名・ルームID表示エリア（RoomPage.tsx:106-119） |
| `tutorial-room-status` | `<StatusBar>`（RoomPage.tsx:120） |
| `tutorial-room-draw` | 「描く人はこちら」Card（RoomPage.tsx:131-163） |
| `tutorial-room-answer` | 「答える人はこちら」Card（RoomPage.tsx:166-191） |
| `tutorial-room-score` | Scoreセクション（RoomPage.tsx:197） |
| `tutorial-room-reset` | 新規追加するヘルプ（?）ボタン |

### 6.2 ステップ内容案（`hooks/tutorial/steps/room.ts`）

```ts
export const roomTutorialSteps: TutorialStep[] = [
    { popover: { title: 'ルーム画面', description: 'ここでは参加者の確認やお題の変更、描画・回答への導線があります。' } },
    { element: '#tutorial-room-info', popover: { title: 'ルーム情報', description: 'ルーム名とルームIDです。IDをタップするとコピーできます。' } },
    { element: '#tutorial-room-status', popover: { title: '進行状況', description: '今どの段階か（募集中・描画中・回答中など）がわかります。' } },
    { element: '#tutorial-room-draw', popover: { title: '描く人はこちら', description: 'お題を絵で表現したい人はここから描画画面へ進めます。' } },
    { element: '#tutorial-room-answer', popover: { title: '答える人はこちら', description: 'みんなの絵からお題を当てたい人はここから回答画面へ進めます。' } },
    { element: '#tutorial-room-score', popover: { title: 'スコア', description: '参加者の得点ランキングです。' } },
    { element: '#tutorial-room-reset', popover: { title: 'チュートリアルはここをクリックするともう一度確認できます。' } },
];
```

### 6.3 `RoomPage.tsx` 側の変更

```tsx
import { useTutorial, resetTutorial } from '@/hooks/tutorial/useTutorial';
import { roomTutorialSteps } from '@/hooks/tutorial/steps/room';
import { TbQuestionMark } from 'react-icons/tb';

// コンポーネント内
useTutorial({ key: 'room', steps: roomTutorialSteps });

// JSX内、Top.tsxのヘルプボタンと同じスタイルで追加
<button
  id="tutorial-room-reset"
  className="flex text-sm fixed top-20 left-2 z-50 border border-3 rounded-full p-1 hover:bg-gray-200 bg-white/70"
  onClick={() => resetTutorial('room')}
>
  <TbQuestionMark className="text-xl" />
</button>
```

（`RoomPage.tsx` には既に左上に「戻る」リンクがあるため、ヘルプボタンは重ならない位置
　＝Top.tsxと同じ `top-20 left-5` 付近、または戻るリンクの右隣に配置する。実装時に
　既存レイアウトを見ながら調整する。）

## 7. AnswerPage への適用

### 7.1 対象要素とID付与

`components/pages/AnswerPage.tsx` に以下のIDを追加する。

| ID | 対象箇所（現在の行付近） |
| --- | --- |
| `tutorial-answer-status` | `<StatusBar>`（AnswerPage.tsx:347） |
| `tutorial-answer-canvas` | カーテン演出付きキャンバスエリア（AnswerPage.tsx:432-514） |
| `tutorial-answer-nav` | 前へ／次へボタン（AnswerPage.tsx:419-529内の矢印ボタン） |
| `tutorial-answer-input` | 回答入力欄（AnswerPage.tsx:536-559、`isAnswerRole` の時のみ存在） |
| `tutorial-answer-submit` | 「回答する」ボタン（AnswerPage.tsx:565-571、同上） |
| `tutorial-answer-reset` | 新規追加するヘルプ（?）ボタン |

### 7.2 ステップが役割（回答者／閲覧者）で変わる点への対応

`tutorial-answer-input` と `tutorial-answer-submit` は `isAnswerRole` が `true` の
ときしかDOMに存在しない。driver.js は対象要素が存在しないステップがあると
正しくハイライトできないため、`AnswerPage.tsx` 側で `isAnswerRole` を見て
ステップ配列を組み立て、存在しない要素のステップは除外してから
`useTutorial` に渡す。

```tsx
// AnswerPage.tsx 内
const tutorialSteps = useMemo(
  () => buildAnswerTutorialSteps({ isAnswerRole }),
  [isAnswerRole]
);
useTutorial({ key: 'answer', steps: tutorialSteps });
```

```ts
// hooks/tutorial/steps/answer.ts
export function buildAnswerTutorialSteps({ isAnswerRole }: { isAnswerRole: boolean }): TutorialStep[] {
    const steps: TutorialStep[] = [
        { popover: { title: '回答画面', description: 'みんなが描いたイラストからお題を当てます。' } },
        { element: '#tutorial-answer-status', popover: { title: '進行状況', description: '今どの段階かがわかります。' } },
        { element: '#tutorial-answer-canvas', popover: { title: 'イラスト表示', description: '「ひらく」を押すとカーテンが開いてイラストが見られます。' } },
        { element: '#tutorial-answer-nav', popover: { title: '次のイラストへ', description: '矢印ボタンで他の人のイラストに切り替えられます。' } },
    ];

    if (isAnswerRole) {
        steps.push(
            { element: '#tutorial-answer-input', popover: { title: '回答入力', description: 'わかったお題をここに入力します。' } },
            { element: '#tutorial-answer-submit', popover: { title: '回答する', description: '入力できたらここを押して回答します。' } },
        );
    }

    steps.push({ element: '#tutorial-answer-reset', popover: { title: 'チュートリアルはここをクリックするともう一度確認できます。' } });

    return steps;
}
```

注意点: `isAnswerRole` は `useEffect` での非同期取得（`checkAnswerRole`）により
初回レンダー後に確定するため、初回自動表示のタイミングでは `false` 扱いのステップで
開始される可能性がある。挙動としては許容する（回答者用ステップが無い状態で
チュートリアルが始まっても、ヘルプボタンから再表示すればそのとき確定した
`isAnswerRole` を反映したステップになる）。より厳密にしたい場合は
「`isAnswerRole` の取得が完了するまで `useTutorial` を呼ばない」対応も
実装時に検討する（オプション、必須ではない）。

### 7.3 `AnswerPage.tsx` 側の変更

```tsx
import { useTutorial, resetTutorial } from '@/hooks/tutorial/useTutorial';
import { buildAnswerTutorialSteps } from '@/hooks/tutorial/steps/answer';

const tutorialSteps = useMemo(
  () => buildAnswerTutorialSteps({ isAnswerRole }),
  [isAnswerRole]
);
useTutorial({ key: 'answer', steps: tutorialSteps });
```

ヘルプボタンはTOP・RoomPageと同様に固定配置のアイコンボタンを追加し、
`onClick={() => resetTutorial('answer')}` を設定する。

## 8. Top.tsx 側の変更（呼び出し方法のみ）

```tsx
// 変更前
useTutorial();
...
onClick={() => resetTutorial()}

// 変更後
useTutorial({ key: 'top', steps: topTutorialSteps });
...
onClick={() => resetTutorial('top')}
```

`topTutorialSteps` は `hooks/tutorial/steps/top.ts` からimportする
（内容は現行の `useTutorial.ts` 内のステップ配列をそのまま移植、変更なし）。

## 9. 共通化の検討（任意・推奨）

ヘルプ（?）ボタンはTOP・Room・Answerの3箇所でほぼ同じ見た目・同じロジック
（`resetTutorial(key)` を呼ぶだけ）になるため、重複を避けたい場合は
小さい共通コンポーネントを切り出す。

```tsx
// components/molecules/TutorialHelpButton.tsx（新規・任意）
export default function TutorialHelpButton({
  tutorialKey,
  id,
  className,
}: { tutorialKey: string; id: string; className?: string }) {
  return (
    <button
      id={id}
      className={`flex text-sm border border-3 rounded-full p-1 hover:bg-gray-200 ${className ?? ''}`}
      onClick={() => resetTutorial(tutorialKey)}
    >
      <TbQuestionMark className="text-xl" />
    </button>
  );
}
```

位置決め用のクラス（`fixed top-20 left-5` など）は各ページ側から `className` で渡し、
コンポーネント自体はスタイル・ロジックの共通化のみ担う。必須ではないため、
実装時にファイル数を増やしたくなければ各ページにベタ書きでもよい。

## 10. 実装タスク一覧

1. `hooks/tutorial/useTutorial.ts` を汎用化（`key` / `steps` / `driverOptions` を
   引数に取る形に変更、`resetTutorial(key)` に変更）
2. `hooks/tutorial/steps/top.ts` を新規作成し、既存のTOP用ステップをそのまま移植
3. `hooks/tutorial/steps/room.ts` を新規作成し、RoomPage用ステップを定義
4. `hooks/tutorial/steps/answer.ts` を新規作成し、`buildAnswerTutorialSteps` を定義
5. `components/pages/Top.tsx`: `useTutorial()` / `resetTutorial()` の呼び出しを
   新インターフェースに合わせて修正（IDは変更なし）
6. `components/pages/RoomPage.tsx`:
   - 6.1のIDを各要素に追加
   - `useTutorial({ key: 'room', steps: roomTutorialSteps })` を追加
   - ヘルプボタン（`#tutorial-room-reset`）を追加
7. `components/pages/AnswerPage.tsx`:
   - 7.1のIDを各要素に追加
   - `buildAnswerTutorialSteps` + `useMemo` + `useTutorial({ key: 'answer', ... })` を追加
   - ヘルプボタン（`#tutorial-answer-reset`）を追加
8. （任意）`components/molecules/TutorialHelpButton.tsx` を新規作成し、
   3画面のヘルプボタンをこれに置き換える
9. 動作確認（`npm run dev`）
   - 各画面に初めてアクセスしたときだけ、その画面用のチュートリアルが自動表示される
   - 一方の画面のチュートリアルを見ても、他画面のチュートリアルは初回表示のまま
     （`localStorage` のキーがページごとに独立していること）
   - 各画面のヘルプ（?）ボタンから、その画面のチュートリアルだけが再表示される
   - AnswerPageで回答者役／閲覧者役それぞれの場合でステップ内容が変わることを確認

## 11. 確認事項（実装前に認識合わせしたいポイント)

- RoomPage・AnswerPageのヘルプボタンの配置位置（左上固定 or 各画面の空いているスペース）
- RoomPage・AnswerPageのステップ内容・文言（本計画の案はドラフトのため、
  実際の文言は実装時に調整可能）
- ヘルプボタン共通化コンポーネント（9章）を作るかどうか
