// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@^2.93.1';
import webpush from 'npm:web-push@^3.6.7';

// 環境変数の取得
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

// Supabaseクライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// web-push初期化
webpush.setVapidDetails('mailto:your-email@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// "内容受信: {
// \n  id: \"987aa4df-de0b-44a8-82c9-4826a605baf6\",
// \n  theme: \"カメラ\",
// \n  room_id: \"17dab202-94e7-4b80-a341-e7493d7f2263\",
// \n  user_id: \"929ebb44-f1ea-470b-a39b-60831ae71dcf\",
// \n  user_name: \"stagingWin\",
// \n  created_at: \"2026-01-30T06:36:27.897832+00:00\",
// \n  canvas_data: {\n    lines: [],\n    rects: [ { x: 65, y: 66, width: 193, height: 141, rotation: 0 } ],\n    circles: [\n      { x: 133, y: 148, radius: 49.648766349225646 },
// \n      { x: 139, y: 143, radius: 38.897300677553446 },
// \n      { x: 215, y: 97, radius: 14.7648230602334 },
// \n      { x: 217, y: 94, radius: 6.4031242374328485 },
// \n      { x: 133, y: 145, radius: 63.063460101710255 }\n    ]\n  },
// \n  element_count: 6\n}\n"

serve(async (req: any) => {
  // リクエストボディからタイトル・本文取得
  const { record } = await req.json();

  // 送信する先
  let subscription = null;
  let illustCount = 0;

  try {
    const { data, error } = await supabase.from('drawings').select('canvas_data').eq('room_id', record.room_id);

    if (error) {
      console.error('Failed to get illustrations:', error);
    } else {
      illustCount = data.length;
    }
  } catch (e) {
    console.error('イラスト取得エラー:', e);
  }

  const payload = {
    title: `イラストが更新されました！`,
    body: `${illustCount}枚目のイラストが追加されました！`,
  };

  try {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('room_id', record.room_id).single();

    if (error) {
      console.error('Failed to get subscription for room:', error);
    } else {
      subscription = data.subscription;
    }
  } catch (e) {
    console.error('サブスクリプション情報の取得エラー:', e);
  }

  // 各サブスクリプションに通知送信
  let successCount = 0;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    successCount++;
  } catch (e) {
    console.error('送信エラー:', e);
  }

  return new Response(
    JSON.stringify({
      success: true,
      sent: successCount,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
});
