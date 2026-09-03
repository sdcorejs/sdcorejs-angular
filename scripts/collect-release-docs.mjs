#!/usr/bin/env node
// Collect AI-readable API docs for one release suffix across all supported
// Angular workspaces. A tag like `v1.0` produces:
//   19.1.0, 20.1.0, 21.1.0, 22.1.0
//
// This script is meant to run from the tag publish workflow after npm publish
// succeeds, then commit the generated `published-docs/**` archive back to main.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MAJORS = [19, 20, 21, 22];

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function resolvePatch() {
  let patch = getArg('patch');
  const tag = getArg('tag') || process.env.GITHUB_REF_NAME;
  if (!patch && tag) patch = tag.replace(/^refs\/tags\//, '').replace(/^v/, '');
  if (patch?.startsWith('v')) patch = patch.slice(1);

  if (!patch) {
    throw new Error('Cannot resolve release suffix: pass --patch 1.0 or --tag v1.0.');
  }
  if (!/^\d+\.\d+(?:-(?:alpha|beta|rc)(?:\.\d+)?)?$/.test(patch)) {
    throw new Error(`Invalid release suffix "${patch}". Expected 1.0 or 1.0-beta.1.`);
  }
  return patch;
}

function appendValueArg(args, name) {
  const value = getArg(name);
  if (value) args.push(`--${name}`, value);
}

function appendFlag(args, name) {
  if (hasFlag(name)) args.push(`--${name}`);
}

function main() {
  const patch = resolvePatch();
  console.log(`[collect-release-docs] release suffix ${patch}`);

  for (const major of MAJORS) {
    const args = [
      join('scripts', 'collect-docs.mjs'),
      '--workspace',
      `v${major}`,
      '--version',
      `${major}.${patch}`,
    ];

    appendValueArg(args, 'date');
    appendValueArg(args, 'commit');
    appendValueArg(args, 'out-root');
    appendFlag(args, 'force');
    appendFlag(args, 'skip-existing');

    execFileSync(process.execPath, args, { cwd: REPO_ROOT, stdio: 'inherit' });
  }
}

main();
