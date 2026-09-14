type Attempt = { count: number; firstAttemptAt: number };

const attempts = new Map<string, Attempt>();

const WINDOW_MS = 5 * 60 * 1000; // 5分
const MAX_ATTEMPTS = 10;

/**
 * 一定時間内の失敗回数が上限に達しているか判定する
 *
 * プロセス内メモリで管理するため複数インスタンス構成では完全には効かないが、
 * 4桁パスワードへの単純な連続総当たりに対する簡易的な足止めとして機能する
 */
export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) {
    return false;
  }

  if (Date.now() - entry.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  const now = Date.now();

  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
