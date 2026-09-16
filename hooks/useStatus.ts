"use client"

import { supabase } from "@/lib/supabase";
import { getInfoRoom } from "@/app/room/[id]/action";
import { useEffect, useState } from "react";

interface UseStatusType {
    status: string;
    theme:string;
    answerId: string;
    currentDrawingIndex: number;
}

/**
 * ルームステータスの状態を管理するカスタムフック
 * 
 * useEffectでsupabaseの更新処理を検知して状態の変更
 * 
 * useState roomStatus
 * 
 */
export default function useStatus(roomId: string) {
    const [ roomData , setRoomData ] = useState<UseStatusType>({
        status: 'WAITING',
        theme: '',
        answerId: '',
        currentDrawingIndex: 0,
    });


    // ステータス変更を検知した処理
        useEffect(() => {
            const fetchRoomStatus = async () => {
                const { data, error } = await getInfoRoom(roomId);

                if (error) {
                    console.error('Failed to fetch room status:', error);
                    return;
                }

                if (data) {
                    setRoomData({
                        status: data.status,
                        theme: data.current_theme ?? '',
                        answerId: data.answer_id ?? '',
                        currentDrawingIndex: data.current_drawing_index ?? 0,
                    });
                }
            };
    
            fetchRoomStatus();
    
            const subscription = supabase
                .channel('public:rooms')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
                    (payload) => {
                        setRoomData({
                            status: payload.new.status,
                            theme: payload.new.current_theme ?? '',
                            answerId: payload.new.answer_id ?? '',
                            currentDrawingIndex: payload.new.current_drawing_index ?? 0,
                        });
                    }
                )
                .subscribe();
    
            return () => {
                supabase.removeChannel(subscription);
            };
        }, [roomId]);

    return { 
        status : roomData.status,
        currentTheme: roomData.theme,
        answerId: roomData.answerId,
        currentDrawingIndex: roomData.currentDrawingIndex,
     };
}
