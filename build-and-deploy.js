/**
 * build-and-deploy.js
 * 
 * Drive上のHTML部品ファイル（ローカルのソース）を組み立てて index.html を生成し、
 * Cloudflare Pages へ自動デプロイするビルドスクリプト
 * 
 * 使い方:
 *   node build-and-deploy.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMPONENTS_DIR = path.join(__dirname, 'apps-script', 'src', 'html');
const OUTPUT_DIR = path.join(
  'C:\\Users\\ishim\\github\\kinsetsu-process',
  'docs', 'briefings', '20260427-hq-meeting', 'previews', 'hp'
);
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html');

// 部品ファイルの結合順序
const PARTS = ['header.html', 'guidance.html', 'faq.html', 'footer.html'];

console.log('🔧 HTML部品を組み立て中...');

let assembled = '';
for (const part of PARTS) {
  const filePath = path.join(COMPONENTS_DIR, part);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 部品ファイルが見つかりません: ${part}`);
    process.exit(1);
  }
  assembled += fs.readFileSync(filePath, 'utf8') + '\n';
  console.log(`  ✅ ${part}`);
}

// index.html に書き出し
fs.writeFileSync(OUTPUT_FILE, assembled, 'utf8');
console.log(`\n✅ index.html を生成しました: ${OUTPUT_FILE}`);

// Cloudflare Pages にデプロイ
console.log('\n🚀 Cloudflare Pages にデプロイ中...');
try {
  const result = execSync(
    'npx wrangler pages deploy docs/briefings/20260427-hq-meeting/previews/hp --project-name kinsetsu-hp-preview --branch main --commit-dirty=true',
    { cwd: 'C:\\Users\\ishim\\github\\kinsetsu-process', encoding: 'utf8' }
  );
  console.log(result);
  
  // デプロイURLを抽出して表示
  const urlMatch = result.match(/https:\/\/[^\s]+\.kinsetsu-hp-preview\.pages\.dev/);
  if (urlMatch) {
    console.log('\n🎉 デプロイ完了！');
    console.log(`📄 プレビューURL: ${urlMatch[0]}`);
  } else {
    console.log('\n🎉 デプロイ完了！');
    console.log('📄 プレビューURL: https://kinsetsu-hp-preview.pages.dev/');
  }
} catch (err) {
  console.error('❌ デプロイに失敗しました:');
  console.error(err.stdout || err.message);
  process.exit(1);
}
