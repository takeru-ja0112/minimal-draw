"use client";

import DrawPage from "@/components/pages/DrawPage";

export default function Page() {
    return (
        <DrawPage
            roomId={"123e4567-e89b-12d3-a456-426614174000"}
            mode="demo"
            enabledTools={['line', 'circle', 'rect', 'eraser', 'move', 'pen']}
        />
    );
}