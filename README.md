# google-ai-agent

Google Workspace ネイティブな業務エージェントOSの設計・実装レポジトリ

---

## このプロジェクトの目的

GitHub、CLI、開発者向けAI IDEを業務運用の前提にせず、**Google Workspace（Drive / Sheets / Docs / Apps Script / Gemini）だけ**を使って、業務資料・議事録・HTML・判断ログ・Todo・決定事項を自動で収集・整理・要約・台帳化し、承認付きで実行できる業務エージェント基盤を設計・実装する。

従来の汎用AI活用は「毎回プロンプトを考える」「出力がチャット内で終わる」「保存先や次工程につながらない」といった理由で定着しにくい。本プロジェクトでは、AIを「その場の相談相手」として使うのではなく、**Google Workspace上で考え、分解し、承認を取り、実行し、記録する業務エージェントOS**として構築する。

---

## 🚀 実証ケース：HP改訂ワークフロー（2026-04-23 完了）

### 概要
非エンジニアが Google Drive の HTML 部品（コンポーネント）を更新するだけで、Cloudflare Pages へのデプロイまでを全自動化。

### アーキテクチャ
- **Drive (SSOT)**: HTMLを4つの部品に分割管理。
- **GAS**: Driveの変更を監視し、GitHub Actionsへ通知。
- **GitHub Actions**: 部品を組み立て、`wrangler`でCloudflareへデプロイ。

### 再現時のヒント（AIエージェント活用）
このプロジェクトは AI エージェント（Antigravity）を用いて構築されました。他の AI で再現・拡張する際のポイントは以下の通りです。
- **視覚的確認**: 他の AI（画面が見えないツール）を使う場合、人間がドメイン制約や GUI 上のエラー内容を正確に伝える必要があります。
- **自動修正**: `clasp` や `git` のエラーメッセージを AI に渡せば、自律的に修正・再試行させることが可能です。

詳細は [docs/session-log-20260423-hp-automation.md](docs/session-log-20260423-hp-automation.md) を参照。

---

## 実装フェーズ

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | 文書台帳の自動更新（Drive → Sheets） | 進行中 |
| Phase 2 | 議事録からToDo・決定事項の自動抽出（Gemini連携） | 未着手 |
| Phase 3 | **HP改訂の完全自動化（Drive → Cloudflare）** | **完了** |
| Phase 4 | 運用ルール整備・正本管理フロー確立 | 未着手 |

---

## 開発セットアップ
1. `npx clasp login`
2. `npx clasp push`
3. Script Properties に `GITHUB_TOKEN`, `GITHUB_REPO` を設定。
4. `setupDriveTrigger` を実行。
