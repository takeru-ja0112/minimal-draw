import type { TutorialStep } from '../useTutorial';

export const roomTutorialSteps: TutorialStep[] = [
    {
        popover: {
            title: 'ルーム画面',
            description: 'ここでは参加者の確認やお題の変更、描画・回答への導線があります。',
        },
    },
    {
        element: '#tutorial-room-info',
        popover: {
            title: 'ルーム情報',
            description: 'ルーム名とルームIDです。IDをタップするとコピーできます。',
        },
    },
    {
        element: '#tutorial-room-status',
        popover: {
            title: '進行状況',
            description: '今どの段階か（募集中・描画中・回答中など）がわかります。',
        },
    },
    {
        element: '#tutorial-room-auto',
        popover: {
            title: 'お手軽モード',
            description: 'まずはルーム作成者がここをクリックしてゲームを開始してみよう！',
        },
    },
    {
        element: '#tutorial-room-draw',
        popover: {
            title: '描く人はこちら',
            description: 'お題を絵で表現したい人はここから描画画面へ進めます。',
        },
    },
    {
        element: '#tutorial-room-answer',
        popover: {
            title: '答える人はこちら',
            description: 'みんなの絵からお題を当てたい人はここから回答画面へ進めます。',
        },
    },
    {
        element: '#tutorial-room-score',
        popover: {
            title: 'スコア',
            description: '参加者の得点ランキングです。',
        },
    },
    {
        element: '#tutorial-room-reset',
        popover: {
            title: 'チュートリアルはここをクリックするともう一度確認できます。',
        },
    },
];
