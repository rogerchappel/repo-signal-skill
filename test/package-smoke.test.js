import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPackedFixtureScan } from '../scripts/package-smoke.mjs';

const validScan = {
  name: 'fixture-node',
  filesScanned: ['README.md', 'package.json'],
  proofPoints: [{ file: 'README.md', text: 'Usage' }],
  demoCommands: [{ file: 'README.md', text: 'npm test' }]
};

test('accepts meaningful evidence scanned from the packed fixture', () => {
  assert.doesNotThrow(() => assertPackedFixtureScan(validScan));
});

test('rejects incomplete or unscannable packed fixture evidence', () => {
  assert.throws(() => assertPackedFixtureScan({ ...validScan, filesScanned: ['README.md'] }), /package\.json and README\.md/);
  assert.throws(() => assertPackedFixtureScan({ ...validScan, proofPoints: [] }), /no proof points/);
  assert.throws(() => assertPackedFixtureScan({ ...validScan, demoCommands: [] }), /no demo commands/);
});
