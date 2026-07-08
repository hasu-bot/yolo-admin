# supabase/ の運用ルール

## 原則
- `schema.sql` … 現在のスキーマのスナップショット（正）。スキーマ変更後は必ず更新する
- `migrations/` … 今後のすべての変更はここに追加する。ファイル名は `YYYYMMDD-短い説明.sql`。適用済みのファイルは編集しない
- ルート直下に一回限りの手パッチ SQL を置かない

## 注意
`schema.sql` / `migrations/20260708-initial-schema.sql` は yolo-admin の画面仕様から逆算した
想定スキーマ。yolo-platform Supabase 側に既存の実テーブルがある場合は、そちらを正として
本ファイルと `lib/types.ts` / `lib/data.ts` を合わせること。
