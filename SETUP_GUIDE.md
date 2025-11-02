# 広告分析SaaSシステム - 完全セットアップガイド

## 📋 システム概要

### 機能
- ✅ マルチユーザー対応
- ✅ gomarble OAuth認証
- ✅ 5レベルの分析システム
- ✅ Claude AI による深い分析
- ✅ Chatwork 自動通知
- ✅ アカウントごとの個別設定
- ✅ 分析履歴保存

### アーキテクチャ
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

---

## 🚀 セットアップ手順

### ステップ1: データベースのセットアップ (Railway)

1. **Railwayアカウント作成**
   - https://railway.app にアクセス
   - GitHub連携でサインアップ

2. **PostgreSQLデータベース作成**
   ```bash
   # Railway CLI インストール (オプション)
   npm install -g @railway/cli
   
   # ログイン
   railway login
   
   # 新規プロジェクト作成
   railway init
   
   # PostgreSQL 追加
   railway add postgresql
   ```

3. **スキーマ適用**
   ```bash
   # DATABASE_URL を取得
   railway variables
   
   # スキーマを適用
   psql $DATABASE_URL < database-schema.sql
   ```

---

### ステップ2: バックエンドAPIのデプロイ (Railway)

1. **環境変数の設定**
   
   Railway ダッシュボードで以下を設定：
   ```
   DATABASE_URL=postgres://... (自動設定済み)
   ENCRYPTION_KEY=your-32-character-encryption-key
   NODE_ENV=production
   PORT=3000
   ```

2. **デプロイ**
   ```bash
   # Railwayにデプロイ
   railway up
   
   # デプロイ確認
   railway open
   ```

3. **API URLを確認**
   - `https://your-app.railway.app` をメモ

---

### ステップ3: フロントエンドのデプロイ (Vercel)

1. **Vercelアカウント作成**
   - https://vercel.com にアクセス
   - GitHub連携でサインアップ

2. **プロジェクトのインポート**
   ```bash
   # Vercel CLI インストール
   npm install -g vercel
   
   # ログイン
   vercel login
   
   # デプロイ
   cd frontend
   vercel
   ```

3. **環境変数の設定**
   
   Vercel ダッシュボードで設定：
   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   ```

4. **再デプロイ**
   ```bash
   vercel --prod
   ```

---

### ステップ4: GitHub Actions のセットアップ

1. **GitHubリポジトリ作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/ad-analytics-saas.git
   git push -u origin main
   ```

2. **GitHub Secrets の設定**
   
   リポジトリの Settings > Secrets and variables > Actions で以下を追加：
   ```
   DATABASE_URL=postgres://...
   ENCRYPTION_KEY=your-32-character-encryption-key
   ANTHROPIC_API_KEY=sk-ant-api03-...
   GOMARBLE_TOKEN=your-gomarble-token
   ```

3. **GitHub Actions の有効化**
   - Actions タブで週次実行が設定されていることを確認
   - 手動実行でテスト可能

---

### ステップ5: gomarble 連携の設定

1. **gomarble.ai でアカウント作成**
   - https://apps.gomarble.ai にアクセス
   - サインアップ

2. **広告アカウント連携**
   - Settings > Integrations
   - Facebook、Google、TikTok 広告を連携

3. **OAuth設定 (開発者向け)**
   - Settings > API
   - OAuth Client ID を取得
   - Redirect URI を設定: `https://your-vercel-app.vercel.app/callback`

---

## 🎯 使い方

### 初回セットアップ

1. **ユーザー登録**
   - https://your-vercel-app.vercel.app にアクセス
   - メールアドレスと gomarble トークンでログイン

2. **アカウント追加**
   - 左サイドバーで「アカウント追加」
   - gomarble で連携済みのアカウントを選択

3. **設定**
   - アカウントを選択
   - Chatwork設定:
     - ルームID入力
     - APIトークン入力
     - 実行スケジュール設定（週1回推奨）
   
   - 指標選択:
     - 基本指標: 広告費、IMP、クリック、CTR、CPC、CPM
     - CV指標: CV、CPA、ROAS
     - その他: リーチ、動画指標など
   
   - 分析レベル選択:
     - ✅ レベル1: アカウントサマリー
     - ✅ レベル2: キャンペーン分析（トップ3/ワースト3）
     - ✅ レベル3: クリエイティブ分析（各キャンペーン5件）
     - ✅ レベル4: フォーマット比較
     - ✅ レベル5: トレンド分析（過去4週間）

4. **テスト送信**
   - 「テスト送信」ボタンをクリック
   - Chatworkにメッセージが届くことを確認

5. **設定を保存**
   - 「設定を保存」ボタンをクリック

---

## 📊 分析レポートの例

### レベル1: アカウントサマリー
```
📊 週次広告分析レポート（10/26-11/1）

【サマリー】
総広告費: ¥429,217（先週比 +12%）
CV数: 19件（先週比 -3件）
平均CPA: ¥22,590（先週比 +18% ⚠️）
ROAS: 2.3x（先週比 -0.2）
```

### レベル2: キャンペーン分析
```
【トップ3キャンペーン】
🏆 1. 難波店求人 - CV: 8件, CPA: ¥2,624 ✅
🥈 2. 博多店広告 - CV: 5件, CPA: ¥4,120
🥉 3. 鹿児島店 - CV: 3件, CPA: ¥6,973

【ワースト3キャンペーン】
🔴 1. 札幌店 - CPA: ¥45,000（即停止推奨）
⚠️ 2. 京都店 - CPA: ¥18,500
⚠️ 3. 仙台店 - CPA: ¥12,800
```

### レベル3: クリエイティブ分析
```
【難波店キャンペーン - トップクリエイティブ】
🥇 画像⑦「ビフォーアフター」- CPA: ¥1,998, CTR: 4.2%
   💡 他店舗にも横展開推奨

🥈 動画①「施術動画30秒」- CPA: ¥3,124, 75%視聴率: 42%
   💡 予算を+30%増やす価値あり
```

### レベル4: フォーマット比較
```
【フォーマット別パフォーマンス】
🎬 動画: 平均CPA ¥2,400（45件）✅ 最優秀
📸 静止画: 平均CPA ¥3,200（120件）
🖼️ カルーセル: 平均CPA ¥4,100（32件）

💡 提案: 動画クリエイティブを増やす
```

### レベル5: トレンド分析
```
【4週間トレンド】
第1週: CPA ¥2,800
第2週: CPA ¥3,200 (+14%)
第3週: CPA ¥4,100 (+28%)
第4週: CPA ¥5,200 (+27%)

⚠️ 警告: CPAが4週連続で悪化（累計+85%）

【原因分析】
- CTRは横ばい（2.8% → 2.7%）
- CPMが+40%上昇（クリエイティブ疲弊の可能性）
- CVRが-20%低下（LP改善が必要）

【アクション提案】
1. 新規クリエイティブのテストを開始
2. LPのCVR改善施策を実施
3. ターゲティングの見直しを検討
```

---

## 🛠️ トラブルシューティング

### データが取得できない
1. gomarble.ai で広告アカウントが連携されているか確認
2. gomarble トークンが正しいか確認
3. アカウント制限に達していないか確認

### Chatworkにメッセージが届かない
1. ルームIDが正しいか確認（数字のみ）
2. APIトークンが正しいか確認
3. ボットがルームに追加されているか確認

### GitHub Actionsが実行されない
1. Secrets が正しく設定されているか確認
2. Actions が有効になっているか確認
3. 手動実行でテスト

### データベース接続エラー
1. DATABASE_URL が正しいか確認
2. Railwayでデータベースが起動しているか確認
3. SSL設定を確認

---

## 💰 コスト試算

### 月間コスト（ユーザー10人、アカウント40個の場合）

| 項目 | コスト |
|------|--------|
| Railway（PostgreSQL + API）| $10-20 |
| Vercel（フロントエンド）| 無料 |
| Claude API（週1回 × 40アカウント）| ~¥4,000 |
| GitHub Actions | 無料 |
| gomarble.ai | 既存プラン |
| **合計** | **約¥5,500/月** |

※ユーザー・アカウント数に応じてスケール

---

## 📝 メンテナンス

### 定期確認項目
- ✅ 分析履歴の確認（週1回）
- ✅ エラーログの確認（週1回）
- ✅ データベースのバックアップ（月1回）
- ✅ Claude APIの使用量確認（月1回）

### アップデート手順
```bash
# バックエンド更新
git pull
railway up

# フロントエンド更新
git pull
vercel --prod
```

---

## 🎉 完了！

これで完全なマルチユーザー対応の広告分析SaaSシステムが完成しました！

### 次のステップ
1. 実際のアカウントで動作確認
2. ユーザーを追加
3. 週次レポートが正しく届くか確認
4. 必要に応じて設定を調整

### サポート
問題が発生した場合は、GitHub Issues で報告してください。
