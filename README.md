# repo-signal-skill

Local repository signal maps for agent launch, review, and maintenance workflows. The CLI scans local README, package metadata, docs, tests, and source files, then emits evidence-backed audience, proof point, risk, demo command, and follow-up-question sections.

## Quickstart

```bash
npm install
npm run build
node dist/cli.js scan fixtures/node-package --format markdown
node dist/cli.js brief fixtures/docs-heavy --format json
```

## CLI

- `repo-signal-skill scan <repo> [--format markdown|json]` emits a full signal map.
- `repo-signal-skill brief <repo> --format json` emits a compact handoff object.

## Library

```js
import { scanRepo, signalMapToMarkdown } from 'repo-signal-skill';
console.log(signalMapToMarkdown(scanRepo('.')));
```

## Safety Notes

All scans are local. The tool does not call LLMs, publish content, upload files, or infer claims without file-backed evidence. Review output before using it in launch posts, release notes, or review reports.

## Limitations

V1 uses deterministic file and line matching. It favors concise evidence over deep semantic analysis and does not parse every language ecosystem.

## Verification

```bash
npm run lint
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`release:check` runs TypeScript validation, fixture-backed tests, the maintained
CLI smoke scan, and package contents verification. `package:smoke` builds the
CLI, verifies the published bin target, support docs, skill file, fixtures, and
package allowlist, then runs `npm pack --dry-run`.

The `lint` script is the contributor-facing alias for TypeScript validation so
CI, local release checks, and package reviewers all use the same static gate.
