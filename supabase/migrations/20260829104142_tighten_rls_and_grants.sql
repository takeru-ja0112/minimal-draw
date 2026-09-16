-- anon/authenticated ロールの権限を、実際にクライアントが必要とする最小限に絞る。
-- 参照: doc/実装計画/20260829_RLS再設計実装計画.md
--
-- 背景: このアプリのDB書き込みはすべてServer Action経由のPrisma(DATABASE_URL, postgresロール)
-- で行われており、postgresロールはRLS/GRANTの対象外(BYPASSRLS)。
-- ブラウザのanonキーが実際に使っているのはRealtime購読(rooms/drawings/answer_inputsへのSELECT)のみで、
-- insert/update/deleteは一切使っていない。

-- Realtime購読の対象外テーブル: anon/authenticatedの全権限を剥奪
REVOKE ALL ON TABLE public.m_user FROM anon, authenticated;
REVOKE ALL ON TABLE public.points FROM anon, authenticated;
REVOKE ALL ON TABLE public.subscriptions FROM anon, authenticated;
REVOKE ALL ON TABLE public.history_drawings FROM anon, authenticated;
REVOKE ALL ON TABLE public.theme FROM anon, authenticated;

-- Realtime購読の対象テーブル: insert/update/delete等を剥奪し、selectのみ残す
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.rooms FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.drawings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.answer_inputs FROM anon, authenticated;
