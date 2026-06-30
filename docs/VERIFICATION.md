# Verification Report

Commands run successfully on 2026-06-30:

- npm test
- npm run check
- npm run build
- npm run smoke
- npm run package:smoke
- npm run release:check
- bash scripts/validate.sh

Smoke output confirmed Markdown signal map generation for fixtures/node-package with audience, proof points, risks, demo commands, follow-up questions, and files scanned.

`release:check` is the broadest maintained gate. It runs type checking,
fixture-backed tests, CLI smoke coverage, and package contents verification.
