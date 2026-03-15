# 大人げない評価システム — Claude Code 引き継ぎドキュメント

## プロジェクト概要

友人・仲間同士で使う「大人げなさ」を6項目で相互評価し、レーダーチャートで可視化するWebアプリ。ネタ系だが、ちゃんと動くものをリリースする。

## コア機能

### 認証
- **パスワード付き簡易認証**（名前 + パスワードで登録/ログイン）
- 本格的なOAuthは不要。Supabase Authの email/password を使い、メールアドレスの代わりにユーザー名ベースで運用する（`username@otonage.local` のようなダミーメール or カスタムフィールド）
- セッション管理はSupabaseに任せる

### 評価フロー
1. ログインすると、登録済みメンバーの一覧が表示される
2. 各メンバーに対して6項目（1〜10点のスライダー）で評価を入力
3. **自分を評価することはできない**
4. 1人に対して1回だけ評価可能（再評価で上書き可）

### チャート表示ルール
- **他人のチャートを見るには、その人を評価済みである必要がある**（評価がチャート閲覧の鍵）
- **自分のチャートはいつでも見れる**
- チャートには全評価者の**平均値**が表示される
- 評価人数も表示する

### 評価項目（6軸 → 六角形レーダーチャート）
| 項目 | 説明 |
|------|------|
| 失礼さ | 😤 |
| 自意識過剰さ | 🪞 |
| 子供っぽさ | 👶 |
| 脈略のなさ | 🌀 |
| 日頃の行い | 💀 |
| 意味のない優しさ | 🫠 |

スコア: 1（大人）〜 10（大人げない）

### ランキング
- 6項目平均の総合スコアで全員ランキング
- **項目ごとのランキングも閲覧可能**（タブやフィルターで切り替え）
- **5人以上に評価されたユーザーのみ**ランキングに表示（少数評価での偏りを防ぐ）
- 1位は👑表示

## 技術スタック

### フロントエンド
- **Next.js 14+**（App Router）
- **TypeScript**
- **Tailwind CSS**
- レーダーチャートは**SVGで自前描画**（ライブラリ不要、プロトタイプのコードを参考にしてよい）

### バックエンド / DB
- **Supabase**（PostgreSQL + Auth + Realtime）
- 無料枠で十分

### デプロイ
- **Vercel**（Next.jsとの相性最良、無料枠あり）

## データベース設計

### `users` テーブル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `ratings` テーブル
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES users(id) NOT NULL,
  target_id UUID REFERENCES users(id) NOT NULL,
  rudeness INT CHECK (rudeness BETWEEN 1 AND 10),
  self_conscious INT CHECK (self_conscious BETWEEN 1 AND 10),
  childish INT CHECK (childish BETWEEN 1 AND 10),
  random_talk INT CHECK (random_talk BETWEEN 1 AND 10),
  behavior INT CHECK (behavior BETWEEN 1 AND 10),
  useless_kindness INT CHECK (useless_kindness BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rater_id, target_id)  -- 1人に対して1評価（UPSERT対応）
);
```

### ビュー：平均スコア
```sql
CREATE VIEW average_ratings AS
SELECT
  target_id,
  u.username AS target_name,
  COUNT(*) AS rating_count,
  AVG(rudeness) AS avg_rudeness,
  AVG(self_conscious) AS avg_self_conscious,
  AVG(childish) AS avg_childish,
  AVG(random_talk) AS avg_random_talk,
  AVG(behavior) AS avg_behavior,
  AVG(useless_kindness) AS avg_useless_kindness,
  (AVG(rudeness) + AVG(self_conscious) + AVG(childish) + AVG(random_talk) + AVG(behavior) + AVG(useless_kindness)) / 6.0 AS overall_avg
FROM ratings r
JOIN users u ON u.id = r.target_id
GROUP BY target_id, u.username;
```

## 画面構成

### 1. ログイン / 新規登録画面
- ユーザー名 + パスワード入力
- 「ログイン」「新規登録」ボタン
- 登録済みメンバー数を表示

### 2. ホーム画面（ログイン後）
- ヘッダー: ログインユーザー名 + ログアウトボタン
- 🏆 ランキングへのリンク
- 📊 自分のチャートへのリンク
- メンバー一覧（**投票（被評価）の少ないユーザーから順に表示**）
  - 未評価の人: 「評価する」ボタンのみ（チャートは見れない）
  - 評価済みの人: 「再評価」「📊」ボタン

### 3. 評価画面
- 対象者の名前表示
- 6項目のスライダー（1〜10）
- 確定ボタン

### 4. チャート画面
- SVG六角形レーダーチャート（平均値）
- 各項目のスコア数値
- 評価人数表示

### 5. ランキング画面
- 全員の総合スコア順（**5人以上に評価されたユーザーのみ**）
- **項目別タブ**で各項目のランキングに切り替え可能（総合 / 失礼さ / 自意識過剰さ / 子供っぽさ / 脈略のなさ / 日頃の行い / 意味のない優しさ）
- 1位👑、2位🥈、3位🥉

## デザイン方針

- ダークテーマ（背景 #0a0a0f 系）
- アクセントカラー: 赤 (#ff3e3e)
- ゴールド: #ffd700（ランキング用）
- フォント: Noto Sans JP
- ネタ系だけど洗練された見た目（ダサくしない）
- モバイルファースト（max-width: 480px中央寄せ）

## プロトタイプ参照

このリポジトリのルートに `prototype.jsx` として、Claude.ai上で作成したReactプロトタイプを配置する。以下の部分はそのまま参考にしてよい：

- **RadarChart コンポーネント**（SVG描画ロジック）
- **SliderInput コンポーネント**（スライダーUI）
- **カラースキーム / デザイントークン**
- **画面遷移の流れ**

ただし、プロトタイプは `window.storage`（Claude Artifact用）でデータ保存しているので、Supabaseに置き換えること。

## 実装の優先順序

1. `npx create-next-app@latest otonage-nai --typescript --tailwind --app`
2. Supabaseプロジェクト作成 + テーブル/ビュー作成
3. 認証（登録/ログイン/ログアウト）
4. ホーム画面 + メンバー一覧
5. 評価入力画面
6. チャート表示画面（SVGレーダー）
7. ランキング画面
8. Vercelデプロイ

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=（Supabaseプロジェクトから取得）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabaseプロジェクトから取得）
```

## RLSポリシー（Supabase Row Level Security）

```sql
-- users: 誰でも読める、本人のみ更新
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);

-- ratings: ログイン者のみ書き込み、評価済みなら対象者のデータ読める
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_insert" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "ratings_update" ON ratings FOR UPDATE USING (auth.uid() = rater_id);
CREATE POLICY "ratings_select" ON ratings FOR SELECT USING (
  auth.uid() = target_id  -- 自分への評価は見れる
  OR EXISTS (
    SELECT 1 FROM ratings r2
    WHERE r2.rater_id = auth.uid() AND r2.target_id = ratings.target_id
  )  -- その人を評価済みなら見れる
);
```

## 注意事項

- パスワードはハッシュ化して保存（Supabase Authを使うなら自動）
- 自分自身への評価はフロント・バック両方でブロック
- スコアは1〜10のINT制約をDBレベルで入れる
- 日本語UI、日本語フォント

## このドキュメントの使い方

Claude Codeで以下のように実行してください：

```bash
# 1. リポジトリ作成後、このファイルを配置
cp HANDOFF.md /path/to/otonage-nai/

# 2. Claude Codeに渡す
claude "HANDOFF.md を読んで、このプロジェクトを実装して。まずSupabaseのセットアップ手順を教えて、その後コードを書いていって。"
```
