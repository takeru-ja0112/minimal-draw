-- ルームIDによる検索用に、5桁の数字コード search_code を rooms に追加する。
-- UNIQUEにはしない(即席ゲーム用の短命レコードのため)。検索は「search_code一致 かつ 直近24時間に作成」で絞る。
-- 構成は数字(0-9)のみ。DEFAULTで採番し、CHECKでも数字5桁を強制する。
-- 参照: doc/実装計画/20260920_ルーム検索方法の改_実装計画.md

-- 1. まずNULL許可・DEFAULTなしで追加(既存行のバックフィル前にNOT NULLにできないため)
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS search_code varchar(5);

-- 2. 既存行をランダムな5桁数字でバックフィル
UPDATE public.rooms
SET search_code = lpad(floor(random() * 100000)::int::text, 5, '0')
WHERE search_code IS NULL;

-- 3. 以降の作成時はDEFAULTで採番(アプリの作成処理は search_code を渡さなくてよい)
ALTER TABLE public.rooms
  ALTER COLUMN search_code SET DEFAULT lpad(floor(random() * 100000)::int::text, 5, '0'),
  ALTER COLUMN search_code SET NOT NULL,
  ADD CONSTRAINT rooms_search_code_five_digits
    CHECK (search_code ~ '^[0-9]{5}$');

-- 4. 「search_code一致 + 作成日時の範囲」で引くための複合インデックス
CREATE INDEX IF NOT EXISTS rooms_search_code_created_at_idx
  ON public.rooms (search_code, created_at);
