import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('CI exercises supported Node release lines with frozen installs and read-only contents', async () => {
  const [workflow, packageJson] = await Promise.all([
    read('.github/workflows/ci.yml'),
    read('package.json').then(JSON.parse)
  ]);
  const minimumMajor = Number(packageJson.engines.node.match(/\d+/)?.[0]);
  const matrix = workflow.match(/node-version:\s*\[([^\]]+)\]/)?.[1]
    .split(',')
    .map((value) => Number(value.trim()));

  assert.ok(Number.isInteger(minimumMajor), 'package.json must declare a minimum Node major');
  assert.ok(minimumMajor >= 22, 'package.json must not support an end-of-life Node minimum');
  assert.deepEqual(matrix, [minimumMajor, 24], 'CI must test the supported minimum and current LTS');
  assert.match(workflow, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
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
