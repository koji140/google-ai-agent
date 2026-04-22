# google-ai-agent

Google Workspace ネイティブな業務エージェントOSの設計・実装レポジトリ

---

## このプロジェクトの目的

GitHub、CLI、開発者向けAI IDEを業務運用の前提にせず、**Google Workspace（Drive / Sheets / Docs / Apps Script / Gemini）だけ**を使って、業務資料・議事録・HTML・判断ログ・Todo・決定事項を自動で収集・整理・要約・台帳化し、承認付きで実行できる業務エージェント基盤を設計・実装する。

従来の汎用AI活用は「毎回プロンプトを考える」「出力がチャット内で終わる」「保存先や次工程につながらない」といった理由で定着しにくい。本プロジェクトでは、AIを「その場の相談相手」として使うのではなく、**Google Workspace上で考え、分解し、承認を取り、実行し、記録する業務エージェントOS**として構築する。

端的に言えば、今 Claude Code や Codex に任せているような「考える・整理する・実行する・記録する」体験を、Google Workspace上の業務運用として再現することが目的である。

Antigravityのような開発支援AIは、実装時の補助としては使える。しかし、本プロジェクトの本番運用はIDEやCLIに依存しない。業務ユーザーが使う入口と記録先は、あくまでGoogle Workspaceである。

---

## 想定ユースケース

- 打ち合わせ資料の自動台帳登録
- 議事録からのToDo・決定事項の自動抽出
- Driveに配置された文書の自動分類・要約
- HTML更新の検知と変更サマリ生成
- 判断ログの蓄積と横断検索
- 業務文書の版管理・正本管理

特に、建設業の近接施工協議のような**文書量が多く、判断の記録が重要な業務**を想定している。

---

## なぜ Google 製品だけで作るのか

| 理由 | 説明 |
|------|------|
| 導入障壁が低い | 多くの企業が既にGoogle Workspaceを導入済み |
| 非エンジニアに広げやすい | Sheets・Docsは誰でも使える |
| 追加コストが小さい | 既存ライセンスの範囲で多くが実現可能 |
| 共有・共同編集が標準 | リアルタイム共有が最初から組み込まれている |
| Apps Scriptで自動化可能 | プログラミング環境が組み込み済み |
| Gemini連携が進行中 | Google製品間のAI統合が今後さらに強化される |

GitHub方式（差分管理・コードレビュー・CI/CD）は強力だが、一般企業の業務現場に持ち込むにはハードルが高い。本プロジェクトでは、Google方式の「擬似レポ基盤」として、実用的な業務AI基盤を目指す。

---

## 全体アーキテクチャ要約

```
┌─────────────────────────────────────────────────────┐
│                  Google Drive（文書庫）                │
│  打ち合わせ資料 / 議事録 / HTML / 判断ログ / 成果物    │
└────────────┬────────────────────────┬────────────────┘
             │                        │
             ▼                        ▼
┌────────────────────┐  ┌────────────────────────────┐
│  Google Sheets     │  │  Google Docs               │
│  （台帳DB）         │  │  （長文ドキュメント/ハブ）    │
│  文書台帳           │  │  設計書 / 議事録 / レポート  │
│  ToDo台帳           │  │                            │
│  決定事項台帳       │  │                            │
│  判断ログ台帳       │  │                            │
└────────┬───────────┘  └────────────┬───────────────┘
         │                           │
         ▼                           ▼
┌──────────────────────────────────────────────────────┐
│           Google Apps Script（自動化エンジン）          │
│  トリガー監視 / 台帳更新 / 抽出 / 通知 / 連携          │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│              Gemini API（AI処理）                      │
│  要約 / ToDo抽出 / 決定事項抽出 / 分類 / 検索          │
└──────────────────────────────────────────────────────┘
```

**設計思想**: AIそのものを主役にするのではなく、Google Workspaceの業務フローの中に「読解・判断候補・承認・実行・記録」を埋め込む。入力元・処理・出力先・保存先が固定されているため、ユーザーが毎回プロンプトを考える必要がない。

---

## 推奨読み込み順

このレポジトリを初めて読む人は、以下の順番で読むことを推奨する。

1. **[全体像](docs/overview.md)** - プロジェクトの背景と目指す状態
2. **[汎用AIが定着しない理由](docs/why-general-ai-does-not-stick.md)** - 課題認識
3. **[Google環境だけで作る業務エージェント実行基盤](docs/google-only-agent-runtime.md)** - このプロジェクトの中核方針
4. **[業務エージェントの運用モデル](docs/agent-operating-model.md)** - 入力から記録までの基本サイクル
5. **[自律度レベル設計](docs/autonomy-levels.md)** - どこまで自動実行するか
6. **[kinsetsu-process Google Workspace再現PoC](docs/kinsetsu-workspace-reproduction-poc.md)** - 最初の実証対象とDrive構成
7. **[Google Workspace エージェントアーキテクチャ](docs/google-workspace-agent-architecture.md)** - 解決策の全体設計
8. **[各コンポーネントの役割](docs/role-of-drive-sheets-docs-gas-gemini.md)** - Drive / Sheets / Docs / GAS / Gemini の責務
9. **[GitHub方式との比較](docs/comparison-github-vs-google-workspace.md)** - 位置づけの理解
10. **[近接施工協議スタイルのユースケース](docs/kinsetsu-process-style-use-case.md)** - 具体例で理解
11. **[自動入力パターン](docs/auto-ingestion-patterns.md)** - 実装の入口
12. **[Drive正本運用](docs/drive-as-source-of-truth.md)** - 運用ルール設計
13. **[Google Workspace業務エージェントの制約](docs/workspace-agent-limitations.md)** - Workspaceだけで作る場合の制約
14. **[実装ロードマップ](docs/implementation-roadmap.md)** - 進め方
15. **[リスクと制約](docs/risks-and-limitations.md)** - 注意点
16. **[次のアクション](docs/next-actions.md)** - すぐやること
17. **[開発セットアップ](docs/development-setup.md)** - Phase 1 PoCのローカル開発手順
18. **[Codex作業ログ・Antigravity引き継ぎ](docs/session-log-20260423-codex-handoff.md)** - ここまでの作業経緯と次アクション

---

## 各ドキュメントの役割

| ドキュメント | 役割 |
|---|---|
| [docs/overview.md](docs/overview.md) | プロジェクト全体像・背景・目指す状態 |
| [docs/why-general-ai-does-not-stick.md](docs/why-general-ai-does-not-stick.md) | 汎用AIが業務で定着しない構造的理由の分析 |
| [docs/google-only-agent-runtime.md](docs/google-only-agent-runtime.md) | Google Workspaceだけで業務エージェントを動かす中核方針 |
| [docs/agent-operating-model.md](docs/agent-operating-model.md) | 入力、読解、判断候補、承認、実行、記録の運用モデル |
| [docs/autonomy-levels.md](docs/autonomy-levels.md) | 自律実行レベルと承認境界の設計 |
| [docs/kinsetsu-workspace-reproduction-poc.md](docs/kinsetsu-workspace-reproduction-poc.md) | kinsetsu-processをGoogle Workspace上に再現するPoC設計 |
| [docs/google-workspace-agent-architecture.md](docs/google-workspace-agent-architecture.md) | Google製品によるAIエージェント基盤の全体設計 |
| [docs/role-of-drive-sheets-docs-gas-gemini.md](docs/role-of-drive-sheets-docs-gas-gemini.md) | 各Google製品の責務・得意不得意・組み合わせ方 |
| [docs/comparison-github-vs-google-workspace.md](docs/comparison-github-vs-google-workspace.md) | GitHub方式との比較と位置づけ |
| [docs/kinsetsu-process-style-use-case.md](docs/kinsetsu-process-style-use-case.md) | 近接施工協議的な業務での具体的な適用例 |
| [docs/implementation-roadmap.md](docs/implementation-roadmap.md) | フェーズ別の実装計画 |
| [docs/drive-as-source-of-truth.md](docs/drive-as-source-of-truth.md) | Drive正本運用の考え方とルール設計 |
| [docs/auto-ingestion-patterns.md](docs/auto-ingestion-patterns.md) | 自動入力パターンの一覧と実装観点 |
| [docs/workspace-agent-limitations.md](docs/workspace-agent-limitations.md) | Workspace中心で実装する場合の制約と対策 |
| [docs/risks-and-limitations.md](docs/risks-and-limitations.md) | Google Workspace方式の弱点とリスク |
| [docs/next-actions.md](docs/next-actions.md) | 次に着手すべき具体タスク |
| [docs/development-setup.md](docs/development-setup.md) | Apps Script + claspでPhase 1 PoCを開発する手順 |
| [docs/session-log-20260423-codex-handoff.md](docs/session-log-20260423-codex-handoff.md) | Codexでの作業ログ、判断経緯、Antigravityへの引き継ぎ |

---

## 今後の実装フェーズ

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | 文書台帳の自動更新（Drive → Sheets） | 未着手 |
| Phase 2 | 議事録からToDo・決定事項の自動抽出（Gemini連携） | 未着手 |
| Phase 3 | 要約・分類・通知の自動化 | 未着手 |
| Phase 4 | 運用ルール整備・正本管理フロー確立 | 未着手 |

---

## 将来的な実装対象

- **Apps Script**: Drive監視トリガー、Sheets自動更新、Doc解析、通知送信
- **Gemini API連携**: 議事録要約、ToDo抽出、決定事項抽出、文書分類
- **Drive台帳化**: 文書台帳Sheet、ToDo台帳Sheet、決定事項台帳Sheet、判断ログ台帳Sheet
- **テンプレート**: 議事録テンプレート（Doc）、台帳テンプレート（Sheet）
- **運用ルール**: 命名規則、版管理、正本フラグ、更新フロー

---

## 注意事項

- これは初期PoCフェーズの設計・実装レポジトリである
- 事実と仮説を区別して記述している
- Google製品だけで完結する前提で設計している（GitHub/CLI/AI IDEは運用基盤としては使わない）
- 将来の実装はApps Script + Gemini APIが中心になる想定
