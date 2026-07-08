-- yolo-admin が読み書きする yolo-platform Supabase のスキーマ・スナップショット（正）。
--
-- 元プロンプトでは「既存テーブル」として扱う指示だったが、実際にはこのテーブル群を
-- 定義したリポジトリ・ドキュメントが見つからなかったため、本ファイルは
-- yolo-admin の画面仕様から逆算した「想定スキーマ」。yolo-platform 側の実テーブルが
-- 別に存在する場合は、そちらに合わせてこのファイルと lib/types.ts / lib/data.ts を
-- 更新すること。
--
-- スキーマ変更は必ず supabase/migrations/ に日付付きファイルで追加し、
-- このファイルにも反映する。

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  email text,
  labels text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_active_at timestamptz
);

create table if not exists user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  provider text not null check (provider in ('line', 'discord', 'letter', 'consultation', 'event')),
  external_id text not null,
  display_name text,
  is_primary boolean not null default false,
  linked_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  actor text,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  name text not null,
  source text,
  synced_at timestamptz,
  item_count integer,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists event_reservations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references events (id) on delete cascade,
  user_id uuid references users (id) on delete set null,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  requester_name text,
  title text not null,
  body text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'cancelled')),
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists letter_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  requester_name text,
  title text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'cancelled')),
  desired_datetime text,
  shoot_content text,
  notes text,
  admin_memo text,
  booking_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists discord_link_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  code text not null,
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_identities_user_id on user_identities (user_id);
create index if not exists idx_activity_logs_user_id on activity_logs (user_id);
create index if not exists idx_activity_logs_created_at on activity_logs (created_at desc);
create index if not exists idx_consultations_status on consultations (status);
create index if not exists idx_letter_bookings_status on letter_bookings (status);
create index if not exists idx_event_reservations_event_id on event_reservations (event_id);
