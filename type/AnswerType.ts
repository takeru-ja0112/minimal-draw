interface Drawing {
    id: string;
    room_id: string;
    user_id: string;
    user: { username: string | null } | null;
    canvas_data: {
        lines: number[][];
        circles: Array<{ x: number; y: number; radius: number }>;
        rects: Array<{ x: number; y: number; width: number; height: number; rotation: number }>;
    };
    element_count: number;
    created_at: string;
};

interface AnswerPageProps {
    roomId: string;
    drawings: Drawing[];
    theme: ThemePattern | null;
    status: 'WATING' | 'DRAWING' | 'ANSWERING' | 'FINISHED' | 'RESETTING';
};

interface ThemePattern {
    furigana: string;
    kanji: string;
    katakana: string;
}

export type { AnswerPageProps, Drawing, ThemePattern };
