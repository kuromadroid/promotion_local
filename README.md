# Sapporo Bites — ホテル宿泊者向け飲食店紹介サイト (V1)

ホテルロビーのQRコードを起点に、宿泊客が札幌市内の飲食店を探し、Google Mapsや予約サイトへ送客するための多言語Webサイトです。

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:3000` を開くと、開発用のホテル選択画面(QRシミュレーター)が表示されます。実際の運用ではこの画面は使わず、QRコードから直接 `/h/hotel_a` のようなURLへ着地させます。

## URL構成

| URL | 内容 |
|---|---|
| `/h/[hotelId]` | ホテル別トップページ(QR着地点) |
| `/h/[hotelId]/restaurants` | 店舗一覧(`?area=` `?tags=` `?sort=` `?q=` で絞り込み) |
| `/h/[hotelId]/restaurants/[restaurantId]` | 店舗詳細 |

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
  data/                             … ダミーデータ(hotels/restaurants/areas/tags/翻訳/hotel_restaurants)
  repositories/index.ts             … データアクセス層(★Supabase移行はここだけ変更)
  i18n/                             … 多言語辞書・ロケール解決
  analytics.ts                      … 計測イベント抽象化層(★Supabase移行はここだけ変更)
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

V1では `lib/data/*.ts` にこの構造のダミーデータを直接TypeScriptで保持しています。テーブル構造はそのままSupabaseのスキーマに変換できます。

## Supabaseへの接続方法(将来対応)

1. Supabaseプロジェクトを作成し、上記テーブル構造でスキーマを作成
2. `lib/repositories/index.ts` 内の各関数の中身を、配列操作から `supabase.from("restaurants").select(...)` 等に置き換える
3. `lib/analytics.ts` の `trackEvent` を `supabase.from("events").insert(...)` に置き換える
4. ページ(`app/**/*.tsx`)やコンポーネントは一切変更不要(repositoryの返り値の型が変わらない限り)

## 多言語追加方法

1. `lib/i18n/messages/` に新しいロケールのJSONを追加(例: `fr.json`)
2. `lib/types.ts` の `LOCALES` 配列に追加
3. `lib/i18n/locale.ts` の `messagesByLocale` に登録
4. 店舗データ側は `lib/data/restaurantTranslations.ts` に該当ロケールの行を追加(未登録の場合は自動的に英語→日本語にフォールバック)

## タグ・エリア追加方法

`lib/data/tags.ts` / `lib/data/areas.ts` に1行追加するだけで、フィルターUIに自動反映されます。コード内のハードコーディングはありません。

## 店舗・ホテル追加方法

- 店舗追加: `lib/data/restaurants.ts` に1件追加 → `lib/data/restaurantTranslations.ts` に翻訳追加 → 各ホテルの `lib/data/hotelRestaurants.ts` は起動時に自動計算(距離は緯度経度から自動算出)
- ホテル追加: `lib/data/hotels.ts` に1件追加するだけで `/h/新ホテルID` が有効になります

## V1で未実装のもの(要件通り)

予約システム、決済、会員登録・ログイン、口コミ投稿、ポイント、クーポン、店舗/ホテル管理画面、高度なAI推薦、GPS現在地取得。

## デザイン方針

- ネイビー(ホテル・夜の街)×コーラル(飲食店の温かみ)の2色パレット
- 多言語(日英中韓)を1つのフォントファミリー(Noto Sans系)で統一し、崩れを防止
- 距離・徒歩時間バッジ(ネイビーのピル型)を全画面共通の視覚アンカーとして採用
