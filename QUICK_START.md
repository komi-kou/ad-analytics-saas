# 🚀 クイックスタート - デプロイガイド

このガイドでは、広告分析SaaSシステムを最速でデプロイする手順を説明します。

## ⚡ 5分でデプロイ

### ステップ1: GitHubにプッシュ（1分）

```bash
cd ad-analytics-saas

# GitHubで新規リポジトリを作成してから：
git remote add origin https://github.com/YOUR_USERNAME/ad-analytics-saas.git
git push -u origin main
```

### ステップ2: Railwayにデプロイ（2分）

1. https://railway.app にアクセスしてログイン
2. 「New Project」をクリック
3. 「Deploy from GitHub repo」を選択
4. リポジトリを選択
5. 「Add PostgreSQL」をクリック
6. 環境変数を設定：
   ```
   ENCRYPTION_KEY=your-32-character-key-here
   NODE_ENV=production
   ```
7. 「Deploy」をクリック

### ステップ3: Vercelにデプロイ（1分）

```bash
npm install -g vercel
vercel login
vercel
```

環境変数を設定：
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

### ステップ4: GitHub Actionsセットアップ（1分）

GitHubリポジトリの Settings > Secrets and variables > Actions で設定：

```
DATABASE_URL=postgres://...（Railwayから取得）
ENCRYPTION_KEY=your-32-character-key-here
ANTHROPIC_API_KEY=sk-ant-api03-...
GOMARBLE_TOKEN=your-gomarble-token
```

---

## 📋 デプロイ前チェックリスト

### 必須アカウント
- ✅ GitHub アカウント
- ✅ Railway アカウント（無料）
- ✅ Vercel アカウント（無料）
- ✅ gomarble.ai アカウント
- ✅ Anthropic API アカウント
- ✅ Chatwork アカウント

### 必須情報
- ✅ gomarble トークン
- ✅ Anthropic API キー
- ✅ Chatwork API トークン
- ✅ Chatwork ルームID

---

## 🔧 デプロイ後の設定

### 1. データベースセットアップ

Railwayのコンソールで：

```bash
# データベースに接続
railway connect postgresql

# スキーマを適用
\i database-schema.sql

# 確認
\dt
```

### 2. アプリケーションにアクセス

```
フロントエンド: https://your-app.vercel.app
バックエンド: https://your-app.railway.app
```

### 3. 初回ログイン

1. フロントエンドにアクセス
2. メールアドレスとgomarbleトークンでログイン
3. アカウント追加
4. 設定を保存

### 4. テスト送信

「テスト送信」ボタンでChatworkに届くことを確認

---

## 📊 動作確認

### バックエンドAPI確認

```bash
curl https://your-app.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}
```

### データベース確認

```bash
railway connect postgresql
\dt
# Expected: 8 tables listed
```

### GitHub Actions確認

GitHub > Actions タブで手動実行してテスト

---

## 💰 コスト（月額）

### 最小構成
- Railway: $5
- Vercel: 無料
- Claude API: ~¥400
- **合計: 約¥1,800/月**

### 無料枠活用
- Railway: 初月無料
- Vercel: 永久無料
- GitHub Actions: 2,000分/月 無料

---

## 🎯 次のステップ

1. ✅ デプロイ完了
2. 📊 アカウント追加
3. ⚙️ 設定を保存
4. 🧪 テスト送信
5. 📅 週次レポート確認

---

## 🆘 トラブルシューティング

### Railwayのデプロイが失敗する
- package.jsonの構文を確認
- Node.jsバージョン（18以上）を確認
- ログを確認: railway logs

### Vercelのデプロイが失敗する
- ビルドコマンドを確認
- 環境変数を確認
- ログを確認

### GitHub Actionsが実行されない
- Secretsが正しく設定されているか確認
- workflow ファイルの構文を確認
- Actionsが有効になっているか確認

---

## 📚 詳細ドキュメント

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 完全なセットアップ手順
- [README.md](./README.md) - プロジェクト概要
- [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) - 検証レポート

---

## 🎉 デプロイ完了後

週次分析レポートが自動で配信されます！

次回の実行: 毎週月曜日 9:00 JST

お疲れ様でした！🚀
