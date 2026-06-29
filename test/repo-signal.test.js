import test from 'node:test';
import assert from 'node:assert/strict';
import { briefRepo, scanRepo, signalMapToMarkdown } from '../dist/index.js';

test('scans fixture repository with evidence', () => { const map = scanRepo('fixtures/node-package'); assert.equal(map.name, 'fixture-node'); assert.ok(map.proofPoints.length > 0); assert.ok(map.demoCommands.length > 0); });
test('creates markdown signal map', () => { const md = signalMapToMarkdown(scanRepo('fixtures/docs-heavy')); assert.match(md, /Repo Signal Map/); assert.match(md, /Safety/); });
test('brief returns compact fields', () => { const brief = briefRepo('fixtures/cli-only'); assert.equal(brief.name, 'cli-only'); assert.ok(brief.firstDemo); });
