import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { briefRepo, scanRepo, signalMapToMarkdown } from '../dist/index.js';

function runCli(...args) {
  return spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' });
}

test('scans fixture repository with evidence', () => { const map = scanRepo('fixtures/node-package'); assert.equal(map.name, 'fixture-node'); assert.ok(map.proofPoints.length > 0); assert.ok(map.demoCommands.length > 0); });
test('creates markdown signal map', () => { const md = signalMapToMarkdown(scanRepo('fixtures/docs-heavy')); assert.match(md, /Repo Signal Map/); assert.match(md, /Safety/); });
test('brief returns compact fields', () => { const brief = briefRepo('fixtures/cli-only'); assert.equal(brief.name, 'cli-only'); assert.ok(brief.firstDemo); });

test('library rejects nonexistent and non-directory repository paths', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'repo-signal-target-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, 'README.md');
  writeFileSync(file, '# Not a repository');

  assert.throws(() => scanRepo(join(root, 'missing')), /Repository path does not exist:/);
  assert.throws(() => scanRepo(file), /Repository path is not a directory:/);
});

test('library preserves valid empty-directory scans', (t) => {
  const repo = mkdtempSync(join(tmpdir(), 'repo-signal-empty-test-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  const map = scanRepo(repo);

  assert.equal(map.name, repo.split('/').pop());
  assert.deepEqual(map.filesScanned, []);
});

test('scan budget is deterministic and preserves source and test evidence', (t) => {
  const repo = mkdtempSync(join(tmpdir(), 'repo-signal-budget-test-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  mkdirSync(join(repo, 'docs', 'nested'), { recursive: true });
  mkdirSync(join(repo, 'src'));
  mkdirSync(join(repo, 'test'));

  for (let index = 0; index < 100; index += 1) {
    const directory = index % 2 === 0 ? join(repo, 'docs') : join(repo, 'docs', 'nested');
    writeFileSync(join(directory, `guide-${String(index).padStart(3, '0')}.md`), `guide ${index}`);
  }
  writeFileSync(join(repo, 'src', 'feature.ts'), 'export const feature = true;');
  writeFileSync(join(repo, 'test', 'feature.test.js'), 'test("feature", () => {});');

  const first = scanRepo(repo).filesScanned;
  const second = scanRepo(repo).filesScanned;

  assert.equal(first.length, 80);
  assert.deepEqual(first, second);
  assert.ok(first.includes('src/feature.ts'));
  assert.ok(first.includes('test/feature.test.js'));
});

test('scan budget caps flat and nested trees at the same limit', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'repo-signal-bound-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  for (const shape of ['flat', 'nested']) {
    const repo = join(root, shape);
    const docs = shape === 'flat' ? join(repo, 'docs') : join(repo, 'docs', 'a', 'b');
    mkdirSync(docs, { recursive: true });
    for (let index = 0; index < 100; index += 1) {
      writeFileSync(join(docs, `file-${String(index).padStart(3, '0')}.md`), `file ${index}`);
    }
    assert.equal(scanRepo(repo).filesScanned.length, 80);
  }
});

test('TODO/FIXME/limitation lines stay in risk areas and are not proof points', () => {
  const map = scanRepo('fixtures/sparse-repo');

  assert.equal(map.proofPoints.length, 0);
  assert.ok(map.riskAreas.some((item) => /TODO: document usage\./.test(item.text)));
});

test('CLI scan reports sparse fixture TODO only as a risk', () => {
  const result = runCli('scan', 'fixtures/sparse-repo', '--format', 'json');

  assert.equal(result.status, 0);
  const map = JSON.parse(result.stdout);
  assert.equal(map.proofPoints.length, 0);
  assert.ok(map.riskAreas.some((item) => /TODO: document usage\./.test(item.text)));
});

test('self-scan demo commands are executable command lines, not changelog prose', () => {
  const map = scanRepo('.');

  assert.equal(map.demoCommands.some((item) => item.file === 'CHANGELOG.md'), false);
  for (const demo of map.demoCommands) {
    assert.ok(
      /^\s*(npm|npx|node|pnpm|yarn|bun|curl|wget|python3?|git|sh|bash|zsh|deno|ruby|go|make|docker|gh|brew|pip3?|cargo)\b/.test(demo.text) ||
        /dist\/cli\.js/.test(demo.text) ||
        /npm run/.test(demo.text) ||
        /^\s*[$>]/.test(demo.text),
      `demo command is not command-shaped: ${demo.file}:${demo.line} ${demo.text}`,
    );
  }
});

test('demo commands exclude prose mentions and keep copy-pasteable commands', () => {
  const map = scanRepo('fixtures/node-package');

  assert.deepEqual(map.demoCommands.map((item) => item.text), [
    'npm run smoke',
    '$ node dist/cli.js scan . --format markdown',
  ]);
});

test('CLI demo commands contain only executable command text', () => {
  const result = runCli('scan', 'fixtures/node-package', '--format', 'json');

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout).demoCommands.map((item) => item.text), [
    'npm run smoke',
    '$ node dist/cli.js scan . --format markdown',
  ]);
});

test('CLI accepts documented scan formats', () => {
  const markdown = runCli('scan', 'fixtures/node-package', '--format', 'markdown');
  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /# Repo Signal Map/);

  const json = runCli('scan', 'fixtures/node-package', '--format', 'json');
  assert.equal(json.status, 0);
  assert.equal(JSON.parse(json.stdout).name, 'fixture-node');
});

test('CLI accepts brief JSON output', () => {
  const result = runCli('brief', 'fixtures/cli-only', '--format', 'json');
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).name, 'cli-only');
});

test('CLI rejects nonexistent and non-directory repository paths', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'repo-signal-cli-target-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, 'README.md');
  writeFileSync(file, '# Not a repository');

  for (const [target, error] of [
    [join(root, 'missing'), /Repository path does not exist:/],
    [file, /Repository path is not a directory:/],
  ]) {
    const result = runCli('scan', target, '--format', 'json');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, error);
  }
});

for (const [name, args, error] of [
  ['invalid scan format', ['scan', 'fixtures/node-package', '--format', 'yaml'], /invalid format for scan: yaml/],
  ['invalid brief format', ['brief', 'fixtures/cli-only', '--format', 'markdown'], /invalid format for brief: markdown/],
  ['missing format value', ['scan', 'fixtures/node-package', '--format'], /missing value for --format/],
  ['unknown option', ['scan', 'fixtures/node-package', '--bogus'], /unknown option: --bogus/],
  ['duplicate option', ['scan', 'fixtures/node-package', '--format', 'json', '--format', 'markdown'], /duplicate option: --format/],
]) {
  test(`CLI rejects ${name}`, () => {
    const result = runCli(...args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, error);
    assert.match(result.stderr, /Usage: repo-signal-skill/);
  });
}

test('does not scan external files through symlinks', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'repo-signal-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  const external = join(root, 'external');
  mkdirSync(repo);
  mkdirSync(external);
  writeFileSync(join(external, 'README.md'), '## Quickstart PRIVATE_EXTERNAL_FILE');
  symlinkSync(join(external, 'README.md'), join(repo, 'README.md'));

  const map = scanRepo(repo);

  assert.doesNotMatch(JSON.stringify(map), /PRIVATE_EXTERNAL_FILE/);
  assert.equal(map.filesScanned.includes('README.md'), false);
});

test('does not scan external directories through symlinks', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'repo-signal-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  const external = join(root, 'external');
  mkdirSync(repo);
  mkdirSync(external);
  writeFileSync(join(external, 'guide.md'), '## Usage PRIVATE_EXTERNAL_DIRECTORY');
  symlinkSync(external, join(repo, 'docs'));

  const map = scanRepo(repo);

  assert.doesNotMatch(JSON.stringify(map), /PRIVATE_EXTERNAL_DIRECTORY/);
  assert.equal(map.filesScanned.some(file => file.startsWith('docs/')), false);
});
