'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import type { Config, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

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
            popoverClass: 'custom-driver-popover',
            ...driverOptions,
            steps,
            onDestroyed: () => {
                localStorage.setItem(`has_seen_tutorial_${key}`, 'true');
            },
        });

        const startTutorial = () => {
            driverObj.drive();
        };

        const eventName = `start_tutorial_${key}`;
        window.addEventListener(eventName, startTutorial);

        const isCompleted = localStorage.getItem(`has_seen_tutorial_${key}`);
        if (!isCompleted) {
            startTutorial();
        }

        return () => {
            window.removeEventListener(eventName, startTutorial);
            driverObj.destroy();
        };
    }, [key, steps, driverOptions]);
}
