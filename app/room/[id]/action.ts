import { supabase } from '@/lib/supabase';
import type { RoomSettingType, Theme } from '@/type/roomType';

/**  ルームのステータスを変更
 *
 *  @param roomId ルームID
 *  @param status 'WATING' | 'DRAWING' | 'ANSWERING' | 'FINISHED' | 'RESETTING'
 */
export async function setStatusRoom(
  roomId: string,
  status: 'WATING' | 'DRAWING' | 'ANSWERING' | 'FINISHED' | 'RESETTING',
) {
  try {
    const { data, error } = await supabase.from('rooms').update({ status }).eq('id', roomId).select().single();

    if (error) {
      console.error('Failed to update room status:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to update room status', data: null };
  }
}

// ルームのを情報を取得
export async function getInfoRoom(roomId: string) {
  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();

    if (error) {
      console.error('Failed to fetch room status:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data: data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch room status', data: null };
  }
}

async function getRandomTheme(roomId?: string) {
  if (roomId) {
    const roomInfoResult = await getInfoRoom(roomId);
    if (roomInfoResult.success && roomInfoResult.data) {
      const roomInfo = roomInfoResult.data;
      try {
        const { data, error } = await supabase
          .from('theme')
          .select('id, theme')
          .eq('level', roomInfo.level)
          .eq('genre', roomInfo.genre);

        if (error) {
          console.error('Failed to fetch themes for specific room settings:', error);
          return { success: false, error: error.message, data: null };
        }

        if (!data || data.length === 0) {
          return { success: false, error: 'No themes found for the specified settings', data: null };
        }

        const randomTheme = data[Math.floor(Math.random() * data.length)];
        return { success: true, error: null, data: randomTheme };
      } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'Failed to fetch random theme', data: null };
      }
    }
  }

  // ルームIDが提供されていない場合、またはルーム情報の取得に失敗した場合は全体からランダムに取得

  try {
    const { data, error } = await supabase.from('theme').select('id, theme');

    if (error) {
      console.error('Failed to fetch random theme:', error);
      return { success: false, error: error.message, data: null };
    }

    if (!data) {
      return { success: false, error: 'null', data: null };
    }
    const randomTheme = data[Math.floor(Math.random() * data.length)];
    return { success: true, error: null, data: randomTheme };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch random theme', data: null };
  }
}

/**
 * ルーム設定をリセットして初期状態に戻す
 * その際にお題を再取得する
 */
export async function resetRoomSettings(roomId: string) {
  const themeResult = await getRandomTheme(roomId);
  const newTheme = themeResult.success && themeResult.data ? themeResult.data : null;

  try {
    const { error } = await supabase.from('drawings').delete().eq('room_id', roomId);

    if (error) {
      console.error('Failed to clear drawings during reset:', error);
      return { success: false, error: error.message, data: null };
    }
  } catch (error) {
    console.error('Unexpected error during drawing clearance:', error);
    return { success: false, error: 'Failed to clear drawings during reset', data: null };
  }

  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        answer_id: null,
        status: 'WAITING',
        current_theme: newTheme?.theme || null,
        current_theme_id: newTheme?.id || null,
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Failed to reset room settings:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to reset room settings', data: null };
  }
}

/**
 * ルームの回答者をリセットする関数
 *
 * ゲームが終了した際に他の回答を確認するために回答者権限をリセットする
 *
 * @param roomId
 * @returns
 */
export async function resetRoomAnswer(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({ answer_id: null, status: 'FINISHED' })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Failed to reset room answerer:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to reset room answerer', data: null };
  }
}

/**
 * ルームのお題を変更する関数
 *
 * @param roomId
 * @param roomSetting
 * @returns
 */
export async function changeRoomTheme({ roomId, roomSetting }: { roomId: string; roomSetting: RoomSettingType }) {
  const { data, error } = await supabase
    .from('theme')
    .select('id, theme')
    .eq('level', roomSetting.level)
    .eq('genre', roomSetting.genre);

  if (error) {
    console.error('Failed to fetch themes for change:', error);
    return { success: false, error: error.message, data: null };
  }

  if (!data || data.length === 0) {
    return { success: false, error: 'No themes found for the specified settings', data: null };
  }

  const randomTheme = data[Math.floor(Math.random() * data.length)];

  try {
    const { data: updateData, error: updateError } = await supabase
      .from('rooms')
      .update({
        current_theme: randomTheme.theme,
        current_theme_id: randomTheme.id,
        level: roomSetting.level,
        genre: roomSetting.genre,
      })
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update room theme:', updateError);
      return { success: false, error: updateError.message, data: null };
    }

    return { success: true, error: null, data: updateData };
  } catch (error) {
    console.error('Unexpected error during theme change:', error);
    return { success: false, error: 'Failed to change room theme', data: null };
  }
}

/**
 * 指定のお題をルームに設定する関数
 */
export async function setRoomTheme(roomId: string, roomSetting: RoomSettingType, themeId: string) {
  try {
    const { data: themeData, error: themeError } = await supabase
      .from('theme')
      .select('id, theme')
      .eq('id', themeId)
      .single();

    if (themeError) {
      console.error('Failed to fetch theme for setting:', themeError);
      return { success: false, error: themeError.message, data: null };
    }

    if (!themeData) {
      return { success: false, error: 'Theme not found', data: null };
    }

    const { data: updateData, error: updateError } = await supabase
      .from('rooms')
      .update({
        current_theme: themeData.theme,
        current_theme_id: themeData.id,
        level: roomSetting.level,
        genre: roomSetting.genre,
      })
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to set room theme:', updateError);
      return { success: false, error: updateError.message, data: null };
    }

    return { success: true, error: null, data: updateData };
  } catch (error) {
    console.error('Unexpected error during theme setting:', error);
    return { success: false, error: 'Failed to set room theme', data: null };
  }
}

const shuffle = (array: Theme[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 0からiの範囲でランダムな索引を選択
    [array[i], array[j]] = [array[j], array[i]]; // 要素を入れ替え
  }
  return array;
};

/**
 * お題を３個取得する関数
 */
export async function getThreeThemes({ level, genre }: { level: string; genre: string }) {
  try {
    const { data, error } = await supabase.from('theme').select('id, theme').eq('level', level).eq('genre', genre);

    if (error) {
      console.error('Failed to fetch three themes:', error);
      return { success: false, error: error.message, data: null };
    }

    const shuffledData = shuffle(data);

    const threeThemes = shuffledData.slice(0, 3);

    return { success: true, error: null, data: threeThemes };
  } catch (error) {
    console.error('Unexpected error during fetching three themes:', error);
    return { success: false, error: 'Failed to fetch three themes', data: null };
  }
}

/**
 * 描画データをリセットする関数
 */
export async function resetDrawingData(roomId: string) {
  try {
    const { error } = await supabase.from('drawings').delete().eq('room_id', roomId);

    if (error) {
      console.error('Failed to reset drawing data:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error during drawing data reset:', error);
    return { success: false, error: 'Failed to reset drawing data' };
  }
}

/**
 * ルームIDでそのルームの得点を取得する関数
 */
export async function getRoomScores(roomId: string) {
  try {
    const { data, error } = await supabase.from('points').select('*').eq('room_id', roomId);

    if (error) {
      console.error('Failed to fetch room scores:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to fetch room scores', data: null };
  }
}

/**
 * 部屋に入った時に参加者得点をDBに登録する関数
 */
export async function registerParticipantScore(roomId: string, userId: string, userName: string) {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('points')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Failed to check participant score:', fetchError);
      return { success: false, error: fetchError.message, data: null };
    }

    if (existing && existing.length > 0) {
      return { success: true, error: null, data: existing, isSkipped: true };
    }

    const { data, error } = await supabase
      .from('points')
      .insert([{ room_id: roomId, user_id: userId, user_name: userName, point: 0 }])
      .select()
      .single();

    if (error) {
      console.error('Failed to register participant score:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data, isSkipped: false };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Failed to register participant score', data: null };
  }
}
