# GitHub方式との比較

## なぜ比較するのか

GitHub（+ CLI + Python/Node.js）を使った業務管理基盤は、ソフトウェア開発の世界では標準的なアプローチだ。Markdownで文書を管理し、Pull Requestでレビューし、Issueでタスクを追跡し、CI/CDで自動化する。

本プロジェクトが目指す「文書の台帳化」「判断の記録」「ToDoの自動抽出」は、GitHub方式でも実現可能であり、実際に類似のアプローチ（kinsetsu-process リポジトリなど）が存在する。

では、なぜあえてGoogle Workspace方式を選ぶのか。その判断の根拠を整理する。

## 比較表

| 観点 | GitHub方式 | Google Workspace方式 |
|------|-----------|---------------------|
| **文書形式** | Markdown / HTML / コード | Google Docs / Sheets |
| **差分管理** | Git（行単位の差分、ブランチ、マージ） | Google Docs変更履歴（限定的） |
| **タスク管理** | Issues / Projects | Sheets台帳 |
| **自動化** | GitHub Actions / CI/CD | Apps Script |
| **AI連携** | Claude / GPT / 自由に選択可能 | Gemini（Workspace統合） |
| **アクセス手段** | CLI / Web UI / IDE | ブラウザ / モバイルアプリ |
| **学習コスト** | 高い（Git, Markdown, CLI） | 低い（Sheets, Docs, Drive） |
| **展開しやすさ** | エンジニア向き | 非エンジニアにも展開可能 |
| **コスト** | 無料〜（GitHub Free/Pro） | Workspace既存ライセンス内 |
| **コードレビュー** | PR / diff / レビュアー機能 | Docsのコメント・提案機能 |
| **検索** | コード検索 / Issue検索 | Drive検索 |
| **権限管理** | リポジトリ / Organization | Drive共有設定 |

## GitHub方式の強み

### 差分管理が圧倒的に強い
Gitによる行単位の差分追跡は、文書やコードの変更を正確に記録できる。「いつ、誰が、何を、なぜ変えたか」がcommit単位で残る。Google Docsの変更履歴はこのレベルの精度がない。

### コードとドキュメントを一元管理できる
HTML、スクリプト、設定ファイル、Markdownドキュメントをすべて同じリポジトリで管理できる。コードと文書の整合性を保ちやすい。

### CI/CDによる自動化が強力
GitHub Actionsでテスト・ビルド・デプロイ・通知を自動化できる。Apps Scriptよりも柔軟で、実行時間の制約も緩い。

### レビュープロセスが組み込まれている
Pull Requestによるレビューは、変更の品質を担保する仕組みとして成熟している。

## Google Workspace方式の強み

### 導入障壁が極めて低い
Google Workspaceを既に使っている企業であれば、新しいツールの導入承認は不要。SheetsとDocsは誰でも使える。

### 非エンジニアに展開できる
建設業、不動産業、製造業など、ITエンジニアが少ない現場でも運用可能。「Gitを覚える」「Markdownを書く」という前提がない。

### 共有・共同編集が最初から組み込まれている
Google Docsのリアルタイム共同編集、Driveの共有設定は、チームでの運用に最適化されている。GitHubのコラボレーションはエンジニア向けの設計。

### モバイルアクセスが自然
スマートフォンからDrive / Sheets / Docsにアクセスして確認・編集できる。GitHubのモバイル体験はこれほど自然ではない。

### 自動入力の口が作りやすい
Google Forms → Sheets、Drive監視 → Apps Script、メール → Sheets連携など、業務の入口から自動でデータを取り込む仕組みが作りやすい。

## Google Workspace方式の弱み

### 差分管理が弱い
これがGoogle Workspace方式の最大の弱点。Google Docsの変更履歴はあるが、Gitのような行単位のdiff比較、ブランチ・マージ、レビュー承認フローはない。

**影響**: 「誰がいつ何を変えたか」の追跡が不正確になりうる。特に、同時編集時の変更の追跡が難しい。

### HTMLやコードの管理が不得意
HTMLファイルの編集・プレビュー、スクリプトの管理はGoogle Workspace内では困難。Apps Scriptのエディタはあるが、本格的なコード開発には向かない。

### 正本がぶれやすい
Drive内のファイルは自由にコピー・移動・名前変更ができるため、「どれが正本か」が曖昧になりやすい。Gitリポジトリにはmainブランチという明確な正本の概念があるが、Driveにはそれがない。

### 大規模データの処理に限界がある
Sheetsの行数制限（1,000万セル）、Apps Scriptの実行時間制限（6分/回）、API呼び出しのクォータ制限がある。大量データの処理にはCloud Functionsなど外部サービスが必要になる可能性がある。

## 位置づけの整理

本プロジェクトは、GitHub方式の「完全な代替」を目指すものではない。

| 用途 | 推奨方式 |
|------|---------|
| ソフトウェア開発 | GitHub |
| コード管理 | GitHub |
| HTML制作・管理 | GitHub（差分管理が重要な場合） |
| 業務文書管理 | Google Workspace |
| 議事録・ToDo管理 | Google Workspace |
| 非エンジニアへの展開 | Google Workspace |
| 台帳運用 | Google Workspace |
| 判断ログの蓄積 | どちらも可（運用者のスキルによる） |

**結論**: Google Workspace方式は「GitHub方式を使えない/使いにくい現場」のための擬似レポ基盤である。完全な代替ではないが、適用範囲内では十分に実用的であり、導入・運用のコストが大幅に低い。

## 併用の可能性

将来的には、以下のような併用も考えられる。

- **設計・コード**: GitHubで管理
- **業務文書・台帳**: Google Workspaceで管理
- **連携**: Apps ScriptからGitHub APIを呼ぶ、またはGitHub ActionsからGoogle APIを呼ぶ

ただし、本プロジェクトの初期フェーズでは、Google Workspace内で完結する設計を優先する。併用は将来の拡張として位置づける。
