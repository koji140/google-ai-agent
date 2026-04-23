// apps-script/src/cloudflare-deploy.js
//
// Drive上のHTML部品ファイルを組み立て、GitHub Actions (Repository Dispatch) をキックしてデプロイする

/**
 * メイン関数：Driveからコンポーネントを読み込み、GitHub Actionsをキック
 */
function deployHpViaGitHub() {
  const props = PropertiesService.getScriptProperties();
  const GITHUB_TOKEN = props.getProperty('GITHUB_TOKEN');
  const GITHUB_REPO  = props.getProperty('GITHUB_REPO') || 'koji140/kinsetsu-process';

  if (!GITHUB_TOKEN) {
    const msg = '❌ Script Properties に GITHUB_TOKEN が設定されていません。';
    Logger.log(msg);
    return msg;
  }

  // Drive から HTML 部品を読み込み
  const components = readComponentsFromDrive_();
  if (!components) {
    Logger.log('❌ Drive から HTML 部品を読み込めませんでした。');
    return '❌ Drive 読み込み失敗';
  }

  Logger.log('✅ HTML 部品読み込み完了。GitHub Actions を起動します...');

  // GitHub Repository Dispatch API を叩く
  const result = triggerGitHubAction_(GITHUB_TOKEN, GITHUB_REPO, components);
  
  if (result.success) {
    Logger.log('🚀 GitHub Actions の起動に成功しました！');
    Logger.log('数分後に https://kinsetsu-hp-preview.pages.dev/ が更新されます。');
    return '✅ デプロイ指示完了';
  } else {
    Logger.log('❌ GitHub Actions 起動失敗: ' + result.error);
    return '❌ エラー: ' + result.error;
  }
}

/**
 * Drive から 4つの部品ファイルを個別に読み込む
 */
function readComponentsFromDrive_() {
  try {
    const pocFolderId = PropertiesService.getScriptProperties().getProperty('POC_ROOT_FOLDER_ID')
      || '1AtyDr5_VwcPlzxN8rJMDMbTqFtUlQAC0';
    const root = DriveApp.getFolderById(pocFolderId);

    const hpFolder = getNestedFolder_(root, [
      '03_議事録_打合せ',
      '20260427_本社打合せ',
      'previews',
      'hp',
    ]);

    if (!hpFolder) return null;

    return {
      header:   readFile_(hpFolder, 'header.html'),
      guidance: readFile_(hpFolder, 'guidance.html'),
      faq:      readFile_(hpFolder, 'faq.html'),
      footer:   readFile_(hpFolder, 'footer.html')
    };
  } catch (e) {
    Logger.log('readComponentsFromDrive_ Error: ' + e.toString());
    return null;
  }
}

function readFile_(folder, name) {
  const iter = folder.getFilesByName(name);
  return iter.hasNext() ? iter.next().getBlob().getDataAsString('utf-8') : '';
}

/**
 * GitHub Repository Dispatch API を呼び出す
 */
function triggerGitHubAction_(token, repo, payload) {
  try {
    const url = 'https://api.github.com/repos/' + repo + '/dispatches';
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        event_type: 'deploy_hp',
        client_payload: payload
      }),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 204) {
      return { success: true };
    } else {
      return { success: false, error: 'HTTP ' + code + ': ' + response.getContentText() };
    }
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getNestedFolder_(root, names) {
  let current = root;
  for (const name of names) {
    const iter = current.getFoldersByName(name);
    if (!iter.hasNext()) return null;
    current = iter.next();
  }
  return current;
}

/**
 * 変更検知トリガーの設定
 */
function setupDriveTrigger() {
  // すべての既存トリガーをクリア
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // 1分ごとに変更をチェック（DriveのonChangeは信頼性が低いため、時間主導の方が確実）
  ScriptApp.newTrigger('deployHpViaGitHub')
    .timeBased()
    .everyMinutes(1) // とりあえず1分ごと。必要に応じて調整
    .create();

  Logger.log('✅ 自動デプロイトリガー（1分間隔）を設定しました');
}
