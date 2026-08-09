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
