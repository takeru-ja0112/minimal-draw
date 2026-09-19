ALTER TABLE public.rooms
  ADD COLUMN password varchar(4),
  ADD COLUMN geohash text,
  ADD CONSTRAINT rooms_password_four_digits
    CHECK (password IS NULL OR password ~ '^[0-9]{4}$');