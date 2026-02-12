# Sleep Journal - 睡眠ジャーナリング

就寝前のジャーナリング（自由記述）をサポートし、Google Gemini AIによる傾聴的フィードバックを提供するWebアプリケーション。

## 🎯 プロジェクト概要

このプロジェクトは、Google Cloud Platform（GCP）のサービスを活用したMVPデモアプリです。ユーザーは就寝前に今日の振り返りを入力し、AIが共感的なフィードバック、タグ付け、次のアクションを提案します。

### ハッカソン要件

- **Google Cloud アプリケーション実行**: Cloud Run（Frontend + Backend）
- **Google Cloud AI技術**: Vertex AI（Gemini API）
- **提出物**: 公開GitHubリポジトリ + デプロイ済みURL

## 🏗️ アーキテクチャ

```
User Browser → Cloud Run (Frontend/Nginx) → Cloud Run (Backend/Fastify) → Vertex AI Gemini
                     ↓
                LocalStorage (履歴保存)
```

詳細は [docs/architecture.mmd](docs/architecture.mmd) を参照。

## 🛠️ 技術スタック

### Frontend
- **Framework**: Vite + React + TypeScript
- **Styling**: Vanilla CSS
- **Hosting**: Cloud Run (Nginx配信)
- **Storage**: LocalStorage（最大10件の履歴）

### Backend
- **Framework**: Fastify + TypeScript
- **AI**: Vertex AI Gemini 2.5 Flash
- **Hosting**: Cloud Run
- **Authentication**: Service Account（Vertex AI呼び出し用）

### Infrastructure
- **GCP Services**:
  - Cloud Run（2サービス）
  - Vertex AI（Gemini API）
  - Cloud Build
  - Cloud Logging

## 📁 リポジトリ構造

```
/
├── frontend/               # Vite + React フロントエンド
│   ├── src/
│   │   ├── components/     # React コンポーネント
│   │   ├── App.tsx         # メインアプリ
│   │   ├── types.ts        # TypeScript型定義
│   │   └── main.tsx        # エントリーポイント
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/                # Fastify バックエンド
│   ├── src/
│   │   ├── routes/         # APIルート
│   │   ├── services/       # Gemini統合
│   │   └── index.ts        # サーバーエントリーポイント
│   ├── Dockerfile
│   └── package.json
├── infra/                  # デプロイスクリプト
│   ├── enable_apis.sh
│   ├── deploy_backend.sh
│   └── deploy_frontend.sh
└── docs/                   # ドキュメント
    ├── api.md
    └── architecture.mmd
```

## 🚀 デプロイ手順

### 前提条件

- Google Cloud プロジェクト作成済み
- `gcloud` CLI インストール済み
- プロジェクトに課金が有効

### 1. gcloud初期設定

```bash
# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# 認証
gcloud auth login
```

### 2. 必要なAPIを有効化

```bash
cd infra
./enable_apis.sh
```

これにより以下のAPIが有効化されます：
- Cloud Run API
- Vertex AI API
- Cloud Build API
- Artifact Registry API

### 3. バックエンドをデプロイ

```bash
./deploy_backend.sh
```

デプロイ完了後、バックエンドURLが表示されます（例: `https://sleep-journal-backend-xxx.run.app`）

### 4. フロントエンドをデプロイ

```bash
# バックエンドURLを環境変数に設定
export BACKEND_URL=https://sleep-journal-backend-xxx.run.app

# デプロイ
./deploy_frontend.sh
```

フロントエンドURLが表示されます（例: `https://sleep-journal-frontend-xxx.run.app`）

### 5. CORS設定を更新

フロントエンドからバックエンドにアクセスできるよう、CORS設定を更新します：

```bash
gcloud run services update sleep-journal-backend \
  --region asia-northeast1 \
  --update-env-vars ALLOWED_ORIGINS=https://sleep-journal-frontend-xxx.run.app \
  --project=YOUR_PROJECT_ID
```

## 💻 ローカル開発

### Backend

```bash
cd backend

# 依存関係をインストール
npm install

# 環境変数を設定（.envファイル作成）
cp .env.example .env
# .envファイルを編集してGCP_PROJECT_IDを設定

# ローカル起動（Vertex AI認証にはApplication Default Credentialsが必要）
gcloud auth application-default login
npm run dev
```

Backend は `http://localhost:8080` で起動します。

### Frontend

```bash
cd frontend

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集（VITE_API_BASE_URL=http://localhost:8080）

# ローカル起動
npm run dev
```

Frontend は `http://localhost:5173` で起動します。

## 📝 環境変数

### Backend

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `GCP_PROJECT_ID` | GCPプロジェクトID | - |
| `GCP_REGION` | GCPリージョン | `asia-northeast1` |
| `GEMINI_MODEL` | 使用するGeminiモデル | `gemini-2.5-flash` |
| `ALLOWED_ORIGINS` | CORS許可オリジン（カンマ区切り） | `http://localhost:5173` |
| `PORT` | サーバーポート | `8080` |

### Frontend

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `VITE_API_BASE_URL` | バックエンドAPIのURL | `http://localhost:8080` |

## 🔐 セキュリティ・プライバシー

### 実装済み対策

1. **ログセキュリティ**: `journal_text`は一切ログに出力しない
2. **レート制限**: IP単位で1分あたり20リクエストまで
3. **CORS制限**: 許可されたオリジンのみアクセス可能
4. **データ保存**: サーバーには保存せず、LocalStorageのみ（PII非該当）
5. **安全な出力**: 医療的診断・治療指示は禁止
6. **危機検知**: 自傷他害の懸念がある場合、`safety_note`で適切に案内

### 注意事項

- このアプリは医療的助言を提供するものではありません
- 緊急時は専門機関（精神保健福祉センター、いのちの電話等）にご相談ください
- LocalStorageに保存されたデータはブラウザ内のみで管理されます

## 🧪 デモ手順

1. フロントエンドURLにアクセス
2. 「今日の振り返り」テキストエリアにジャーナルを入力
3. （オプション）気分とストレスレベルを選択
4. 「フィードバックを受け取る」ボタンをクリック
5. AIからの傾聴的フィードバック、タグ、次のアクションが表示される
6. 履歴はLocalStorageに自動保存（最大10件）

## 📊 API仕様

詳細は [docs/api.md](docs/api.md) を参照。

### 主要エンドポイント

- `GET /healthz`: ヘルスチェック
- `POST /v1/feedback`: ジャーナルからフィードバックを生成

## 🎨 Zenn記事用の材料

### デモ動画・スクリーンショット

1. ジャーナル入力画面
2. フィードバック表示画面
3. アーキテクチャ図（`docs/architecture.mmd`）

### 技術的ハイライト

- Vertex AI Gemini APIの統合方法
- Cloud Runでのフロント・バック統一デプロイ
- セキュリティとプライバシーへの配慮（ログ管理、レート制限）
- LocalStorageによる軽量な履歴管理

### 学んだこと・課題

- Gemini APIのプロンプトエンジニアリング（JSON出力の安定化）
- Cloud Runのサービスアカウント設定とIAM権限管理
- CORS設定とビルド時環境変数の扱い

## 🤝 コントリビューション

このプロジェクトはハッカソン提出用のMVPです。フィードバックやIssueは歓迎します。

## 📄 ライセンス

MIT License

## 🔗 リンク

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Gemini API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini)

---

**Built with Google Cloud Platform** 🌩️
