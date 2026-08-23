-- m_userテーブルにアイコン設定用カラムを追加（デフォルト: TbBallBowling / 黒色）
ALTER TABLE m_user ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'TbBallBowling';
ALTER TABLE m_user ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#000000';
