# Creative YOLO データ基盤 再構築設計（確定版 2026-07-09）

> **この文書の役割**: yolo-platform / yolo-platform-dev の構成決定と構築手順の正本。
> 全設計文書（yolo-members/docs/creative-yolo/ 00・01・02・22、Notion「YOLO Platform / LINE / Letter. / 管理画面 設計・実装まとめ 2026.07.08」、各リポジトリの schema.sql）の読み合わせと、
> Supabase ダッシュボードでの実地確認（2026-07-09）に基づく。

---

## 1. 実地確認の結果（2026-07-09 確定）

既存 organization には2プロジェクトが存在する：

| プロジェクト | テーブル（確認済み） | 使っているアプリ |
|---|---|---|
| **yolo-platform** | `users` `letter_bookings` `discord_link_codes` ほか | Letter.・LINE Worker（稼働中） |
| **otazune** | `chats` `consultations` `messages` の3つのみ | yolo-soudan（稼働中） |

判明した事実：

- otazune には `users` / `activity_logs` が**存在しない**。yolo-soudan のコードはこれらへの書き込み失敗を握りつぶす作りのため、エラーにならないまま名寄せ・活動ログが記録されていなかった
- **中身はすべてテストデータ**であり、保全・移行は不要（本番リリース前）
- 2プロジェクトで org の無料枠は満杯

## 2. 確定構成：2層モデル

```
┌────────────── サービス層（従来どおり・触らない）───────────────┐
│  HUB (yolo-members)     lumina            MAGAZINE (WordPress) │
│  yolo_members_* 専用DB   models/reservations 専用DB   記事の正本 │
└────────────────────────────────────────────────────────────────┘

┌────────────── プラットフォーム層（既存org・2枠ぴったり）─────────┐
│                                                                │
│  yolo-platform（既存・本番）      otazune → yolo-platform-dev    │
│  ├ users / user_identities      （リネーム＋スキーマ再構築で     │
│  ├ activity_logs                  開発用として再利用。           │
│  ├ consultations / chats /        新規プロジェクト作成ゼロ）     │
│  │  messages（soudanから移設）                                  │
│  ├ letter_bookings                                             │
│  ├ discord_link_codes                                          │
│  └ events / event_reservations                                 │
│                                                                │
│  書き込み: Letter. / LINE Worker / yolo-soudan（接続先を変更）    │
│  読み書き（運営）: yolo-admin（service role・Basic認証）          │
└────────────────────────────────────────────────────────────────┘
```

**設計原則**:
1. **サービス層のDBは動かさない**。HUB・lumina は従来どおり専用DB。
2. **プラットフォーム層は「外部接点と名寄せ」だけを持つ**。LINE・Letter.・相談・Discord連携・イベント配信。
3. **利用者にアカウントは作らせない**（01-ECOSYSTEM-IA の原則を維持）。名寄せは運営側の関心事。
4. **プロジェクトの新規作成はゼロ**。yolo-platform（既存）が本番、otazune が dev に生まれ変わる。2枠制限に完全に収まる。
5. **相談も yolo-platform に一本化**。yolo-soudan の接続先を otazune から yolo-platform に切り替え、`chats` / `messages` もプラットフォーム層のテーブルとする（これで相談の `users` / `activity_logs` 書き込みが初めて正しく機能する）。

## 3. 構築手順（ランブック）

前提: データはすべてテストのため、破壊的変更可。

### Step 1. 実スキーマの取得 ←今ここ
yolo-platform の SQL Editor で以下を実行し、結果を共有する：
```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```
→ Letter./LINE Worker が実際に使っているカラム定義が正。yolo-admin の想定スキーマ（`supabase/schema.sql` / `lib/types.ts`）をこれに合わせて修正する。

### Step 2. 正準スキーマの確定
実スキーマ＋不足分（`user_identities` / `events` / `event_reservations` / `chats` / `messages` / `activity_logs` のうち無いもの）を統合した正準スキーマを
`supabase/schema.sql` に確定し、不足分の migration を `supabase/migrations/` に作成。
既知の差異: yolo-soudan は `users.user_labels` を参照（yolo-admin 初期実装は `labels` を想定）→ 実スキーマ側に合わせる。

### Step 3. yolo-platform（本番）へ適用
SQL Editor で migration を実行。既存テーブルは変更せず、不足テーブルの追加のみ（Letter./LINE Worker を壊さない）。
storage バケット `attachments`（yolo-soudan の添付用）も作成。

### Step 4. otazune → yolo-platform-dev
1. ダッシュボードでプロジェクト名を `yolo-platform-dev` にリネーム（URL・キーは変わらない）
2. 旧テーブル（chats/consultations/messages）を drop
3. 正準スキーマをフル適用

### Step 5. 接続の切り替え
| アプリ | 変更 |
|---|---|
| yolo-soudan（Railway） | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を yolo-platform のものに変更 |
| yolo-admin（Vercel・ローカル） | `.env.local` / 環境変数に yolo-platform（本番）または dev を設定 |
| Letter. / LINE Worker | 変更なし（既に yolo-platform を向いている） |

### Step 6. 運用の更新
- バックアップSOP（02-YOLO-OS SOP-7）の対象を「members / **platform** / lumina」に読み替え（dev は対象外）
- yolo-admin をローカル→Vercel で実データ確認

## 4. 各設計文書との整合

- **00-MASTER-PLAN §7**: 運営の一元管理はSOP運用（創設者不在でも回る）の前提装置。
- **22-NO-LIST #3（新サイト禁止）**: yolo-admin は内部ツール。Web戦略3軸は増えない。
- **01-ECOSYSTEM-IA §5（作りすぎない）**: サービス層の統合はしない。共通ログインも作らない。統合は外部接点レイヤーのみ。
- **相談データの正本**: 01-IA の「相談＝相談サイト(Supabase)」は維持されるが、その実体が otazune から yolo-platform に移る。01-IA §5 の表の更新を推奨。

## 5. 未決事項

| # | 論点 | 期限 |
|---|---|---|
| 1 | イベント正本の食い違い（01-IA「MEMBERSが正」vs Notion 7/8「MAGAZINE記事が正・Supabaseは配信用」） | イベント同期実装前 |
| 2 | `chats` / `messages` を yolo-admin の依頼詳細に表示するか | v2以降 |
| 3 | otazune 内のテストデータ破棄の最終確認（本文書は破棄前提） | Step 4 実行前 |

---

*確定版: 2026-07-09 ／ Step 1 のスキーマ取得結果を受けて Step 2 以降を実行する*
