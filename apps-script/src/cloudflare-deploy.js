// apps-script/src/cloudflare-deploy.js
//
// Drive上のHTML部品ファイルを組み立て、GitHub Actions (Repository Dispatch) をキックしてデプロイする

/**
 * メイン関数：Driveからコンポーネントを読み込み、GitHub Actionsをキック
 */
function deployHpViaGitHub() {
  return deployHpViaGitHub_(false);
}

function forceDeployHpViaGitHub() {
  return deployHpViaGitHub_(true);
}

function deployHpViaGitHub_(force) {
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

  const currentDigest = digestPayload_(components);
  const lastDispatchedDigest = props.getProperty('HP_LAST_DISPATCH_DIGEST');

  if (!force && currentDigest === lastDispatchedDigest) {
    const msg = '✅ HTML部品に変更がないため、GitHub Actions起動をスキップしました。';
    Logger.log(msg);
    return msg;
  }

  Logger.log('✅ HTML 部品読み込み完了。GitHub Actions を起動します...');

  // GitHub Repository Dispatch API を叩く
  const result = triggerGitHubAction_(GITHUB_TOKEN, GITHUB_REPO, components);
  
  if (result.success) {
    props.setProperty('HP_LAST_DISPATCH_DIGEST', currentDigest);
    props.setProperty('HP_LAST_DISPATCHED_AT', new Date().toISOString());
    Logger.log('🚀 GitHub Actions の起動に成功しました！');
    Logger.log('数分後に https://kinsetsu-hp-preview.pages.dev/ が更新されます。');
    return '✅ デプロイ指示完了';
  } else {
    Logger.log('❌ GitHub Actions 起動失敗: ' + result.error);
    return '❌ エラー: ' + result.error;
  }
}

function digestPayload_(payload) {
  const json = JSON.stringify(payload);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, json);

  return bytes
    .map((byte) => {
      const normalized = byte < 0 ? byte + 256 : byte;
      return normalized.toString(16).padStart(2, '0');
    })
    .join('');
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
  deleteHpDeployTriggers_();

  // DriveのonChangeは環境差があるため、時間主導で変更有無だけを確認する。
  ScriptApp.newTrigger('deployHpViaGitHub')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('✅ 自動デプロイトリガー（5分間隔）を設定しました');
}

function disableHpDeployTrigger() {
  const deleted = deleteHpDeployTriggers_();
  Logger.log(`✅ HP自動デプロイトリガーを ${deleted} 件削除しました`);
  return { deleted };
}

function deleteHpDeployTriggers_() {
  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'deployHpViaGitHub') {
      ScriptApp.deleteTrigger(trigger);
      deleted += 1;
    }
  });

  return deleted;
}
