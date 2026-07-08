# yolo-admin

Creative YOLO を横断管理する管理画面。Letter.（撮影相談アプリ）の暫定 `yolo-admin.html` を独立した
Next.js アプリとして切り出したもの。yolo-platform Supabase Project に直接接続する。

## スタック
- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS v4
- DB: Supabase（`lib/supabase-server.ts`: service role キーによるサーバー専用クライアント）
- 認証: Basic認証（`proxy.ts`。Next.js 16 で `middleware` は `proxy` に名称変更されている）

## 重要な前提（要確認）
このリポジトリは既存の `letter-camera-consultation`（Letter. 側の実装）を直接参照せず、依頼プロンプトの
仕様書とスクリーンショットのみから新規実装した。以下は未確認のまま進めた点:

- **Supabase スキーマは実在しない想定スキーマ**: `users` / `user_identities` / `letter_bookings` などの
  8テーブルは、既存の8リポジトリのどこにも定義が見つからなかった。`supabase/schema.sql` は画面仕様から
  逆算した想定スキーマ。yolo-platform 側の実テーブルが確定したら、このファイルと `lib/types.ts` /
  `lib/data.ts` のカラム名を実スキーマに合わせて調整すること
- **Letter. 側の実装は未参照**: 移植元とされていた `yolo-admin.html` / `admin.html` 等はこのセッションから
  読めなかったため、画面仕様のみから再実装した。細かいロジック（ステータス遷移の制約など）は
  Letter. 側の実装と食い違う可能性がある
- **依頼ID表記**: スクリーンショットの `REQ-2025-050` のような採番は行っていない（採番テーブルが無いため）。
  実データの `id`（uuid想定）をそのまま使用している

## コマンド
- `npm run dev` … 開発サーバー
- `npm run build` … ビルド＋型チェック（ESLint は未導入。env が無くてもビルドは通る）

## セットアップ
1. `.env.local.example` を `.env.local` にコピー
2. `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を yolo-platform（本番）または
   yolo-platform-dev（開発）の値で設定
3. `ADMIN_PASSWORD` に管理画面用のパスワードを設定（未設定の場合は全リクエストが401になる）
4. `supabase/schema.sql` を対象の Supabase プロジェクトに適用（実テーブルが既にある場合は不要。
   その場合はスキーマの差分を確認すること）

## 構成
```
app/
  (dashboard)/page.tsx     … ダッシュボード
  requests/                … 依頼一覧・詳細（letter_bookings + consultations の統合表示）
  users/                   … ユーザー一覧・詳細（user_identities での名寄せ）
  events/                  … イベント同期一覧（読み取り専用。同期処理は別タスク）
  logs/                    … 活動ログ
  api/                     … Route Handlers（GET一覧・PATCHステータス/メモ更新）
lib/
  supabase-server.ts       … service role クライアント（サーバー専用）
  data.ts                  … Supabase への問い合わせ関数
  types.ts                 … テーブル型・ステータス定義
proxy.ts                   … Basic認証（Next.js 16 の middleware 後継）
supabase/                  … スキーマ・migrations（想定スキーマ。上記「重要な前提」参照）
```

## スコープ外（未実装）
- イベント同期Webhook
- 空き枠管理テーブル・UI
- LINE/Discord からの管理操作

## デプロイ
Vercel（Letter. とは別プロジェクトとして新規作成する想定）

## コミット規約
Conventional Commits + 日本語本文（例: `feat: 依頼一覧のステータス変更機能を追加`）
