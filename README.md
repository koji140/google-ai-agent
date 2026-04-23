# google-ai-agent

Google Workspace ネイティブな業務エージェントOSの設計・実装レポジトリ

---

## このプロジェクトの目的

GitHub、CLI、開発者向けAI IDEを業務運用の前提にせず、**Google Workspace（Drive / Sheets / Docs / Apps Script / Gemini）だけ**を使って、業務資料・議事録・HTML・判断ログ・Todo・決定事項を自動で収集・整理・要約・台帳化し、承認付きで実行できる業務エージェント基盤を設計・実装する。

従来の汎用AI活用は「毎回プロンプトを考える」「出力がチャット内で終わる」「保存先や次工程につながらない」といった理由で定着しにくい。本プロジェクトでは、AIを「その場の相談相手」として使うのではなく、**Google Workspace上で考え、分解し、承認を取り、実行し、記録する業務エージェントOS**として構築する。

端的に言えば、今 Claude Code や Codex に任せているような「考える・整理する・実行する・記録する」体験を、Google Workspace上の業務運用として再現することが目的である。

Antigravityのような開発支援AIは、実装時の補助としては使える。しかし、本プロジェクトの本番運用はIDEやCLIに依存しない。業務ユーザーが使う入口と記録先は、あくまでGoogle Workspaceである。

---

## 推奨読み込み順

このレポジトリを初めて読む人は、以下の順番で読むことを推奨する。

1. **[全体像](docs/overview.md)** - プロジェクトの背景と目指す状態
2. **[HP改訂の自動化（成功ケース）](docs/session-log-20260423-hp-automation.md)** - 最初の具体的な成功事例
3. **[Google環境だけで作る業務エージェント実行基盤](docs/google-only-agent-runtime.md)** - このプロジェクトの中核方針
4. **[Codex作業ログ・Antigravity引き継ぎ](docs/session-log-20260423-codex-handoff.md)** - ここまでの作業経緯と次アクション

---

## 🚀 完了済みの実証ケース：HP改訂ワークフロー

### 概要
大野さん（非エンジニア）が Google Drive 上のファイルを更新するだけで、Gemini との対話を通じてホームページを安全に更新できる仕組みを構築しました。

### アーキテクチャ
1. **SSOT (Drive)**: ホームページを 4 つの HTML 部品（header, guidance, faq, footer）に分割して Drive に配置。
2. **AI Editing**: 大野さんが Gemini に部品の修正案を作成させ、Drive 上のファイルを上書き。
3. **Auto Sync (GAS)**: GAS が Drive の変更を検知（1分間隔）し、GitHub Actions へ通知を送る。
4. **Auto Deploy (GitHub Actions)**: GitHub Actions が HTML 部品を組み立て、Cloudflare Pages へデプロイ。

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
詳細は [docs/development-setup.md](docs/development-setup.md) を参照。
1. `npx clasp login`
2. `npx clasp push`
3. GAS Script Properties に必要なトークン（GITHUB_TOKEN等）を設定。
4. `setupDriveTrigger` を実行して自動同期を開始。
