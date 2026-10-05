#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const required = [
  'package/dist/cli.js', 'package/dist/index.js', 'package/SKILL.md', 'package/README.md',
  'package/LICENSE', 'package/SECURITY.md', 'package/CHANGELOG.md', 'package/CONTRIBUTING.md',
  'package/fixtures/node-package/package.json', 'package/fixtures/node-package/README.md',
  'package/docs/VERIFICATION.md'
];

export function assertPackedFixtureScan(map) {
  if (map.name !== 'fixture-node') throw new Error(`packed fixture scan returned unexpected repository name: ${map.name}`);
  if (!Array.isArray(map.filesScanned) || !map.filesScanned.includes('package.json') || !map.filesScanned.includes('README.md')) {
    throw new Error('packed fixture scan did not inspect its package.json and README.md');
  }
  if (!Array.isArray(map.proofPoints) || map.proofPoints.length === 0) throw new Error('packed fixture scan returned no proof points');
  if (!Array.isArray(map.demoCommands) || map.demoCommands.length === 0) throw new Error('packed fixture scan returned no demo commands');
}

export function runPackageSmoke() {
  const dir = mkdtempSync(join(tmpdir(), 'repo-signal-pack-'));
  let tarball;
  try {
    tarball = execFileSync('npm', ['pack', '--silent'], { encoding: 'utf8' }).trim();
    execFileSync('tar', ['-xzf', tarball, '-C', dir]);
    const contents = execFileSync('find', [join(dir, 'package'), '-type', 'f'], { encoding: 'utf8' });
    for (const file of required) {
      if (!contents.includes(join(dir, file))) throw new Error(`packed tarball missing ${file}`);
    }

    const install = mkdtempSync(join(dir, 'repo-signal-install-'));
    execFileSync('npm', ['init', '-y'], { cwd: install, stdio: 'ignore' });
    execFileSync('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', join(process.cwd(), tarball)], {
      cwd: install, stdio: 'ignore'
    });
    execFileSync('node', ['--input-type=module', '-e',
      "import assert from 'node:assert/strict'; import { scanRepo } from 'repo-signal-skill'; assert.equal(typeof scanRepo, 'function');"],
    { cwd: install, stdio: 'ignore' });

    const fixture = join(dir, 'package/fixtures/node-package');
    const cliOutput = execFileSync(join(install, 'node_modules/.bin/repo-signal-skill'),
      ['scan', fixture, '--format', 'json'], { cwd: install, encoding: 'utf8' });
    assertPackedFixtureScan(JSON.parse(cliOutput));
    console.log(`package smoke passed for installed tarball ${tarball}`);
  } finally {
    if (tarball) rmSync(tarball, { force: true });
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runPackageSmoke();
