# PRD: repo-signal-skill

Status: in-progress
Decision: build next
Created: 2026-06-29

## Pitch

`repo-signal-skill` helps agents turn a repository scan into a compact signal map for launch, review, or maintenance work: audience, proof points, risk areas, demo commands, and follow-up questions.

## Why It Matters

Repo-to-content and launch workflows need repeatable source evidence. Agents often draft posts or release notes from memory instead of linking claims to files and commands. A local-first skill that extracts reusable repo signals gives agents a safer foundation for content, review, and handoff tasks.

## V1 Scope

- TypeScript CLI and library API.
- Read local README, package metadata, docs, changelog, tests, and common config files.
- Emit Markdown and JSON signal maps with file-backed evidence references.
- Support `repo-signal-skill scan <repo>` and `repo-signal-skill brief <repo>`.
- Include `SKILL.md` with usage boundaries, inputs, side-effect policy, examples, and verification workflow.
- Add fixtures for Node package, docs-heavy repo, sparse repo, and CLI-only repo.
- Include docs/PRD.md, docs/TASKS.md, docs/ORCHESTRATION.md, smoke command, and release-candidate notes.

## Out of Scope

- Calling LLM APIs.
- Publishing posts or release notes.
- Deep semantic code analysis.
- Uploading repository contents.

## Safety

- Keep all scans local.
- Do not infer claims without evidence references.
- Redact absolute home paths in generated examples.

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, `npm run package:smoke`, and one fixture CLI smoke.
