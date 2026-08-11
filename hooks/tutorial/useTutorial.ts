'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function resetTutorial() {
    localStorage.removeItem('has_seen_tutorial');
    window.dispatchEvent(new Event('start_tutorial'));
}

export function useTutorial() {
    useEffect(() => {
        // 1. driver() 内に steps を配列で定義する
        const driverObj = driver({
            showProgress: true,
            doneBtnText: '閉じる',
            nextBtnText: '次へ',
            prevBtnText: '戻る',
            onDestroyed: () => {
                // チュートリアル終了時にフラグを保存
                localStorage.setItem('has_seen_tutorial', 'true');
            },
            steps: [
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
            ],
        });

        const startTutorial = () => {
            driverObj.drive();
        };

        window.addEventListener('start_tutorial', startTutorial);

        const isCompleted = localStorage.getItem('has_seen_tutorial');
        if (!isCompleted) {
            // 2. ツアーを開始する（highlight() は呼ばない）
            startTutorial();
        }

        return () => {
            window.removeEventListener('start_tutorial', startTutorial);
            driverObj.destroy();
        };
    }, []);
}