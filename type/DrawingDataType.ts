export interface DrawingDataType {
    canvas_data: {
        lines: Array<any>;
        rects: Array<any>;
        circles: Array<any>;
    };
    created_at: string;
    element_count: number;
    id: string;
    room_id: string;
    theme: string;
    user_id: string;
    user: { username: string | null } | null;
}
