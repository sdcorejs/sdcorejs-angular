#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function buildNgTestInvocation({ cwd, args, env = process.env, nodeExecutable = process.execPath }) {
  const workspaceRoot = path.resolve(cwd);
  return {
    command: nodeExecutable,
    args: [path.join(workspaceRoot, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'), 'test', ...args],
    cwd: workspaceRoot,
    env: { ...env, CI: 'true' },
  };
}

function runNgTest() {
  const invocation = buildNgTestInvocation({ cwd: process.cwd(), args: process.argv.slice(2) });
  if (!existsSync(invocation.args[0])) {
    console.error(`[test:no-cache] Angular CLI not found: ${invocation.args[0]}`);
    return 1;
  }

  const result = spawnSync(invocation.command, invocation.args, {
    cwd: invocation.cwd,
    env: invocation.env,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) {
    console.error(`[test:no-cache] ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exitCode = runNgTest();
