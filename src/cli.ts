#!/usr/bin/env node
import { briefRepo, scanRepo, signalMapToMarkdown } from './index.js';
const usage = 'Usage: repo-signal-skill scan <repo> [--format markdown|json] | brief <repo> [--format json]';

function failUsage(message: string): never {
  console.error(`Error: ${message}\n${usage}`);
  process.exit(2);
}

const [, , cmd, repo, ...args] = process.argv;
if (!cmd || !repo || !['scan', 'brief'].includes(cmd)) failUsage('expected a command and repository path');

let format = cmd === 'brief' ? 'json' : 'markdown';
let sawFormat = false;
for (let index = 0; index < args.length; index += 1) {
  const option = args[index];
  if (option !== '--format') failUsage(`unknown option: ${option}`);
  if (sawFormat) failUsage('duplicate option: --format');
  sawFormat = true;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) failUsage('missing value for --format');
  format = value;
  index += 1;
}

const allowedFormats = cmd === 'brief' ? ['json'] : ['markdown', 'json'];
if (!allowedFormats.includes(format)) failUsage(`invalid format for ${cmd}: ${format}`);

if (cmd === 'brief') {
  const result = briefRepo(repo);
  console.log(JSON.stringify(result,null,2));
} else {
  const result = scanRepo(repo);
  console.log(format === 'json' ? JSON.stringify(result,null,2) : signalMapToMarkdown(result));
}
