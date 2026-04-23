/**
 * set-secrets.js
 * 
 * .env の認証情報を GAS Script Properties に書き込むスクリプト
 * 1回だけ実行すれば OK。以後 .env は参照されない。
 * 
 * 使い方:
 *   node set-secrets.js
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// .env を読み込む
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env ファイルが見つかりません。先に .env を作成してください。');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  env[key.trim()] = rest.join('=').trim();
}

const required = ['CF_ACCOUNT_ID', 'CF_API_TOKEN', 'CF_PROJECT_NAME'];
for (const key of required) {
  if (!env[key] || env[key].includes('ここに')) {
    console.error(`❌ .env の ${key} が未設定です。値を入力してください。`);
    process.exit(1);
  }
}

console.log('🔑 GAS Script Properties に認証情報を書き込み中...');

// clasp script-id の取得
const claspJson = JSON.parse(fs.readFileSync(path.join(__dirname, '.clasp.json'), 'utf8'));
const scriptId = claspJson.scriptId;

// clasp を使って Script Properties をセット
const properties = {
  CF_ACCOUNT_ID: env['CF_ACCOUNT_ID'],
  CF_API_TOKEN: env['CF_API_TOKEN'],
  CF_PROJECT_NAME: env['CF_PROJECT_NAME'],
};

// JSON形式でプロパティをセットするGASコードを一時生成して実行
const tempScript = `
function _setSecrets() {
  var props = PropertiesService.getScriptProperties();
  ${Object.entries(properties).map(([k, v]) => `props.setProperty('${k}', '${v}');`).join('\n  ')}
  Logger.log('Secrets set successfully');
}
`;

const tempFile = path.join(__dirname, 'apps-script', 'src', '_set_secrets_temp.js');
fs.writeFileSync(tempFile, tempScript, 'utf8');

try {
  execSync('npx clasp push -f', { cwd: __dirname, stdio: 'inherit' });
  execSync('npx clasp run _setSecrets', { cwd: __dirname, stdio: 'inherit' });
  console.log('\n✅ Script Properties への書き込みが完了しました！');
  console.log('💡 .env ファイルは引き続き手元に保管しておいてください（Gitにはコミットしないこと）。');
} catch (err) {
  console.error('❌ エラーが発生しました:', err.message);
} finally {
  // 一時ファイルを削除
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
  // clasp pushで一時ファイルが残らないよう再push
  try {
    execSync('npx clasp push -f', { cwd: __dirname, stdio: 'inherit' });
  } catch (_) {}
}
