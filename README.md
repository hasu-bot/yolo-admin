# yolo-admin

Creative YOLO を横断管理する管理画面。Letter.（撮影相談アプリ）の暫定 `yolo-admin.html` を独立した
Next.js アプリとして切り出したもの。yolo-platform Supabase Project に直接接続する。

## スタック
- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS v4
- DB: Supabase（`lib/supabase-server.ts`: service role キーによるサーバー専用クライアント）
- 認証: Basic認証（`proxy.ts`。Next.js 16 で `middleware` は `proxy` に名称変更されている）

## 重要な前提
- **スキーマは実DBから確認済み（2026-07-09）**: `supabase/schema.sql` は yolo-platform 本番の
  information_schema ダンプから採取した実スキーマのスナップショット。全体設計と構築手順は
  `docs/ARCHITECTURE.md` を参照
- **ステータス語彙はテーブルごとに異なる**: `letter_bookings` は requested/…、`consultations` は
  pending/in_progress/done。yolo-admin は読み取り時に正準化（未対応/対応中/完了/キャンセル）し、
  書き込み時に各アプリの語彙へ変換する（`lib/types.ts`）
- **Letter. 側の実装は未参照**: `yolo-admin.html` / `admin.html` 等はこのセッションから読めなかったため、
  画面仕様と実DBスキーマから実装した。`booking_data`（jsonb）の中のキー名は Letter. 側の実装に
  依存するため、実データで表示を確認して `lib/types.ts` の `bookingTitle` / 詳細画面のキーラベルを調整すること
- **依頼ID表記**: `REQ-2025-050` のような採番は行わず、実データの uuid を使用している

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
