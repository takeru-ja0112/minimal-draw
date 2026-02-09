'use server';
import { supabase } from '@/lib/supabase';
import type { CreateRoom } from '@/type/roomType';

// ルーム一覧を取得
export async function getRooms() {
  try {
    const { data, error } = await supabase.from('rooms').select('*').order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Failed to fetch rooms:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch rooms',
      data: null,
    };
  }
}

export async function getRoomByPageSearch(page: number, pageSize: number, searchTerm: string) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      // roomsテーブル
      .from('rooms')
      // 全カラムと、
      .select('*', {
        count: 'exact',
      })
      // 作成日時の降順
      .order('created_at', {
        ascending: false,
      })
      // ページネーション
      .range(from, to)
      .ilike('room_name', `%${searchTerm}%`);

    if (error) {
      console.error('Failed to fetch rooms by page:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        total: 0,
      };
    }

    return {
      success: true,
      error: null,
      data,
      total: count || 0,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch rooms by page',
      data: null,
      total: 0,
    };
  }
}

// 特定のルームを取得
export async function getRoom(roomId: string) {
  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();

    if (error) {
      console.error('Failed to fetch room:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch room',
      data: null,
    };
  }
}

/**
 * ユーザーIDからルーム一覧を取得
 *
 * @param userId
 * @returns
 */
export async function getRoomsByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('created_by_userId', userId)
      .order('created_at', {
        ascending: false,
      });
    if (error) {
      console.error('Failed to fetch rooms by user ID:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch rooms by user ID',
      data: null,
    };
  }
}

// ルームを作成
export async function createRoomByUsername(createRoomData: CreateRoom) {
  const sanitizedRoomName = createRoomData.roomName;
  const sanitizedUsername = createRoomData.username;
  const sanitizedLevel = createRoomData.level;
  const sanitizedGenre = createRoomData.genre;
  const userId = createRoomData.userId || null;
  let randomTheme;

  try {
    let themeQuery = supabase.from('theme').select('id, theme').eq('level', sanitizedLevel);
    // ジャンルが "ランダム" の場合は genre で絞り込まない
    if (sanitizedGenre !== 'ランダム') {
      themeQuery = themeQuery.eq('genre', sanitizedGenre);
    }
    const { data, error } = await themeQuery;

    if (error) {
      console.error('Failed to fetch random theme:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'null',
        data: null,
      };
    }
    randomTheme = data[Math.floor(Math.random() * data.length)];
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch random theme',
      data: null,
    };
  }

  try {
    // 短いルームIDを生成
    const shortId = generateShortId();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        short_id: shortId,
        created_by_name: sanitizedUsername,
        created_by_userId: userId,
        room_name: sanitizedRoomName,
        current_theme: randomTheme.theme,
        current_theme_id: randomTheme.id,
        level: sanitizedLevel,
        genre: sanitizedGenre,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    };
  }
}

// ルームのステータスを更新
export async function updateRoomStatus(roomId: string, status: 'WAITING' | 'DRAWING' | 'ANSWERING' | 'RESULT') {
  try {
    const { data, error } = await supabase.from('rooms').update({ status }).eq('id', roomId).select().single();

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null,
    };
  }
}

// 回答者を設定
export async function setAnswerer(roomId: string, answererId: string) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        answerer_id: answererId,
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Failed to set answerer:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to set answerer',
      data: null,
    };
  }
}

// お題を設定
export async function setTheme(roomId: string, theme: string) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        current_theme: theme,
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Failed to set theme:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to set theme',
      data: null,
    };
  }
}

// ヘルパー関数: 短いIDを生成
function generateShortId(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

//ショートIDにて検索
export async function getRoomByShortId(shortId: string) {
  const upperShortId = shortId.toUpperCase();

  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('short_id', upperShortId).single();

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'ルームが見つかりません。',
        data: null,
      };
    }

    if (error) {
      console.error('Failed to fetch room by short ID:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch room by short ID',
      data: null,
    };
  }
}
