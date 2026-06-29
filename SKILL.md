# repo-signal-skill

Use this skill when an agent needs a compact, evidence-backed map of a local repository before writing launch material, review notes, maintenance plans, or handoffs.

## Inputs

- Path to a local repository or fixture directory.
- README, package metadata, docs, changelog, tests, and common source/config files.

## Side-Effect Boundary

The skill is read-only and local-first. It must not upload repository contents, publish posts, open PRs, or call external APIs.

## Examples

```bash
repo-signal-skill scan . --format markdown
repo-signal-skill brief fixtures/node-package --format json
```

## Validation

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `npm run package:smoke`. Confirm each claim in the signal map has a file reference before using it downstream.
