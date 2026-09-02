import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('CI exercises the minimum Node major with frozen installs and read-only contents', async () => {
  const [workflow, packageJson] = await Promise.all([
    read('.github/workflows/ci.yml'),
    read('package.json').then(JSON.parse)
  ]);
  const minimumMajor = packageJson.engines.node.match(/\d+/)?.[0];

  assert.ok(minimumMajor, 'package.json must declare a minimum Node major');
  assert.match(workflow, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
  assert.match(workflow, new RegExp(`node-version:\\s*\\[[^\\]]*\\b${minimumMajor}\\b[^\\]]*\\]`));
  assert.match(workflow, /node-version:\s*\$\{\{\s*matrix\.node-version\s*\}\}/);
  assert.match(workflow, /^\s+- run:\s*npm ci\s*$/m);
  assert.match(workflow, /^\s+- run:\s*npm run release:check\s*$/m);
});

test('contributor setup consumes the committed lockfile', async () => {
  for (const path of ['README.md', 'CONTRIBUTING.md']) {
    const contents = await read(path);
    assert.match(contents, /```(?:bash|sh)\nnpm ci\n/m, `${path} setup must use npm ci`);
    assert.doesNotMatch(contents, /```(?:bash|sh)\nnpm install\n/m, `${path} setup must not use npm install`);
  }
});
