# 🎯 広告分析SaaSシステム - 完全版

マルチユーザー対応の広告分析自動化システム。gomarble-mcp-server、Claude AI、Chatworkを統合した週次分析レポート配信システムです。

## 🌟 主要機能

### ✅ マルチユーザー・マルチアカウント対応
- 各ユーザーが独立した設定を持つ
- アカウントごとに異なるChatworkルームに送信可能
- gomarble OAuth認証

### 📊 21種類の指標から選択可能
- **基本指標**: 広告費、インプレッション、クリック、CTR、CPC、CPM
- **CV指標**: CV数、CPA、CV金額、ROAS
- **エンゲージメント**: リーチ、フリークエンシー
- **動画指標**: 再生数、25/50/75/100%視聴率
- **アクション指標**: 購入、リード、アプリDL、ページ閲覧

### 🎯 5レベルの詳細分析
1. **アカウント全体サマリー** - 総広告費、総CV、平均CPA、ROAS
2. **キャンペーン分析** - トップ/ワースト3キャンペーン
3. **クリエイティブ詳細分析** - 各キャンペーンのクリエイティブパフォーマンス
4. **フォーマット比較** - 画像 vs 動画 vs カルーセル
5. **トレンド分析** - 週次トレンドと異常検知

### 🤖 Claude AI による深い分析
- 重要なインサイト抽出
- 具体的なアクション提案
- 異常の早期検知
- 自然な日本語レポート

### 📅 完全自動化
- GitHub Actionsで週次自動実行
- 設定したスケジュールで自動配信
- エラーハンドリング
- 分析履歴の自動保存

## 📦 システム構成

```
React Frontend (Vercel)
    ↓ HTTPS
Node.js Backend API (Railway)
    ↓
PostgreSQL Database (Railway)
    ↓
GitHub Actions (週次自動実行)
    ↓
gomarble-mcp-server → Chatwork
```

## 📂 ファイル構成

```
ad-analytics-saas/
├── README.md                       ← このファイル
├── SETUP_GUIDE.md                  ← 詳細なセットアップガイド
├── IMPLEMENTATION_SUMMARY.md       ← 実装完了サマリー
├── package.json                    ← Node.js dependencies
├── .env.example                    ← 環境変数テンプレート
│
├── database-schema.sql             ← PostgreSQLスキーマ（8テーブル）
│
├── backend/
│   └── server.js                   ← Express API（全エンドポイント）
│
├── frontend/
│   └── ConfigUI.jsx                ← React設定UI（5レベル全対応）
│
├── scripts/
│   └── weekly-analysis.js          ← 週次分析スクリプト（5レベル実装）
│
└── .github/
    └── workflows/
        └── weekly-analysis.yml     ← GitHub Actions設定
```

## 🚀 クイックスタート

### 1. 必要なもの
- Node.js 18以上
- PostgreSQL
- gomarble.ai アカウント
- Anthropic API キー
- Chatwork アカウント

### 2. インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/ad-analytics-saas.git
cd ad-analytics-saas

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .env ファイルを編集して値を設定
```

### 3. データベースセットアップ

```bash
# PostgreSQLデータベースを作成
createdb ad_analytics

# スキーマを適用
psql ad_analytics < database-schema.sql
```

### 4. 起動

```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

## 📖 詳細なドキュメント

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 完全なセットアップ手順
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - 実装完了内容の詳細

## 💰 コスト試算

| 規模 | ユーザー数 | アカウント数 | 月額コスト |
|------|-----------|-------------|----------|
| 小規模 | 1人 | 4個 | 約¥1,800 |
| 中規模 | 10人 | 40個 | 約¥6,900 |
| 大規模 | 100人 | 400個 | 約¥48,000 |

※ユーザーあたり約¥500/月でスケール可能

## 🎯 使い方

### 基本的な流れ

1. **ログイン** - メールアドレスとgomarbleトークンでログイン
2. **アカウント追加** - gomarbleで連携済みのアカウントを選択
3. **設定**
   - Chatwork: ルームID、APIトークン、実行スケジュール
   - 指標: 21種類から選択
   - 分析レベル: 5レベルから選択
4. **テスト送信** - 正しく動作するか確認
5. **保存** - 設定を保存して完了

### レポート例

```
📊 週次広告分析レポート（10/26-11/1）

【サマリー】
総広告費: ¥429,217（先週比 +12%）
CV数: 19件（先週比 -3件）
平均CPA: ¥22,590（先週比 +18% ⚠️）

【重要なインサイト】
🟢 好調: 博多店のCTRが13.27%と突出
🔴 注意: 鹿児島店のCPAが悪化（¥3,487→¥22,590）

【アクション提案】
1. 鹿児島店のLPを確認
2. 博多店のクリエイティブを他店舗にも展開
3. CPM高騰中の札幌店を一時停止検討
```

## 🛠️ トラブルシューティング

### データが取得できない
- gomarble.aiで広告アカウントが連携されているか確認
- gomarbleトークンが正しいか確認

### Chatworkにメッセージが届かない
- ルームIDが正しいか確認
- APIトークンが正しいか確認
- ボットがルームに追加されているか確認

### その他の問題
詳細は [SETUP_GUIDE.md](./SETUP_GUIDE.md) のトラブルシューティングセクションを参照

## 📝 技術スタック

- **フロントエンド**: React, Tailwind CSS
- **バックエンド**: Node.js, Express
- **データベース**: PostgreSQL
- **AI分析**: Claude Sonnet 4 (Anthropic API)
- **データ取得**: gomarble-mcp-server
- **通知**: Chatwork API
- **自動実行**: GitHub Actions
- **デプロイ**: Vercel (Frontend), Railway (Backend)

## 🤝 サポート

問題が発生した場合は、GitHub Issuesで報告してください。

## 📄 ライセンス

MIT License

## 🎉 完成！

このシステムにより、広告分析が完全に自動化されます：
- ✅ 週1回自動実行
- ✅ Claude AIによる深い分析
- ✅ Chatworkに自動配信
- ✅ 分析履歴を保存
- ✅ 複数アカウント対応
- ✅ 柔軟な設定

今すぐセットアップして、広告分析を自動化しましょう！🚀
