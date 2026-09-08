# Changelog

## Unreleased

- Require Node.js 22 or newer, test Node.js 22 and 24 in CI, and keep Node type definitions current.
- Include `.github/workflows` configuration in the deterministic, symlink-safe 80-file scan budget so CI evidence can support repository signals.
- Reject missing and non-directory scan targets with clear CLI and library errors while preserving valid empty-directory scans.
- Keep TODO/FIXME/limitation lines in risk areas instead of also listing them as proof points.
- Restrict demo commands to executable command lines so changelog prose is not reported as a command.
- Document `package:smoke` as the pack-and-execute verification it performs.

## 0.1.0

- Initial release candidate for the local repository signal-map CLI and skill.
- Includes fixture-backed scan and brief commands for README, package metadata,
  docs, tests, and source-file evidence.
- Adds release-readiness checks for type checking, tests, fixture smoke, and
  packed-tarball contents verification.
