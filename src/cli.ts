#!/usr/bin/env node
import { briefRepo, scanRepo, signalMapToMarkdown } from './index.js';
const [, , cmd, repo, ...args] = process.argv;
const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'markdown';
if (!cmd || !repo || !['scan','brief'].includes(cmd)) { console.error('Usage: repo-signal-skill scan <repo> [--format markdown|json] | brief <repo> [--format json]'); process.exit(2); }
const result = cmd === 'brief' ? briefRepo(repo) : scanRepo(repo);
console.log(format === 'json' ? JSON.stringify(result,null,2) : signalMapToMarkdown(result));
