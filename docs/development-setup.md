# 開発セットアップ

このリポジトリは設計ドキュメント中心の初期状態から、Phase 1 PoC（Driveフォルダをスキャンして文書台帳Sheetへ登録）をローカルで開発できる最小構成を追加している。

## 前提

- Node.js / npm
- Googleアカウント
- Google DriveのPoC用フォルダ
- Google Sheetsの文書台帳
- Apps Script APIの有効化

## ローカル準備

```powershell
npm install
npm run clasp:login
Copy-Item .clasp.json.example .clasp.json
```

`.clasp.json` の `scriptId` を、自分のApps ScriptプロジェクトIDに差し替える。

## Google側で用意するもの

### 1. Driveフォルダ

`docs/next-actions.md` の構成に沿って、PoC用フォルダを作る。

```text
google-ai-agent-poc/
├── 01_打ち合わせ資料/
├── 02_議事録/
├── 03_HTML/
├── 04_成果物/
├── 05_判断ログ/
├── 06_テンプレート/
└── 99_台帳/
```

### 2. 文書台帳Sheet

`templates/document-ledger-headers.csv` と同じ列を持つSheetを作る。シート名は初期値で `文書台帳`。

### 3. Script Properties

Apps Scriptの「プロジェクトの設定」から、以下を設定する。

| キー | 値 |
|---|---|
| `SOURCE_FOLDER_ID` | スキャン対象のDriveフォルダID |
| `LEDGER_SPREADSHEET_ID` | 文書台帳SpreadsheetのID |
| `LEDGER_SHEET_NAME` | 任意。未設定なら `文書台帳` |

## Apps Scriptへの反映

```powershell
npm run clasp:push
npm run clasp:open
```

Apps Scriptエディタで `syncDocumentLedger` を手動実行し、初回の権限承認を行う。

## トリガー設定

Apps Scriptエディタ、または文書台帳Sheetのカスタムメニュー `AI Agent` から `1時間ごとの同期を設定` を実行する。

## 実装済みの範囲

- 指定Driveフォルダ配下を再帰的にスキャン
- ファイルIDで重複登録を防止
- 新規ファイルを文書台帳に追記
- フォルダ名・ファイル名から種別を簡易判定
- 1時間ごとの時間トリガー作成
- Sheet上のカスタムメニュー追加

## まだ未実装

- Gemini API連携
- ToDo / 決定事項抽出
- エラーログSheet
- 大量ファイル向けの分割実行
- Drive Push通知によるリアルタイム検知

