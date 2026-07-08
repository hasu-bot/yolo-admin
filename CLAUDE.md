# yolo-admin

Creative YOLO を横断管理する管理画面。Letter.（撮影相談アプリ）とは独立した Next.js アプリで、
Letter. の API（`api/yolo-admin.js`）には依存せず yolo-platform Supabase に直接接続する。

@AGENTS.md

## スタック
- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS v4
- 認証: Basic認証（`proxy.ts`。Next.js 16 で `middleware` は `proxy` に名称変更されている点に注意）
- DB: Supabase（`lib/supabase-server.ts`: service role キーのみ・サーバー専用）

## コマンド
- `npm run dev` … 開発サーバー
- `npm run build` … ビルド＋型チェック（変更後は必ず通すこと。ESLint は未導入）
- env は `.env.local.example` を参照（ビルドは env 無しでも通る）

## 重要な前提（README.md も参照）
- `supabase/schema.sql` は実スキーマ未確認のまま画面仕様から逆算した想定スキーマ。yolo-platform の
  実テーブルが判明したら最優先でこのファイルと `lib/types.ts` / `lib/data.ts` を合わせること
- Letter. 側の旧実装（`yolo-admin.html` 等）は参照できないまま実装したため、ロジックの細部は
  未検証。差異に気づいたら README.md に追記する

## ルール
- `SUPABASE_SERVICE_ROLE_KEY` を使う処理はサーバー専用に保つ（`getServiceClient` の制約を崩さない。
  クライアントコンポーネント・ブラウザに露出させない）
- DB スキーマ変更は `supabase/migrations/` に日付付きファイル（`YYYYMMDD-短い説明.sql`）で追加し、
  `supabase/schema.sql` も更新する（`supabase/README.md` 参照）
- Letter. 単体の管理画面（`admin.html`、Letter. リポジトリ側）には触れない。yolo-admin は完全に別物
- `.env*` は読まない・コミットしない
- 事業判断は yolo-members リポジトリの `docs/creative-yolo/` が正。単独セッションでは add_repo で参照

## デプロイ
Vercel（Letter. とは別プロジェクトとして新規作成）

## コミット規約
Conventional Commits + 日本語本文（例: `feat: 依頼一覧のステータス変更機能を追加` / `fix: ユーザー検索のフィルタ条件を修正`）
