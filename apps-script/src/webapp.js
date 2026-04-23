// apps-script/src/webapp.js

/**
 * Web Appのエントリーポイント
 * Drive上の部品化されたHTMLを結合してプレビューとして返す
 */
function doGet(e) {
  try {
    const pocFolderId = PropertiesService.getScriptProperties().getProperty('POC_ROOT_FOLDER_ID') || '1AtyDr5_VwcPlzxN8rJMDMbTqFtUlQAC0';
    const root = DriveApp.getFolderById(pocFolderId);
    
    // フォルダ階層をたどる: 03_議事録_打合せ -> 20260427_本社打合せ -> previews -> hp
    const folder1 = getFolderByNameSafety(root, '03_議事録_打合せ');
    const folder2 = getFolderByNameSafety(folder1, '20260427_本社打合せ');
    const folder3 = getFolderByNameSafety(folder2, 'previews');
    const hpFolder = getFolderByNameSafety(folder3, 'hp');
    
    if (!hpFolder) {
      return HtmlService.createHtmlOutput('<h3>エラー: プレビュー用フォルダ (previews/hp) が見つかりません。</h3>');
    }
    
    // 結合する部品の順序
    const parts = ['header.html', 'guidance.html', 'faq.html', 'footer.html'];
    let fullHtml = '';
    
    for (const part of parts) {
      const files = hpFolder.getFilesByName(part);
      if (files.hasNext()) {
        fullHtml += files.next().getBlob().getDataAsString('utf-8') + '\n';
      } else {
        fullHtml += `\n<!-- Missing component: ${part} -->\n`;
      }
    }
    
    // HTML出力オブジェクトの作成
    return HtmlService.createHtmlOutput(fullHtml)
        .setTitle('近接施工のご案内（Drive直結プレビュー）')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    return HtmlService.createHtmlOutput('<h3>システムエラーが発生しました</h3><p>' + err.toString() + '</p>');
  }
}

function getFolderByNameSafety(parentFolder, name) {
  if (!parentFolder) return null;
  const folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return null;
}
