import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getRoom } from '@/app/lobby/action'
import { getDrawingsByRoom } from '@/app/room/[id]/answer/action'

type Room = {
  id: string
  status: string
  current_theme: string | null
  answer_id: string | null
}

interface Drawing {
  id: string
  room_id: string
  element_count: number
  lines: number[][]
  circles: Array<{
    x: number
    y: number
    radius: number
  }>
  rects: Array<{
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }>
}

// ルームの変更をリアルタイムで監視するフック
export function useRoomRealtime(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
    if (!roomId) return

    // 初回データ取得
    const fetchRoom = async () => {
      const { data } = await getRoom(roomId)

      if (data) setRoom(data)
    }

    fetchRoom()

    // リアルタイム監視を設定
    const channel = supabase
      .channel(`room_changes_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE すべてを監視
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}` // 特定のルームのみ
        },
        (payload) => {
          
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room)
          } else if (payload.eventType === 'DELETE') {
            setRoom(null)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  return { room }
}

// 描画データの変更を監視するフック
export function useDrawingsRealtime(roomId: string) {
  const [drawings, setDrawings] = useState<Drawing[]>([])

  useEffect(() => {
    if (!roomId) return

    // 初回データ取得
    const fetchDrawings = async () => {
      const { data } = await getDrawingsByRoom(roomId)
      if (data) setDrawings(data as unknown as Drawing[])
    }

    fetchDrawings()

    // リアルタイム監視
    const channel = supabase
      .channel(`drawings_changes_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // INSERTのみ監視
          schema: 'public',
          table: 'drawings',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setDrawings(prev => {
            const exists = prev.some(d => d.id === payload.new.id)
            if (exists) return prev
            return [...prev, payload.new as Drawing].sort((a, b) => a.element_count - b.element_count)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'drawings',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setDrawings(prev => prev.filter(d => d.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  return { drawings }
}
