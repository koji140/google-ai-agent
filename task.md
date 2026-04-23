# Task List: ホームページ改訂ワークフローの自動化

- [x] HTMLの部品化（4分割: header, guidance, faq, footer）
- [x] Google Drive への部品ファイル配置
- [x] Cloudflare Pages プレビュー環境の構築
- [x] GitHub Actions デプロイワークフローの作成
- [x] GAS から GitHub Repository Dispatch をキックする仕組みの実装
- [x] GAS 1分間隔実行トリガーの設定
- [x] 認証情報（GAS Script Properties / GitHub Secrets）の同期
- [x] 大野さん向け操作マニュアルの作成
- [x] セッションログ・ドキュメントの整備とプッシュ
- [x] 連続失敗していた GitHub Actions workflow を一時停止
- [x] GAS 側にHTML部品の変更検知を追加し、変更なしでは dispatch しないように修正

## 現在の停止状態

- `koji140/kinsetsu-process` の `Deploy HP from Drive (via GAS)` workflow は一時停止中
- 停止理由: 1分ごとの `repository_dispatch` が Cloudflare 認証エラーで連続失敗していたため
- 直近の失敗原因: Cloudflare API `Authentication failed (status: 400) [code: 9106]`
- 再開条件: GitHub Secrets の `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を確認し、テスト実行が成功すること
- GASソースは更新済み。ただし `clasp run disableHpDeployTrigger` はAPI実行設定の都合で失敗したため、必要ならApps Scriptエディタから `disableHpDeployTrigger` を手動実行する

## 次回のステップ（アイデア）
- [ ] **Cloudflare認証の修正**: `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を正しい値に更新し、workflowを再有効化する
- [ ] **強制デプロイで疎通確認**: GAS の `forceDeployHpViaGitHub` または GitHub `repository_dispatch` で1回だけ検証する
- [ ] **Gemini ↔ Google Doc 連携**: 会話だけで改訂依頼を完結させる仕組み
- [ ] **変更サマリ自動生成**: 更新時に「どこを直したか」を自動で要約して通知する機能
- [ ] **承認フロー**: 大野さんが更新した後、石丸さんがボタンを押すまで公開されない承認ステップ
