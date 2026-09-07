# Sapporo Bites — ホテル宿泊者向け飲食店紹介サイト (V1)

ホテルロビーのQRコードを起点に、宿泊客が札幌市内の飲食店を探し、Google Mapsや予約サイトへ送客するための多言語Webサイトです。

## セットアップ

```bash
npm install
cp .env.example .env.local  # Supabase・Admin・IP匿名化用の値を設定
npm run dev
```

Supabaseプロジェクトを作成し、`supabase/schema.sql` と `supabase/migrations/202608260001_session_analytics.sql` を順にSQL Editorで実行してからでないとデータは表示されません(下記「Supabase接続」参照)。

`http://localhost:3000` を開くと、開発用のホテル選択画面(QRシミュレーター)が表示されます。実際の運用ではこの画面は使わず、QRコードから直接 `/h/hotel_a` のようなURLへ着地させます。

## URL構成

| URL | 内容 |
|---|---|
| `/h/[hotelId]` | ホテル別トップページ(QR着地点) |
| `/h/[hotelId]/restaurants` | 店舗一覧(`?area=` `?tags=` `?sort=` `?q=` で絞り込み) |
| `/h/[hotelId]/restaurants/[restaurantId]` | 店舗詳細 |
| `/admin/analytics` | Admin限定の営業成果Analytics |
| `/admin/analytics/restaurants/[restaurantId]` | 店舗別の営業成果・日別・ホテル別・アクセス品質 |

現在のダミーホテルID: `hotel_a`, `hotel_b`

## ディレクトリ構成

```
app/
  page.tsx                          … 開発用QRシミュレーター
  h/[hotelId]/layout.tsx            … ホテル文脈+言語Providerの解決
  h/[hotelId]/page.tsx              … ホテル別トップ
  h/[hotelId]/restaurants/page.tsx  … 店舗一覧
  h/[hotelId]/restaurants/[restaurantId]/page.tsx … 店舗詳細
components/                         … UIコンポーネント(カード、フィルター、CTA等)
lib/
  types.ts                          … ドメイン型定義
  supabase/client.ts                … Supabaseクライアント初期化
  repositories/index.ts             … データアクセス層(Supabaseへクエリ)
  i18n/                             … 多言語辞書・ロケール解決
  analytics.ts                      … 計測イベント(Supabase `events` テーブルへinsert)
supabase/
  schema.sql                        … テーブル定義+RLSポリシー+シードデータ(SQL Editorで実行)
```

## データ構造

要件通り、多対多構造+ホテル別中間テーブルで設計しています。

```
hotels
restaurants
restaurant_translations (restaurant_id, locale, name, description, recommended_dish)
areas
tags (id, type, name...)
restaurant_tags (restaurant_id, tag_id)
hotel_restaurants (hotel_id, restaurant_id, distance_m, walking_minutes, display_priority, is_visible)
events (計測イベント)
```

上記の構造でSupabase(PostgreSQL)に実装済みです。`lib/repositories/index.ts` が `supabase.from(...).select(...)` でこれらのテーブルを問い合わせ、`lib/analytics.ts` の `trackEvent` が `events` テーブルにinsertします。ページ(`app/**/*.tsx`)やコンポーネントはデータソースを意識しません。

## Supabase接続

1. [supabase.com](https://supabase.com) でプロジェクトを作成(Region: Northeast Asia (Tokyo) 推奨)
2. Supabaseダッシュボードの SQL Editor で `supabase/schema.sql` を実行
3. 続けて `supabase/migrations/202608260001_session_analytics.sql` を実行(session_id・集計用index・Admin専用RPCを追加)
4. Database → Extensions で **pg_cron** を有効化してから、`supabase/migrations/202609070001_events_retention.sql` を実行(`events` を180日で自動削除する日次ジョブを登録。業務データには影響しません)
5. Settings → API から **Project URL**、**anon / public key**、**service_role key** を取得
6. `.env.local`(ローカル)および Vercel の Environment Variables(本番)に設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ADMIN_PASSWORD=...
   IP_HASH_SALT=...
   ```
7. RLS(Row Level Security)はテーブルごとに有効化済みです。`events` の記録とAnalytics集計はサーバー側の `service_role` だけで行います。`service_role` と `IP_HASH_SALT` は絶対にクライアント側コードや `NEXT_PUBLIC_` 環境変数に含めないでください。

`IP_HASH_SALT` は十分に長いランダム値を本番環境ごとに設定してください。生IPは保存せず、サーバー側でsalt付きHMAC-SHA-256に変換した値だけを `events.ip_hash` に保存します。利用セッション集計はこのmigration適用後に記録されたイベントから有効になります。

`events` テーブルは `202609070001_events_retention.sql` が登録する `pg_cron` ジョブ `purge-old-events` により、`occurred_at` が180日を超えた行が毎日 03:17 UTC に削除されます。削除対象は `events` のみです。動作確認は同ファイル末尾のコメント(dry-run SELECT / `cron.job` / `cron.job_run_details`)を参照。

計測イベントの入力は `lib/serverAnalytics.ts` でサーバー側正規化してから `events` にINSERTします(両経路 = `/api/track` と言語選択Server Action で共通):

- `meta`: 許可キー(`qrId` / `screen` / `source`)のみ。各値は文字列200字まで。`qrId` はさらに `[A-Za-z0-9_-]` 64字までに制限(IP・メール等の混入を防ぐ)。
- `path`: **ルート(pathname)のみ保存**。クエリ文字列・フラグメントは破棄(検索語・QR等がpathに残らない)。
- `hotel_id` / `restaurant_id` / `area_id` / `tag_id`: slug/UUID形式(`[A-Za-z0-9_-]{1,64}`)以外は `null`。
- `language`: 出荷ロケール(`LOCALES`)以外は `null`。
- `/api/track`: 本文が非オブジェクト(`null` / 配列)や 4KB 超の場合は 400 / 413 で拒否。

## 多言語追加方法

1. `lib/i18n/messages/` に新しいロケールのJSONを追加(例: `fr.json`)
2. `lib/types.ts` の `LOCALES` 配列に追加
3. `lib/i18n/locale.ts` の `messagesByLocale` に登録
4. 店舗データ側はSupabaseの `restaurant_translations` テーブルに該当ロケールの行を追加(未登録の場合は自動的に英語→日本語にフォールバック)

## タグ・エリア追加方法

Supabaseの `tags` / `areas` テーブルに1行追加するだけで、フィルターUIに自動反映されます(Table Editorから追加、またはSQL Editorで `insert into ...`)。コード内のハードコーディングはありません。

## 店舗・ホテル追加方法

- 店舗追加: `restaurants` に1件追加 → `restaurant_translations` に翻訳追加 → `restaurant_tags` にタグを紐付け → 対象ホテルごとに `hotel_restaurants` へ距離・徒歩時間・表示優先度を追加(V1のダミーデータのような自動計算は行っていないため、`distance_m` は手動算出するか、緯度経度から計算するSQL/スクリプトを別途用意してください)
- ホテル追加: `hotels` に1件追加するだけで `/h/新ホテルID` が有効になります(あわせて `hotel_restaurants` に紐付けたい店舗を登録)

## 現時点で対象外のもの

予約システム、決済、会員登録・ログイン、口コミ投稿、ポイント、クーポン、高度なAI推薦、GPS現在地取得、店舗向け外部公開Dashboard。

## デザイン方針

- ネイビー(ホテル・夜の街)×コーラル(飲食店の温かみ)の2色パレット
- 多言語(日英中韓)を1つのフォントファミリー(Noto Sans系)で統一し、崩れを防止
- 距離・徒歩時間バッジ(ネイビーのピル型)を全画面共通の視覚アンカーとして採用
