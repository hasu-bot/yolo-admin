-- yolo-platform Supabase の実スキーマ・スナップショット（正）。
-- 2026-07-09 に本番プロジェクトの information_schema ダンプから採取した。
--
-- 用途:
--   1. yolo-platform-dev（開発DB）のフル構築（supabase/dev-setup.sql から参照）
--   2. スキーマの正本ドキュメント
-- 本番（yolo-platform）には全テーブルが既に存在するため、このファイルを本番へ再適用する必要はない。
--
-- スキーマ変更は必ず supabase/migrations/ に日付付きファイルで追加し、本ファイルにも反映すること。

create extension if not exists pgcrypto;

-- ---- 名寄せ・ユーザー基盤 ----

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  nickname text,
  email text,
  phone text,
  instagram text,
  generation text,
  region text,
  interests text[] not null default '{}',
  user_labels text[] not null default '{}', -- line_registered / discord_member / letter_user / consultation_user
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  provider text not null,           -- line / discord / letter / consultation / event
  provider_user_id text not null,
  display_name text,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  provider text,
  provider_user_id text,
  activity_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---- Discord 連携（LINE Worker が使用） ----

create table if not exists discord_link_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  discord_user_id text,
  discord_username text,
  created_at timestamptz not null default now()
);

-- ---- 相談（yolo-soudan が使用） ----

create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  category text,
  urgency text,
  nickname text,
  contact text,
  is_anonymous boolean default false,
  file_urls text[],
  status text default 'pending',    -- pending / in_progress / done（+ cancelled）
  discord_message_id text,
  yolo_user_id uuid references users (id) on delete set null,
  is_read boolean not null default false,
  admin_memo text,
  request_type text,
  schedule text,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  yolo_user_id uuid references users (id) on delete set null,
  form_data jsonb not null default '{}'::jsonb,
  status text not null default 'waiting',
  staff_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---- Letter. 撮影依頼 ----

create table if not exists letter_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  source_submission_id text,
  status text not null default 'requested', -- requested / in_progress / completed / cancelled
  booking_data jsonb not null default '{}'::jsonb, -- 依頼内容・followups・admin_memo を格納
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- イベント ----

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  location_name text,
  capacity integer,
  source text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id) on delete cascade,
  user_id uuid references users (id) on delete set null,
  status text not null default 'reserved',
  reserved_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---- その他（LINE Worker 系） ----

create table if not exists film_festival_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  status text not null default 'submitted',
  entry_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists future_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  channel text not null default 'line',
  scheduled_at timestamptz not null,
  message text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---- lumina（本番DBに同居しているが yolo-admin のスコープ外） ----
-- lumina の正本DBがどこかは要確認（lumina リポジトリは専用プロジェクト前提）。
-- dev 構築時にも作成しておく（本番とテーブル構成を揃えるため）。

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agency text not null,
  instagram text,
  genre text,
  profile text,
  photo_url text,
  fee text,
  available_start time,
  available_end time,
  status text not null default 'active',
  is_active boolean not null default true,
  passcode text not null,
  creator_type text not null default 'model',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models (id) on delete cascade,
  date date not null,
  start_time time not null,
  visitor_name text not null,
  created_at timestamptz not null default now()
);

-- ---- インデックス（任意・本番適用も安全） ----

create index if not exists idx_user_identities_user_id on user_identities (user_id);
create index if not exists idx_activity_logs_user_id on activity_logs (user_id);
create index if not exists idx_activity_logs_occurred_at on activity_logs (occurred_at desc);
create index if not exists idx_consultations_status on consultations (status);
create index if not exists idx_consultations_yolo_user_id on consultations (yolo_user_id);
create index if not exists idx_letter_bookings_status on letter_bookings (status);
create index if not exists idx_letter_bookings_user_id on letter_bookings (user_id);
create index if not exists idx_event_reservations_event_id on event_reservations (event_id);
create index if not exists idx_messages_chat_id on messages (chat_id);
