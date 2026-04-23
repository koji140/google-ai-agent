/**
 * set-secrets-api.js
 * 
 * clasp の既存OAuth認証を使い、Apps Script REST API で
 * Script Properties に Cloudflare 認証情報を直接書き込む
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

// .env を読み込む
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  env[key.trim()] = rest.join('=').trim();
}

// clasp 認証情報を読み込む
const clasprcPath = path.join(os.homedir(), '.clasprc.json');
const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
const token = clasprc.tokens.default;

// .clasp.json からスクリプトIDを取得
const claspJson = JSON.parse(fs.readFileSync(path.join(__dirname, '.clasp.json'), 'utf8'));
const scriptId = claspJson.scriptId;

// まずaccess_tokenをrefreshする
function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      client_id: token.client_id,
      client_secret: token.client_secret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    });

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.access_token) resolve(parsed.access_token);
        else reject(new Error('Failed to refresh token: ' + data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Apps Script API でScript Propertiesをセット
function setScriptProperties(accessToken, properties) {
  return new Promise((resolve, reject) => {
    // Script Properties は GAS内で設定するため、
    // processesAPI や script.run APIを使う
    // 代わりに、プロパティを直接設定するAPIはないので
    // GASのscript.run APIを使う（APIとして実行の設定が必要）
    // 
    // 代替案: Apps Script API の scripts.run を呼ぶ
    const body = JSON.stringify({
      function: '_setSecrets',
      devMode: true,
    });

    const req = https.request({
      hostname: 'script.googleapis.com',
      path: `/v1/scripts/${scriptId}:run`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (res.statusCode === 200) resolve(parsed);
        else reject(new Error(`API error ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🔑 access_token を更新中...');
  let accessToken;
  try {
    accessToken = await refreshAccessToken();
    console.log('✅ access_token 更新成功');
  } catch (err) {
    console.error('❌ token refresh 失敗:', err.message);
    process.exit(1);
  }

  console.log('📡 Apps Script API でプロパティを設定中...');
  try {
    const result = await setScriptProperties(accessToken, env);
    if (result.error) {
      console.error('❌ GAS実行エラー:', JSON.stringify(result.error, null, 2));
      console.log('\n⚠️  GASがAPI実行可能として未デプロイのため、手動設定が必要です。');
      console.log('以下の手順でScript Propertiesを設定してください:');
      console.log('1. https://script.google.com/d/' + scriptId + '/edit を開く');
      console.log('2. 「プロジェクトの設定」（⚙️）をクリック');
      console.log('3. 「スクリプト プロパティ」→「プロパティを追加」');
      console.log(`   CF_ACCOUNT_ID = ${env.CF_ACCOUNT_ID}`);
      console.log(`   CF_API_TOKEN  = ${env.CF_API_TOKEN}`);
      console.log(`   CF_PROJECT_NAME = ${env.CF_PROJECT_NAME}`);
    } else {
      console.log('✅ Script Properties 設定完了！', result);
    }
  } catch (err) {
    console.error('❌ API呼び出し失敗:', err.message);
    console.log('\n手動設定の手順:');
    console.log('1. https://script.google.com/d/' + scriptId + '/edit を開く');
    console.log('2. 「プロジェクトの設定」（⚙️）→「スクリプト プロパティ」→「プロパティを追加」');
    console.log(`   CF_ACCOUNT_ID   = ${env.CF_ACCOUNT_ID}`);
    console.log(`   CF_API_TOKEN    = ${env.CF_API_TOKEN}`);
    console.log(`   CF_PROJECT_NAME = ${env.CF_PROJECT_NAME}`);
  }
}

main();
