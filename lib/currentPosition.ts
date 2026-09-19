import type { Coordinates } from '@/lib/geohash';

export type PositionErrorReason = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export type PositionResult =
  | { ok: true; coordinates: Coordinates }
  | { ok: false; reason: PositionErrorReason };

export const POSITION_ERROR_MESSAGES: Record<PositionErrorReason, string> = {
  unsupported: 'このブラウザは位置情報に対応していません。',
  denied: '位置情報の利用が許可されませんでした。',
  unavailable: '位置情報を取得できませんでした。',
  timeout: '位置情報の取得がタイムアウトしました。',
};

const POSITION_TIMEOUT_MS = 10_000;

/**
 * 現在地を取得する。ブラウザの許可ダイアログが表示される場合がある。
 * 失敗は例外ではなく reason 付きの結果で返す(呼び出し側で通知内容を決める)。
 */
export function requestCurrentPosition(): Promise<PositionResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, reason: 'unsupported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ ok: true, coordinates: { latitude: coords.latitude, longitude: coords.longitude } }),
      (error) => {
        const reason: PositionErrorReason =
          error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'unavailable';
        resolve({ ok: false, reason });
      },
      { enableHighAccuracy: false, timeout: POSITION_TIMEOUT_MS, maximumAge: 60_000 },
    );
  });
}
