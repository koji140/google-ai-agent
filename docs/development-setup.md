# 開発セットアップ

このリポジトリは、Phase 1 PoC（`kinsetsu-process` 再現用Driveフォルダをスキャンして文書台帳Sheetへ登録）をローカルで開発できる最小構成を含んでいる。

## 前提

- Node.js / npm
- Googleアカウント
- Google Driveの `kinsetsu-workspace-agent-poc` フォルダ
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

PoCルートフォルダを作る。配下フォルダはApps Scriptの `createKinsetsuPocFolderStructure` で作成できる。

```text
kinsetsu-workspace-agent-poc/
├── 00_業務ハブ/
├── 01_正本文書/
├── 02_案件管理DB/
├── 03_議事録_打合せ/
├── 04_判断ログ/
├── 05_手順書_テンプレート/
├── 06_大野さん_潮田さん作業/
├── 07_検証用サンプル案件/
└── 99_システム_ログ/
```

手動で配下フォルダを作る場合も、上記の構成にそろえる。

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

PoCルート配下のフォルダ構成を作る場合は、Apps Scriptエディタで `createKinsetsuPocFolderStructure` を手動実行する。すでに存在するフォルダはスキップされる。

## トリガー設定

Apps Scriptエディタ、または文書台帳Sheetのカスタムメニュー `AI Agent` から `1時間ごとの同期を設定` を実行する。

## 実装済みの範囲

- 指定Driveフォルダ配下を再帰的にスキャン
- ファイルIDで重複登録を防止
- 新規ファイルを文書台帳に追記
- フォルダ名・ファイル名から種別を簡易判定
- PoCルート配下の標準フォルダ構成を作成
- 1時間ごとの時間トリガー作成
- Sheet上のカスタムメニュー追加

## まだ未実装

- Gemini API連携
- ToDo / 決定事項抽出
- エラーログSheet
- 大量ファイル向けの分割実行
- Drive Push通知によるリアルタイム検知
