const CONFIG_KEYS = {
  SOURCE_FOLDER_ID: 'SOURCE_FOLDER_ID',
  LEDGER_SPREADSHEET_ID: 'LEDGER_SPREADSHEET_ID',
  LEDGER_SHEET_NAME: 'LEDGER_SHEET_NAME'
};

const DEFAULT_LEDGER_SHEET_NAME = '文書台帳';
const LEDGER_HEADERS = [
  'ファイルID',
  'ファイル名',
  '種別',
  '作成日',
  '更新日',
  'フォルダパス',
  'URL',
  '要約',
  'ステータス',
  '登録方法',
  '備考'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AI Agent')
    .addItem('文書台帳を同期', 'syncDocumentLedger')
    .addItem('1時間ごとの同期を設定', 'installHourlyTrigger')
    .addToUi();
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
    'ドラフト',
    '自動',
    ''
  ];
}

function detectDocumentType_(folderPath, fileName) {
  const text = `${folderPath}/${fileName}`;

  if (text.includes('打ち合わせ')) return '打ち合わせ資料';
  if (text.includes('議事録')) return '議事録';
  if (text.includes('HTML') || text.toLowerCase().endsWith('.html')) return 'HTML';
  if (text.includes('成果物')) return '成果物';
  if (text.includes('判断ログ')) return '判断ログ';

  return '未分類';
}

