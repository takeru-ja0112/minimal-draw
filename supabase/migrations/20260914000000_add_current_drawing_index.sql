-- 回答フェーズで現在公開中のイラスト位置を全参加者へ同期する。
-- 0始まりで、0は要素数が最も少ない1枚目を表す。
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS current_drawing_index integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rooms_current_drawing_index_non_negative'
      AND conrelid = 'public.rooms'::regclass
  ) THEN
    ALTER TABLE public.rooms
    ADD CONSTRAINT rooms_current_drawing_index_non_negative
    CHECK (current_drawing_index >= 0);
  END IF;
END
$$;
