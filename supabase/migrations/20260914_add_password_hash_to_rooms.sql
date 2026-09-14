-- roomsテーブルに入室パスワード用カラムを追加
-- NULL = パスワードなし（オープンな部屋）。値が入っている場合はハッシュ化済みの入室パスワード（4桁数字）
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS password_hash TEXT;
