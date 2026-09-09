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
The package smoke extracts the tarball, runs the packed CLI against the fixture
inside that extracted package, and requires JSON evidence showing that both
fixture files were scanned with proof points and demo commands. Temporary
extraction data and the generated tarball are removed on success or failure.
