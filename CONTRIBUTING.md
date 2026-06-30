# Contributing

Thanks for helping improve `repo-signal-skill`.

## Local Setup

```sh
npm install
npm run build
```

## Before Opening a PR

Run the broad release-readiness gate:

```sh
npm run release:check
```

For smaller iterations, use:

- `npm run check` for TypeScript validation.
- `npm test` for fixture-backed tests.
- `npm run smoke` for the maintained CLI fixture scan.
- `npm run package:smoke` for package contents review.

Keep fixtures small and local. Do not add private repository content, secrets,
tokens, proprietary docs, or sensitive logs to examples or test cases.
