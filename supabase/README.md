# supabase/ の運用ルール

## 原則
- `schema.sql` … yolo-platform 実スキーマのスナップショット（正）。2026-07-09 に本番の
  information_schema ダンプから採取・確認済み。スキーマ変更後は必ず更新する
- `migrations/` … 今後のすべての変更はここに追加する。ファイル名は `YYYYMMDD-短い説明.sql`。
  適用済みのファイルは編集しない
- `dev-setup.sql` … yolo-platform-dev（旧 otazune）の初期構築用。本番では実行しない
- ルート直下に一回限りの手パッチ SQL を置かない

## 本番（yolo-platform）について
全テーブルが既に存在するため、初期構築の SQL 適用は不要。
必要なのは storage バケット `attachments` の作成のみ（yolo-soudan の添付ファイル用。
`dev-setup.sql` 内の insert 文と同じものを本番 SQL Editor で実行するか、ダッシュボードから作成）。

## ステータス語彙（重要）
テーブルごとに実値の語彙が異なる。yolo-admin は読み取り時に正準化し、書き込み時に各語彙へ変換する
（`lib/types.ts` の `normalizeStatus` / `STATUS_WRITE_VALUE`）。
- `letter_bookings.status` … requested / in_progress / completed / cancelled
- `consultations.status` … pending / in_progress / done（+ cancelled）
- `chats.status` … waiting ほか（yolo-soudan 管理）
