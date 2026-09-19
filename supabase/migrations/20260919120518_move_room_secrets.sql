-- ルームのパスワード(ハッシュ)と位置(geohash)を、anon/authenticatedから読めない別テーブルへ移す。
-- rooms は anon に SELECT が開放されており(Realtime購読用)、平文パスワード・位置を置けないため。
-- 参照: doc/実装計画/20260919_ルームパスワードと近くのルーム検索_実装計画.md

-- 公開してよい「パスワード有無」フラグ(一覧のロック表示用)
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS has_password boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.room_secrets (
  room_id       uuid PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  password_hash text,
  geohash       varchar(7),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_secrets_geohash_format
    CHECK (geohash IS NULL OR geohash ~ '^[0-9b-hjkmnp-z]{7}$')
);

CREATE INDEX IF NOT EXISTS room_secrets_geohash_idx ON public.room_secrets (geohash);

-- 既存の tighten_rls_and_grants と同じ方針: anon/authenticated には一切権限を与えない
REVOKE ALL ON TABLE public.room_secrets FROM anon, authenticated;

-- 旧カラム(20260919094931で追加)からの移行と廃止。本番には旧カラムが無いため存在確認する。
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'password'
  ) THEN
    -- 平文パスワードはSQLでハッシュ化できないため、残っていれば黙って捨てずに中断する
    IF EXISTS (SELECT 1 FROM public.rooms WHERE password IS NOT NULL) THEN
      RAISE EXCEPTION 'rooms.password に値が残っています。移行方法を決めてから再実行してください。';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'geohash'
  ) THEN
    -- 検証済みの7桁形式のみ、先頭7桁に丸めて移す(精度9桁は位置が特定できるため)
    EXECUTE $q$
      INSERT INTO public.room_secrets (room_id, geohash)
      SELECT id, left(geohash, 7)
      FROM public.rooms
      WHERE geohash ~ '^[0-9b-hjkmnp-z]{7}'
      ON CONFLICT (room_id) DO NOTHING
    $q$;
  END IF;
END
$$;

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_password_four_digits;
ALTER TABLE public.rooms
  DROP COLUMN IF EXISTS password,
  DROP COLUMN IF EXISTS geohash;
