import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { briefRepo, scanRepo, signalMapToMarkdown } from '../dist/index.js';

test('scans fixture repository with evidence', () => { const map = scanRepo('fixtures/node-package'); assert.equal(map.name, 'fixture-node'); assert.ok(map.proofPoints.length > 0); assert.ok(map.demoCommands.length > 0); });
test('creates markdown signal map', () => { const md = signalMapToMarkdown(scanRepo('fixtures/docs-heavy')); assert.match(md, /Repo Signal Map/); assert.match(md, /Safety/); });
test('brief returns compact fields', () => { const brief = briefRepo('fixtures/cli-only'); assert.equal(brief.name, 'cli-only'); assert.ok(brief.firstDemo); });

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
