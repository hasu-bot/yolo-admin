# Creative YOLO データ基盤 再構築設計（2026-07-09）

> **この文書の役割**: yolo-platform / yolo-platform-dev をどこに・どう作るかの決定記録。
> 全設計文書（yolo-members/docs/creative-yolo/ 00・01・02・22、Notion「YOLO Platform / LINE / Letter. / 管理画面 設計・実装まとめ 2026.07.08」、各リポジトリの schema.sql）を突き合わせて再構築した。

---

## 1. 前提の整理（読み合わせの結果）

### 既存Supabaseの実態

| プロジェクト（推定） | 使うサービス | テーブル | 根拠 |
|---|---|---|---|
| **otazune** | yolo-soudan（本番稼働中） | `users` `consultations` `activity_logs` `chats` `messages` + storage `attachments` | yolo-soudan/server.js のコードから確定 |
| members用 | YOLO HUB（yolo-members） | `yolo_members_*`（全10テーブル、**全部プレフィックス付き**） | yolo-members/supabase/schema.sql |
| lumina用 | lumina | `models` `reservations` | lumina/supabase/schema.sql |

**重要な観察**: `yolo_members_*` と全テーブルにプレフィックスが付いているのは、**他のテーブル群と同じDBに同居することを想定した命名**。素の `users` を持つ otazune と同居している可能性がある（＝実プロジェクト数は3つより少ないかもしれない）。

### yolo-platform の8テーブルと otazune の関係

```
yolo-platform が持つべき8テーブル
├─ users            ← otazune に既にある
├─ consultations    ← otazune に既にある
├─ activity_logs    ← otazune に既にある
├─ user_identities  ── 追加が必要
├─ letter_bookings  ── 追加が必要（※Letter.は本番稼働中なので、既にどこかに存在するはず）
├─ discord_link_codes ─ 追加が必要（※LINE Workerが稼働中なら同上）
├─ events           ── 追加が必要
└─ event_reservations ─ 追加が必要
```

Letter.（letter-camera-consultation.vercel.app）と LINE Worker は本番稼働中で、
`letter_bookings` 等へ実際に書き込んでいる。**その書き込み先が otazune なら、
otazune は既に事実上の yolo-platform である。**

### 設計文書間の矛盾（要認識）

| 論点 | 01-ECOSYSTEM-IA（2026-07 初版） | Notion 2026.07.08（最新） | 本設計の解釈 |
|---|---|---|---|
| DB構成 | 各サービスが専用Supabaseを持つ | ユーザー・LINE・Discord・Letter.・相談・イベント参加は `yolo-platform` に寄せる | **後者が最新の意思決定**。ただし「寄せる」のは横断レイヤーのデータのみ（§2） |
| 共通基盤 | 「全サービスの共通ログイン基盤を今作ることはやらない」 | yolo-platform で名寄せ（user_identities） | 矛盾しない。yolo-platform は**利用者にアカウントを作らせる基盤ではなく、運営側の名寄せレイヤー**。エンドユーザーには見えない |
| イベントの正本 | MEMBERS（Supabase）が正、MAGAZINE は表示側 | MAGAZINE 記事が正本、Supabase `events` は配信用共通データ | **未解消の食い違い**。イベント同期実装（別タスク）の前に 01-ECOSYSTEM-IA §5 の更新が必要 |

---

## 2. 再構築後の全体像（2層モデル）

```
┌────────────────── サービス層（従来どおり・変更なし）──────────────────┐
│                                                                    │
│  HUB (yolo-members)      lumina           MAGAZINE (WordPress)     │
│  yolo_members_* ─ 専用DB  models/reservations ─ 専用DB   記事の正本   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────── プラットフォーム層（今回の再構築対象）────────────────┐
│                                                                    │
│  Supabase Project: yolo-platform（= otazune を昇格）                 │
│                                                                    │
│  users / user_identities / activity_logs         ← 名寄せ・履歴      │
│  consultations / chats / messages                ← yolo-soudan     │
│  letter_bookings                                 ← Letter.         │
│  discord_link_codes                              ← LINE Worker     │
│  events / event_reservations                     ← イベント同期(将来) │
│                                                                    │
│  書き込み: yolo-soudan / Letter. / LINE Worker / 同期Webhook(将来)   │
│  読み書き（運営）: yolo-admin（本リポジトリ・service role・Basic認証）  │
└────────────────────────────────────────────────────────────────────┘
```

**設計原則**:
1. **サービス層のDBは動かさない**。HUB・lumina は従来どおり専用DB。移行コストゼロ・リスクゼロ。
2. **プラットフォーム層は「外部接点と名寄せ」だけを持つ**。LINE・Letter.・相談・Discord連携・イベント配信という「人が最初に触れる接点」のデータ。
3. **利用者にアカウントは作らせない**（01-IA の原則を維持）。名寄せは運営側の関心事。
4. **新しいDBを作るのではなく、otazune を育てて yolo-platform にする**。相談の実データ・稼働中の yolo-soudan をそのまま活かす。

---

## 3. Supabase プロジェクト配置（2枠制限への回答）

Supabase Free プランの「アクティブ2プロジェクトまで」は **organization 単位**。
organization は複数作れる。

### 推奨配置

| Organization | プロジェクト | 役割 |
|---|---|---|
| 既存 org（otazune がいる場所） | **otazune → `yolo-platform` にリネーム** | プラットフォーム層・本番 |
| 既存 org の空き枠 or 新 org | **`yolo-platform-dev`（新規作成）** | 開発・テスト用 |
| （現状のまま） | members用 / lumina用 | サービス層（触らない） |

- プロジェクト名のリネームは Supabase ダッシュボードから可能で、**URL（project ref）とキーは変わらない**ため、稼働中の yolo-soudan・Letter.・LINE Worker には無影響。
- 既存 org の2枠が埋まっている場合は、`yolo-platform-dev` だけ新 org に作ればよい（本番と dev が別 org でも運用上の問題はない）。
- **新しい本番DBは作らない**ので、2枠制限の圧迫は最小（dev の1枠のみ）。

### やること（順番どおり）

1. **確認**: otazune の Table Editor で `letter_bookings` / `discord_link_codes` の有無を確認
   - **ある** → otazune は既に事実上の yolo-platform。リネームだけで完了
   - **ない** → Letter./LINE Worker の書き込み先プロジェクトを特定し、どちらかに寄せる（別途計画）
2. otazune を `yolo-platform` にリネーム
3. 不足テーブルを migration で追加（`supabase/migrations/` 方式。本リポジトリの想定スキーマ `supabase/schema.sql` を実スキーマに合わせて修正した上で適用）
4. `yolo-platform-dev` を新規作成し、同じスキーマを適用
5. yolo-admin の `.env.local` / Vercel 環境変数に接続情報を設定
6. バックアップSOPの対象を更新（02-YOLO-OS SOP-7: members / **platform** / lumina の3つ）

---

## 4. この構成が各設計文書と整合する理由

- **00-MASTER-PLAN §7（意思決定基準）**: 「創設者がいなくても回せる形にできるか」→ 運営の一元管理画面はSOP運用の前提装置。3つの循環（相談→案件、参加→活動、観客→参加）の**状態を1画面で見る**のが yolo-admin。
- **22-NO-LIST #3（新サイト禁止）**: yolo-admin は公開サービスではなく運営内部ツール。Web戦略3軸（公式・MAGAZINE・HUB）は増えない。
- **01-ECOSYSTEM-IA §5（作りすぎない）**: サービス層のDB統合はしない。統合するのは外部接点レイヤーのみ。共通ログインも作らない。
- **06-MANIFESTO / バリュー4**: 「人がやらなくていいことはAIに」— 依頼・相談・連携の突き合わせ作業を手作業からツールに移す。

## 5. 未決事項（実装前に要判断）

| # | 論点 | 期限 |
|---|---|---|
| 1 | otazune に `letter_bookings` があるかの確認（§3-1） | 次の作業前 |
| 2 | イベント正本の食い違い解消（01-IA §5 の改訂） | イベント同期実装前 |
| 3 | `chats` / `messages`（相談チャット）を yolo-admin の依頼詳細に表示するか | v2以降でよい |
| 4 | yolo-soudan の `users.user_labels` カラム名 vs 本リポジトリ想定の `users.labels` の差異確認 | スキーマ突き合わせ時 |

---

*初版: 2026-07-09 ／ otazune の中身確認後、§3 の手順を確定してから実行に移すこと*
