import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { buildNgTestInvocation } from './run-ng-test-no-cache.mjs';

test('runs the workspace-local Angular test builder with persistent disk cache disabled', () => {
  const cwd = path.resolve('fixture-workspace');
  const sourceEnv = { CI: 'false', KEEP_ME: 'yes' };
  const invocation = buildNgTestInvocation({
    cwd,
    args: ['showcase', '--watch=false', '--include=src/example.spec.ts'],
    env: sourceEnv,
    nodeExecutable: 'node-for-test',
  });

  assert.equal(invocation.command, 'node-for-test');
  assert.deepEqual(invocation.args, [
    path.join(cwd, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'),
    'test',
    'showcase',
    '--watch=false',
    '--include=src/example.spec.ts',
  ]);
  assert.equal(invocation.cwd, cwd);
  assert.equal(invocation.env.CI, 'true');
  assert.equal(invocation.env.KEEP_ME, 'yes');
  assert.equal(sourceEnv.CI, 'false', 'the caller environment must not be mutated');
});
