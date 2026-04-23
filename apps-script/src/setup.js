function autoSetupEnvironment() {
  const pocFolderId = '1AtyDr5_VwcPlzxN8rJMDMbTqFtUlQAC0';
  const pocFolder = DriveApp.getFolderById(pocFolderId);
  
  // 1. Create Spreadsheet
  const ss = SpreadsheetApp.create("文書台帳");
  const ssId = ss.getId();
  const file = DriveApp.getFileById(ssId);
  
  // Rename the default sheet
  ss.getSheets()[0].setName("文書台帳");
  
  // 2. Set properties
  PropertiesService.getScriptProperties().setProperties({
    'SOURCE_FOLDER_ID': pocFolderId,
    'LEDGER_SPREADSHEET_ID': ssId,
    'LEDGER_SHEET_NAME': '文書台帳'
  });
  
  // 3. Create Folder structure
  createKinsetsuPocFolderStructure();
  
  // 4. Move spreadsheet to "02_案件管理DB"
  const dbFolders = pocFolder.getFoldersByName('02_案件管理DB');
  if (dbFolders.hasNext()) {
    file.moveTo(dbFolders.next());
  } else {
    file.moveTo(pocFolder);
  }
  
  // 5. Sync Document Ledger
  syncDocumentLedger();
  
  return "Setup completed successfully. SS ID: " + ssId;
}
