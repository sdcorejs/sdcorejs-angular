import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/publish-npm.yml', import.meta.url), 'utf8');
const deployPagesWorkflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8');

function jobEntries(source) {
  const jobsIndex = source.search(/^jobs:\s*$/mu);
  assert.notEqual(jobsIndex, -1, 'workflow must declare jobs');
  const jobsSource = source.slice(jobsIndex);
  const headings = [...jobsSource.matchAll(/^  ([a-zA-Z0-9_-]+):\s*$/gmu)];
  return headings.map((heading, index) => ({
    id: heading[1],
    source: jobsSource.slice(heading.index, headings[index + 1]?.index ?? jobsSource.length),
  }));
}

function executableCommands(source) {
  const lines = source.split(/\r?\n/u);
  const commands = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)run:\s*(.*)$/u.exec(lines[index]);
    if (!match) continue;

    const indentation = match[1].length;
    const inline = match[2].trim();
    if (inline && !/^[|>][-+]?$/u.test(inline)) {
      if (!inline.startsWith('#')) commands.push(inline);
      continue;
    }

    for (index += 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.trim()) continue;
      const lineIndentation = /^\s*/u.exec(line)?.[0].length ?? 0;
      if (lineIndentation <= indentation) {
        index -= 1;
        break;
      }
      if (!line.trimStart().startsWith('#')) commands.push(line.trim());
    }
  }

  return commands.join('\n');
}

function sourceWithoutComments(source) {
  return source
    .split(/\r?\n/u)
    .filter(line => !line.trimStart().startsWith('#'))
    .join('\n');
}

function inlineRunCommands(source) {
  return source
    .split(/\r?\n/u)
    .map(line => /^\s*run:\s*(?![|>][-+]?\s*$)(.+)$/u.exec(line)?.[1].trim())
    .filter(Boolean);
}

function stepEntries(job) {
  const headings = [...job.source.matchAll(/^      - name:\s*[^\r\n]+$/gmu)];
  return headings.map((heading, index) => job.source.slice(heading.index, headings[index + 1]?.index ?? job.source.length));
}

function oneStepWithInlineRun(job, command) {
  const matches = stepEntries(job).filter(step => inlineRunCommands(step).includes(command));
  assert.equal(matches.length, 1, `${job.id} must have exactly one step running ${command}`);
  return matches[0];
}

function oneJobMatching(pattern, label) {
  const matches = jobEntries(workflow).filter(job => pattern.test(executableCommands(job.source)));
  assert.equal(matches.length, 1, `expected exactly one ${label} job, got ${matches.map(job => job.id).join(', ')}`);
  return matches[0];
}

function permissionMap(job) {
  const lines = job.source.split(/\r?\n/u);
  const permissionIndex = lines.findIndex(line => /^    permissions:\s*$/u.test(line));
  if (permissionIndex < 0) return null;
  const permissions = {};
  for (const line of lines.slice(permissionIndex + 1)) {
    const match = /^      ([a-z-]+):\s*(read|write|none)\s*$/u.exec(line);
    if (!match) break;
    permissions[match[1]] = match[2];
  }
  return permissions;
}

function has(source, pattern, message = `expected source to match ${pattern}`) {
  assert.ok(pattern.test(source), message);
}

function lacks(source, pattern, message = `expected source not to match ${pattern}`) {
  assert.ok(!pattern.test(source), message);
}

test('release workflow delegates the validated four-target plan to one sequential publisher', () => {
  const executableWorkflow = sourceWithoutComments(workflow);
  for (const workspace of ['v19', 'v20', 'v21', 'v22']) {
    has(executableWorkflow, new RegExp(`(?:version|workspace):\\s*['\"]?${workspace}['\"]?`, 'u'));
  }

  const publisher = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--publish\b/u, 'publisher');
  lacks(publisher.source, /^    strategy:\s*$/mu, 'publication must be one sequential, non-matrix job');

  const commands = executableCommands(publisher.source);
  const publishInvocations = inlineRunCommands(publisher.source)
    .filter(command => /release-package-contract\.mjs[^\r\n]*--publish\b/u.test(command));
  assert.equal(publishInvocations.length, 1, 'publisher must use one direct, testable publish-transaction CLI invocation');
  has(publishInvocations[0], /^node\s+scripts\/release-package-contract\.mjs\b/u);
  has(publishInvocations[0], /--artifact-root\s+\S+/u, 'publisher must revalidate the retained bundle');
  has(publishInvocations[0], /--suffix\s+["']?2\.5["']?/u);
  has(publishInvocations[0], /--baseline-suffix\s+["']?2\.4["']?/u);
  has(publishInvocations[0], /--datetime-version\s+["']?1\.0\.4["']?/u);
  has(publishInvocations[0], /--require-provenance\b/u);
  lacks(commands, /^npm publish\b/mu, 'workflow shell must not bypass the unit-tested publish transaction');
  lacks(commands, /npm dist-tag (?:add|set|rm)/u, 'release must not mutate dist-tags separately');
});

test('every release entry path requires the immutable v2.5 tag to point at main', () => {
  const verifySource = jobEntries(workflow).find(job => job.id === 'verify_source');
  assert.ok(verifySource, 'verify_source job must exist');

  has(workflow, /^\s{2}workflow_dispatch:\s*$/mu, 'manual recovery dispatch must remain available');
  has(
    verifySource.source,
    /ref:\s*\$\{\{\s*github\.event_name == 'workflow_dispatch' && 'refs\/tags\/v2\.5' \|\| github\.ref\s*\}\}/u,
    'manual dispatch must check out the immutable release tag',
  );

  const mainGuard = stepEntries(verifySource).find(step => /git fetch origin main --no-tags/u.test(step));
  assert.ok(mainGuard, 'verify_source must compare the checked-out release SHA with origin/main');
  lacks(mainGuard, /^\s*if:\s*/mu, 'the main-lineage guard must run for push and workflow_dispatch');
  has(mainGuard, /git merge-base --is-ancestor HEAD origin\/main/u);
});

test('matrix target selection persists both values through GitHub step outputs', () => {
  const packer = oneJobMatching(/\bnpm pack\b/u, 'build/pack');
  const targetStep = stepEntries(packer).find(step => /^\s*id:\s*target\s*$/mu.test(step));
  assert.ok(targetStep, 'build/pack must declare the target output step');

  has(targetStep, /GITHUB_OUTPUT/u, 'target selection must write to the GitHub step-output file');
  has(targetStep, /version=/u);
  has(targetStep, /target_json=/u);
  lacks(
    targetStep,
    /process\.stdout\.write\(['"]version=/u,
    'printing target metadata to stdout does not create GitHub step outputs',
  );
});

test('all four packages are built and verified as immutable artifacts before publication', () => {
  const packer = oneJobMatching(/\bnpm pack\b/u, 'build/pack');
  const verifier = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--compile-consumers/u, 'package verifier');
  const publisher = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--publish\b/u, 'publisher');

  const packerCommands = executableCommands(packer.source);
  const verifierCommands = executableCommands(verifier.source);
  const publisherCommands = executableCommands(publisher.source);

  has(packer.source, /actions\/upload-artifact@/u);
  has(packerCommands, /npm pack[^\r\n]*--json/u);
  has(packerCommands, /(?:sha256sum|Get-FileHash[^\r\n]*SHA256)/iu);
  has(packerCommands, /(?:git rev-parse HEAD|GITHUB_SHA)/u);
  has(packerCommands, /(?:integrity|pack.*\.json)/iu);
  has(packerCommands, /shasum/iu);

  has(verifier.source, /actions\/download-artifact@/u);
  has(verifierCommands, /--baseline-suffix\s+["']?2\.4["']?/u);
  has(verifierCommands, /--datetime-version\s+["']?1\.0\.4["']?/u);
  has(verifierCommands, /(?:19|v19)[^\r\n]*(?:20|v20)[^\r\n]*(?:21|v21)[^\r\n]*(?:22|v22)/u);
  has(verifierCommands, /(?:sha256|integrity|shasum)/iu);

  has(publisher.source, /actions\/download-artifact@/u);
  has(publisher.source, new RegExp(`needs:\\s*(?:\\[[^\\]]*\\b${verifier.id}\\b[^\\]]*\\]|${verifier.id}\\b)`, 'u'));
  lacks(publisherCommands, /(?:\bng build\b|npm run build|\bnpm pack\b)/u, 'publisher must consume retained tarballs without rebuilding');
  lacks(publisherCommands, /npm (?:ci|install)(?!\s+-g\s+npm@11\.5\.1)/u, 'publisher must not reinstall package workspaces');

  assert.ok(workflow.indexOf(`  ${packer.id}:`) < workflow.indexOf(`  ${verifier.id}:`));
  assert.ok(workflow.indexOf(`  ${verifier.id}:`) < workflow.indexOf(`  ${publisher.id}:`));
});

test('artifact jobs use exact installs and the publisher preflights every registry collision', () => {
  const packer = oneJobMatching(/\bnpm pack\b/u, 'build/pack');
  const publisher = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--publish\b/u, 'publisher');

  const packerCommands = executableCommands(packer.source);
  const publisherCommands = executableCommands(publisher.source);

  const legacyInstall = oneStepWithInlineRun(packer, 'npm ci --legacy-peer-deps');
  const cleanInstall = oneStepWithInlineRun(packer, 'npm ci');
  has(sourceWithoutComments(legacyInstall), /^        if:\s*.*matrix\.(?:version|workspace).*!=\s*['"]v22['"].*$/mu);
  has(sourceWithoutComments(cleanInstall), /^        if:\s*.*matrix\.(?:version|workspace).*==\s*['"]v22['"].*$/mu);
  lacks(packerCommands, /npm install --legacy-peer-deps/u);
  has(publisherCommands, /release-package-contract\.mjs[^\r\n]*--publish\b/u);
  has(publisherCommands, /--require-provenance\b/u);
});

test('trusted publishing is OIDC-only, least-privilege and pinned to Node/npm', () => {
  lacks(workflow, /NODE_AUTH_TOKEN/u);
  lacks(workflow, /npm@latest/u);
  lacks(workflow, /runs-on:\s*(?:\[[^\]]*self-hosted|self-hosted)/iu);

  const topLevel = workflow.slice(0, workflow.search(/^jobs:\s*$/mu));
  assert.ok(!/^permissions:/mu.test(topLevel) || /^permissions:\s*\{\s*\}\s*$/mu.test(topLevel), 'top-level permissions must be omitted or empty');

  const publisher = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--publish\b/u, 'publisher');
  const postpublish = oneJobMatching(/npm run build:page\s+--\s+--suffix/u, 'postpublish docs/page');
  for (const job of jobEntries(workflow)) {
    has(job.source, /runs-on:\s*(?:ubuntu|windows|macos)-latest/u, `${job.id} must use a GitHub-hosted runner`);
    const permissions = permissionMap(job);
    assert.ok(permissions, `${job.id} must declare explicit job permissions`);

    if (job.id === publisher.id) {
      assert.deepEqual(permissions, { contents: 'read', 'id-token': 'write' });
    } else if (job.id === postpublish.id) {
      assert.deepEqual(permissions, { contents: 'write' });
    } else {
      assert.deepEqual(permissions, { contents: 'read' });
    }
  }

  for (const job of jobEntries(workflow).filter(job => /(?:\bnpm pack\b|release-package-contract\.mjs)/u.test(executableCommands(job.source)))) {
    has(job.source, /node-version:\s*['"]?22\.22\.3['"]?/u, `${job.id} must pin Node 22.22.3`);
    has(job.source, /registry-url:\s*['"]?https:\/\/registry\.npmjs\.org['"]?/u, `${job.id} must configure npm registry for OIDC`);
    has(executableCommands(job.source), /npm install -g npm@11\.5\.1/u, `${job.id} must pin npm 11.5.1`);
  }
});

test('postpublish materializes verified v19, clean-installs Showcase and commits docs plus page retention', () => {
  const publisher = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--publish\b/u, 'publisher');
  const postpublish = oneJobMatching(/npm run build:page\s+--\s+--suffix/u, 'postpublish docs/page');

  const postpublishCommands = executableCommands(postpublish.source);

  has(postpublish.source, new RegExp(`needs:\\s*(?:\\[[^\\]]*\\b${publisher.id}\\b[^\\]]*\\]|${publisher.id}\\b)`, 'u'));
  has(postpublish.source, /actions\/download-artifact@/u);
  has(postpublishCommands, /versions\/v19\/dist\/sdcorejs-angular/u);
  has(postpublishCommands, /(?:sha256|integrity)/iu);
  has(postpublishCommands, /npm --prefix showcase ci --legacy-peer-deps/u);
  has(postpublishCommands, /npm run collect-release-docs/u);
  has(postpublishCommands, /npm run build:page -- --suffix ["']?2\.5["']?/u);
  has(postpublishCommands, /published-pages\/2\.5/u);
  has(postpublishCommands, /published-pages\/2\.0/u);
  has(postpublishCommands, /git add[^\r\n]*published-docs[^\r\n]*published-pages/u);

  const installIndex = postpublishCommands.indexOf('npm --prefix showcase ci --legacy-peer-deps');
  const buildIndex = postpublishCommands.indexOf('npm run build:page -- --suffix');
  assert.ok(installIndex >= 0 && installIndex < buildIndex, 'Showcase must be clean-installed before page generation');

  has(postpublishCommands, /git fetch origin main --no-tags/u);
  has(postpublishCommands, /git merge-base --is-ancestor ["']?\$SOURCE_SHA["']? origin\/main/u);
  has(postpublishCommands, /git rebase --onto origin\/main ["']?\$SOURCE_SHA["']? HEAD/u);
  has(
    postpublishCommands,
    /test "\$\(git rev-parse HEAD\^\)" = "\$SOURCE_SHA"/u,
    'postpublish must prove that the generated docs commit is the only commit above the release source',
  );
  lacks(postpublishCommands, /git rebase origin\/main/u);
  const commitIndex = postpublishCommands.indexOf('git commit -m');
  const parentGuardIndex = postpublishCommands.indexOf('test "$(git rev-parse HEAD^)" = "$SOURCE_SHA"');
  const fetchIndex = postpublishCommands.indexOf('git fetch origin main --no-tags');
  const ancestryIndex = postpublishCommands.indexOf('git merge-base --is-ancestor');
  const rebaseIndex = postpublishCommands.indexOf('git rebase --onto origin/main');
  const pushIndex = postpublishCommands.indexOf('git push origin HEAD:main');
  assert.ok(
    commitIndex >= 0 && commitIndex < parentGuardIndex && parentGuardIndex < fetchIndex && fetchIndex < ancestryIndex &&
      ancestryIndex < rebaseIndex && rebaseIndex < pushIndex,
    'postpublish must recheck source ancestry and replay only its docs commit onto current main before pushing',
  );

  const deployBuildOrInstallCommand = /(?:^|(?:&&|\|\||;)\s*|\b(?:if|then|while|until|do)\s+)(?:[A-Za-z_][A-Za-z0-9_]*=\S+\s+)*(?:(?:node\b[^\r\n;&|]*\b|npx\s+)?ng\s+build\b|npm(?:\s+--prefix\s+\S+)?\s+(?:run\s+build(?::[^\s;&|]+)?|ci|install)\b)/mu;
  lacks(
    executableCommands(deployPagesWorkflow),
    deployBuildOrInstallCommand,
    'deploy-pages must remain a build-free copier',
  );
});

test('publisher revalidates exact versions, recovery tags, latest and provenance through the tested transaction', () => {
  const publisher = oneJobMatching(/release-package-contract\.mjs[^\r\n]*--publish\b/u, 'publisher');
  const publisherCommands = executableCommands(publisher.source);
  has(publisherCommands, /--suffix\s+["']?2\.5["']?/u);
  has(publisherCommands, /--baseline-suffix\s+["']?2\.4["']?/u);
  has(publisherCommands, /--datetime-version\s+["']?1\.0\.4["']?/u);
  has(publisherCommands, /--require-provenance\b/u);
});
