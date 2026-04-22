const CONFIG_KEYS = {
  SOURCE_FOLDER_ID: 'SOURCE_FOLDER_ID',
  LEDGER_SPREADSHEET_ID: 'LEDGER_SPREADSHEET_ID',
  LEDGER_SHEET_NAME: 'LEDGER_SHEET_NAME'
};

const DEFAULT_LEDGER_SHEET_NAME = '文書台帳';
const POC_FOLDER_NAMES = [
  '00_業務ハブ',
  '01_正本文書',
  '02_案件管理DB',
  '03_議事録_打合せ',
  '04_判断ログ',
  '05_手順書_テンプレート',
  '06_大野さん_潮田さん作業',
  '07_検証用サンプル案件',
  '99_システム_ログ'
];

const LEDGER_HEADERS = [
  'ファイルID',
  'ファイル名',
  '種別',
  '作成日',
  '更新日',
  'フォルダパス',
  'URL',
  '元repoパス',
  '正本区分',
  '業務フェーズ',
  '主な利用者',
  '自律度',
  '承認状態',
  '要約',
  '登録方法',
  '備考'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AI Agent')
    .addItem('PoCフォルダ構成を作成', 'createKinsetsuPocFolderStructure')
    .addItem('文書台帳を同期', 'syncDocumentLedger')
    .addItem('1時間ごとの同期を設定', 'installHourlyTrigger')
    .addToUi();
}

function createKinsetsuPocFolderStructure() {
  const config = getConfig_();
  const rootFolder = DriveApp.getFolderById(config.sourceFolderId);
  const existingFolderNames = getChildFolderNames_(rootFolder);
  const created = [];
  const skipped = [];

  POC_FOLDER_NAMES.forEach((folderName) => {
    if (existingFolderNames.has(folderName)) {
      skipped.push(folderName);
      return;
    }

    rootFolder.createFolder(folderName);
    existingFolderNames.add(folderName);
    created.push(folderName);
  });

  return {
    rootFolder: rootFolder.getName(),
    created,
    skipped
  };
}

function syncDocumentLedger() {
  const config = getConfig_();
  const folder = DriveApp.getFolderById(config.sourceFolderId);
  const sheet = getLedgerSheet_(config);

  ensureLedgerHeader_(sheet);

  const existingFileIds = getExistingFileIds_(sheet);
  const rows = [];
  scanFolder_(folder, folder.getName(), existingFileIds, rows);

  if (rows.length === 0) {
    return { inserted: 0 };
  }

  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, LEDGER_HEADERS.length)
    .setValues(rows);

  return { inserted: rows.length };
}

function installHourlyTrigger() {
  const functionName = 'syncDocumentLedger';
  const exists = ScriptApp.getProjectTriggers()
    .some((trigger) => trigger.getHandlerFunction() === functionName);

  if (exists) {
    return { created: false };
  }

  ScriptApp.newTrigger(functionName)
    .timeBased()
    .everyHours(1)
    .create();

  return { created: true };
}

function getConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const sourceFolderId = properties.getProperty(CONFIG_KEYS.SOURCE_FOLDER_ID);
  const ledgerSpreadsheetId = properties.getProperty(CONFIG_KEYS.LEDGER_SPREADSHEET_ID);
  const ledgerSheetName =
    properties.getProperty(CONFIG_KEYS.LEDGER_SHEET_NAME) || DEFAULT_LEDGER_SHEET_NAME;

  if (!sourceFolderId || !ledgerSpreadsheetId) {
    throw new Error(
      'Script Properties に SOURCE_FOLDER_ID と LEDGER_SPREADSHEET_ID を設定してください。'
    );
  }

  return {
    sourceFolderId,
    ledgerSpreadsheetId,
    ledgerSheetName
  };
}

function getLedgerSheet_(config) {
  const spreadsheet = SpreadsheetApp.openById(config.ledgerSpreadsheetId);
  return spreadsheet.getSheetByName(config.ledgerSheetName)
    || spreadsheet.insertSheet(config.ledgerSheetName);
}

function ensureLedgerHeader_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, LEDGER_HEADERS.length);
  const currentHeader = headerRange.getValues()[0];
  const hasHeader = currentHeader.some((value) => value !== '');

  if (!hasHeader) {
    headerRange.setValues([LEDGER_HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function getExistingFileIds_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return new Set();
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  return new Set(values.flat().filter(String));
}

function scanFolder_(folder, folderPath, existingFileIds, rows) {
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();

    if (!existingFileIds.has(fileId)) {
      rows.push(buildLedgerRow_(file, folderPath));
      existingFileIds.add(fileId);
    }
  }

  const folders = folder.getFolders();

  while (folders.hasNext()) {
    const childFolder = folders.next();
    scanFolder_(childFolder, `${folderPath}/${childFolder.getName()}`, existingFileIds, rows);
  }
}

function getChildFolderNames_(folder) {
  const folderNames = new Set();
  const folders = folder.getFolders();

  while (folders.hasNext()) {
    folderNames.add(folders.next().getName());
  }

  return folderNames;
}

function buildLedgerRow_(file, folderPath) {
  return [
    file.getId(),
    file.getName(),
    detectDocumentType_(folderPath, file.getName()),
    file.getDateCreated(),
    file.getLastUpdated(),
    folderPath,
    file.getUrl(),
    '',
    detectCanonicalClass_(folderPath),
    detectBusinessPhase_(folderPath, file.getName()),
    detectPrimaryUsers_(folderPath),
    'L1',
    '確認待ち',
    '',
    '自動',
    ''
  ];
}

function detectDocumentType_(folderPath, fileName) {
  const text = `${folderPath}/${fileName}`;

  if (text.includes('正本文書')) return '正本文書';
  if (text.includes('案件管理DB')) return '案件管理DB';
  if (text.includes('議事録') || text.includes('打合せ')) return '議事録';
  if (text.includes('判断ログ')) return '判断ログ';
  if (text.includes('手順書') || text.includes('テンプレート')) return '手順書';
  if (text.includes('大野') || text.includes('潮田') || text.includes('担当者作業')) return '担当者作業';
  if (text.includes('サンプル案件')) return 'サンプル案件';
  if (text.includes('システム') || text.includes('ログ')) return 'システムログ';
  if (text.toLowerCase().endsWith('.html')) return 'HTML';

  return '未分類';
}

function detectCanonicalClass_(folderPath) {
  if (folderPath.includes('正本文書')) return '正本';
  if (folderPath.includes('判断ログ')) return 'ログ';
  if (folderPath.includes('大野') || folderPath.includes('潮田')) return '作業用';
  if (folderPath.includes('サンプル案件')) return 'サンプル';
  if (folderPath.includes('システム') || folderPath.includes('ログ')) return 'ログ';
  if (folderPath.includes('議事録') || folderPath.includes('打合せ')) return '派生';

  return '作業用';
}

function detectBusinessPhase_(folderPath, fileName) {
  const text = `${folderPath}/${fileName}`.toLowerCase();

  if (text.includes('phase2') || text.includes('フェーズ2')) return 'Phase 2';
  if (text.includes('phase1') || text.includes('フェーズ1')) return 'Phase 1';
  if (text.includes('poc')) return 'PoC';

  return '共通';
}

function detectPrimaryUsers_(folderPath) {
  if (folderPath.includes('大野') && folderPath.includes('潮田')) return '大野さん/潮田さん';
  if (folderPath.includes('大野')) return '大野さん';
  if (folderPath.includes('潮田')) return '潮田さん';
  if (folderPath.includes('正本文書')) return '石丸/アソシ';
  if (folderPath.includes('案件管理DB')) return 'アソシ';
  if (folderPath.includes('議事録') || folderPath.includes('打合せ')) return '石丸/アソシ/本社';
  if (folderPath.includes('判断ログ')) return '石丸/アソシ/本社';

  return '石丸';
}
