import type { TutorialStep } from '../useTutorial';

export function buildAnswerTutorialSteps({ isAnswerRole }: { isAnswerRole: boolean }): TutorialStep[] {
    const steps: TutorialStep[] = [
        {
            popover: {
                title: '回答画面',
                description: 'みんなが描いたイラストからお題を当てます。',
            },
        },
        {
            element: '#tutorial-answer-status',
            popover: {
                title: '進行状況',
                description: '今どの段階かがわかります。',
            },
        },
        {
            element: '#tutorial-answer-canvas',
            popover: {
                title: 'イラスト表示',
                description: '「ひらく」を押すとカーテンが開いてイラストが見られます。',
            },
        },
        {
            element: '#tutorial-answer-nav',
            popover: {
                title: '次のイラストへ',
                description: '矢印ボタンで他の人のイラストに切り替えられます。',
            },
        },
    ];

    if (isAnswerRole) {
        steps.push(
            {
                element: '#tutorial-answer-input',
                popover: {
                    title: '回答入力',
                    description: 'わかったお題をここに入力します。',
                },
            },
            {
                element: '#tutorial-answer-submit',
                popover: {
                    title: '回答する',
                    description: '入力できたらここを押して回答します。',
                },
            },
        );
    }

    steps.push({
        element: '#tutorial-answer-reset',
        popover: {
            title: '再表示',
            description: 'チュートリアルはここをクリックするともう一度確認できます。',
        },
    });

    return steps;
}
