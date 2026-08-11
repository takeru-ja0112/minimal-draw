import type { TutorialStep } from '../useTutorial';

export const topTutorialSteps: TutorialStep[] = [
    {
        popover: {
            title: 'Minimal Drawerへようこそ！',
            description: 'このゲームは、お題を線と丸と長方形で表現するボードゲームです！',
        },
    },
    {
        element: '#tutorial-name-setting',
        popover: {
            title: '名前の設定',
            description: 'まずは自分の名前を設定しましょう。',
        },
    },
    {
        element: '#tutorial-room-setting',
        popover: {
            title: 'ルームの説明',
            description: 'ルームを検索、作成することができます。',
        },
    },
    {
        element: '#tutorial-room-created',
        popover: {
            title: 'ルームの作成',
            description: 'ここをクリックしてルームを作成できます。',
        },
    },
    {
        element: '#tutorial-room-search',
        popover: {
            title: 'ルームの検索条件',
            description: '他の人がルームを作成したら、今日日付で検索してみましょう。',
        },
    },
    {
        element: '#tutorial-room-search-list',
        popover: {
            title: 'ルームの検索一覧',
            description: '一覧に対象が表示されたらタッチしましょう。',
        },
    },
    {
        element: '#tutorial-step-reset',
        popover: {
            title: 'チュートリアルはここをクリックするともう一度確認できます。',
        },
    },
];
