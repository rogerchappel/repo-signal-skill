# Installing the packed package

The published tarball is a prebuilt artifact: it contains `dist/cli.js` and
`dist/index.js`, which are the package's `bin` and `exports` targets. Consumers
install the tarball with `npm install ./repo-signal-skill-0.1.0.tgz`; they do not
need TypeScript or a build step. The root `prepare` script is used to build the
project before packing/publishing, not as a consumer-side compile step for a
packed dependency.

To verify a local tarball using the same install lifecycle as a consumer:

```sh
npm run build
npm pack --silent
mkdir /tmp/repo-signal-consumer && cd /tmp/repo-signal-consumer
npm init -y
npm install /path/to/repo-signal-skill-0.1.0.tgz
node --input-type=module -e "import { scanRepo } from 'repo-signal-skill'; console.log(typeof scanRepo)"
./node_modules/.bin/repo-signal-skill scan /path/to/a/repository --format json
```

A successful install with lifecycle scripts enabled and no TypeScript dependency
in the consumer confirms that installation uses the packed JavaScript rather
than compiling source. `npm run package:smoke` automates an offline version of
this check, including package entry-point and CLI resolution.
