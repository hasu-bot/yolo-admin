-- yolo-platform-dev（旧 otazune）構築用スクリプト。
-- 前提: プロジェクトを「yolo-platform-dev」にリネーム済み・中身はテストデータのみで破棄可。
--
-- 実行方法: dev プロジェクトの SQL Editor で
--   1. このファイルを実行（旧テーブルの破棄）
--   2. 続けて schema.sql を全文実行（フルスキーマ構築）
--
-- 注意: 本番（yolo-platform）では絶対に実行しないこと。

-- ---- otazune 時代の旧テーブルを破棄 ----
drop table if exists messages cascade;
drop table if exists chats cascade;
drop table if exists consultations cascade;

-- ---- 添付ファイル用 storage バケット（yolo-soudan が使用） ----
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- この後、schema.sql を全文実行してテーブルを構築する。
