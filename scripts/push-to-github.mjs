import { createRequire } from 'module';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative } from 'path';

const require = createRequire(import.meta.url);
const { ReplitConnectors } = require('@replit/connectors-sdk');

const c = new ReplitConnectors();
const REPO = 'foniafonia/CURSO-ONLINE-REPLIT';
const ROOT = '/home/runner/workspace';

async function gh(endpoint, options = {}) {
  const r = await c.proxy('github', endpoint, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; }
  catch { throw new Error(`Bad JSON (${r.status}): ${text.substring(0, 300)}`); }
}

function getAllFiles(dir, base, exclude) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (exclude.some(e => rel.startsWith(e) || entry.name === e)) continue;
    if (entry.isDirectory()) results.push(...getAllFiles(full, base, exclude));
    else results.push(rel);
  }
  return results;
}

const EXCLUDE = ['node_modules', '.git', 'dist', '.cache', '.agents', '.local', 'logoped-ia-todo-el-codigo.txt', 'attached_assets'];
const DIRS = ['artifacts/logoped-ia', 'artifacts/api-server', 'lib', 'scripts'];
const ROOT_FILES = ['package.json', 'pnpm-workspace.yaml', 'tsconfig.json', 'tsconfig.base.json', '.gitignore', 'replit.md', 'pnpm-lock.yaml'];

// Step 1: initialize with README
console.log('1. Initializing repo...');
const initRes = await gh(`/repos/${REPO}/contents/README.md`, {
  method: 'PUT',
  body: { message: 'init', content: Buffer.from('# Logoped-IA\n\nCurso online de logopedia con IA.').toString('base64') }
});
if (initRes.status !== 201) throw new Error('Init failed: ' + JSON.stringify(initRes.data));
const initSha = initRes.data.commit.sha;
console.log('   Init commit:', initSha.substring(0, 8));

// Step 2: get tree SHA of init commit
const commitRes = await gh(`/repos/${REPO}/git/commits/${initSha}`);
const baseTreeSha = commitRes.data.tree.sha;

// Step 3: collect all files
let allFiles = [];
for (const dir of DIRS) {
  const d = join(ROOT, dir);
  if (existsSync(d)) allFiles.push(...getAllFiles(d, ROOT, EXCLUDE));
}
for (const f of ROOT_FILES) {
  if (existsSync(join(ROOT, f))) allFiles.push(f);
}
console.log(`2. ${allFiles.length} files found. Creating blobs...`);

// Step 4: create blobs
const treeItems = [];
let i = 0;
for (const file of allFiles) {
  const content = readFileSync(join(ROOT, file));
  const res = await gh(`/repos/${REPO}/git/blobs`, {
    method: 'POST',
    body: { content: content.toString('base64'), encoding: 'base64' }
  });
  if (!res.data.sha) throw new Error(`Blob failed for ${file}: ${JSON.stringify(res.data)}`);
  treeItems.push({ path: file, mode: '100644', type: 'blob', sha: res.data.sha });
  i++;
  if (i % 20 === 0) console.log(`   ${i}/${allFiles.length} blobs...`);
}

// Step 5: create tree
console.log('3. Creating tree...');
const treeRes = await gh(`/repos/${REPO}/git/trees`, {
  method: 'POST',
  body: { base_tree: baseTreeSha, tree: treeItems }
});

// Step 6: create commit
console.log('4. Creating commit...');
const commitR = await gh(`/repos/${REPO}/git/commits`, {
  method: 'POST',
  body: {
    message: 'Logoped-IA: código completo\n\nLanding page, admin panel, Stripe, emails Brevo/Gmail, GDPR.',
    tree: treeRes.data.sha,
    parents: [initSha]
  }
});

// Step 7: update main ref
console.log('5. Updating main branch...');
await gh(`/repos/${REPO}/git/refs/heads/main`, {
  method: 'PATCH',
  body: { sha: commitR.data.sha, force: true }
});

console.log('\n✓ SUBIDO CORRECTAMENTE');
console.log('URL: https://github.com/' + REPO);
