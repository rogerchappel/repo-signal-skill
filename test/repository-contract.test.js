import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('release check references a present contract test and release script', () => {
  const scripts = packageJson.scripts;
  assert.equal(scripts['contract:check'], 'node --test test/repository-contract.test.js');
  assert.match(scripts['release:check'], /npm run contract:check/);
  assert.ok(readdirSync(new URL('../test/', import.meta.url)).includes('repository-contract.test.js'));
});

test('release check does not run publishing or deployment commands', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.ok(workflow.includes('npm run release:check'), 'workflow runs the aggregate release gate');
  for (const [script, command] of Object.entries({
    'contract:check': 'npm run contract:check',
    lint: 'npm run lint',
    test: 'npm test',
    smoke: 'npm run smoke',
    'package:smoke': 'npm run package:smoke',
  })) {
    assert.ok(packageJson.scripts['release:check'].includes(command), `release gate includes ${script}`);
  }
  assert.match(workflow, /node-version: \[22, 24\]/);
  assert.doesNotMatch(workflow, /npm publish|npm pack --json|deploy/i);
});

test('package lifecycle builds dist before npm creates the package tarball', () => {
  assert.equal(packageJson.scripts.prepare, 'npm run build');
  assert.equal(packageJson.scripts.build, 'tsc -p tsconfig.json');
  assert.equal(packageJson.bin['repo-signal-skill'], 'dist/cli.js');
  assert.equal(packageJson.exports['.'], './dist/index.js');
});

test('package smoke asserts declared entrypoints are present in the packed tarball', () => {
  const smoke = readFileSync(new URL('../scripts/package-smoke.mjs', import.meta.url), 'utf8');
  assert.match(smoke, /package\/dist\/cli\.js/);
  assert.match(smoke, /package\/dist\/index\.js/);
  assert.match(smoke, /\['pack', '--silent'\]/);
  assert.match(smoke, /package smoke passed for installed tarball/);
});
