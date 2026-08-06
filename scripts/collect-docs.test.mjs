import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assertNoUnpinnedRepoLinks,
  buildVersionChangelog,
  extractReleaseNotes,
  pinRepoLinks,
  previousArchiveVersion,
  releaseTagFor,
} from './collect-docs.mjs';

test('releaseTagFor derives the release tag from an archive version', () => {
  assert.equal(releaseTagFor('19.1.5'), 'v1.5');
  assert.equal(releaseTagFor('20.1.5'), 'v1.5');
  assert.equal(releaseTagFor('21.0.10'), 'v0.10');
  assert.equal(releaseTagFor('19.0.4'), 'v0.4');
});

test('releaseTagFor rejects a version that is not <major>.<suffix>', () => {
  assert.throws(() => releaseTagFor('1.5'), /release tag/i);
  assert.throws(() => releaseTagFor('nope'), /release tag/i);
});

test('pinRepoLinks rewrites blob/main deep links to the release tag', () => {
  const source = 'See [guide](https://github.com/sdcorejs/sdcorejs-angular/blob/main/CHANGELOG.md).';

  assert.equal(
    pinRepoLinks(source, 'v1.5'),
    'See [guide](https://github.com/sdcorejs/sdcorejs-angular/blob/main/CHANGELOG.md).'.replace(
      'blob/main/',
      'blob/v1.5/',
    ),
  );
});

test('pinRepoLinks rewrites every occurrence in a document', () => {
  const source = [
    '[a](https://github.com/sdcorejs/sdcorejs-angular/blob/main/LICENSE)',
    '[b](https://github.com/sdcorejs/sdcorejs-angular/blob/main/CHANGELOG.md)',
  ].join('\n');

  const pinned = pinRepoLinks(source, 'v1.4');

  assert.ok(!pinned.includes('blob/main/'));
  assert.ok(pinned.includes('blob/v1.4/LICENSE'));
  assert.ok(pinned.includes('blob/v1.4/CHANGELOG.md'));
});

test('pinRepoLinks leaves non-blob repo URLs untouched', () => {
  const source = [
    '[issues](https://github.com/sdcorejs/sdcorejs-angular/issues)',
    '[source](https://github.com/sdcorejs/sdcorejs-angular)',
    '[pages](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)',
  ].join('\n');

  assert.equal(pinRepoLinks(source, 'v1.5'), source);
});

test('pinRepoLinks leaves another repository blob/main alone', () => {
  const source = '[other](https://github.com/sdcorejs/sdcorejs-utils/blob/main/README.md)';

  assert.equal(pinRepoLinks(source, 'v1.5'), source);
});

test('pinRepoLinks is idempotent on already pinned content', () => {
  const pinnedOnce = pinRepoLinks('[a](https://github.com/sdcorejs/sdcorejs-angular/blob/main/LICENSE)', 'v1.5');

  assert.equal(pinRepoLinks(pinnedOnce, 'v1.5'), pinnedOnce);
});

test('pinRepoLinks preserves a BOM and CRLF line endings', () => {
  const source = '﻿[a](https://github.com/sdcorejs/sdcorejs-angular/blob/main/LICENSE)\r\nnext line\r\n';

  const pinned = pinRepoLinks(source, 'v1.5');

  assert.ok(pinned.startsWith('﻿'));
  assert.ok(pinned.includes('\r\n'));
  assert.ok(pinned.includes('blob/v1.5/LICENSE'));
});

test('assertNoUnpinnedRepoLinks passes when every link is pinned', () => {
  assert.doesNotThrow(() =>
    assertNoUnpinnedRepoLinks([
      { path: 'README.md', content: '[a](https://github.com/sdcorejs/sdcorejs-angular/blob/v1.5/LICENSE)' },
    ]),
  );
});

test('assertNoUnpinnedRepoLinks fails closed and names every offending doc', () => {
  assert.throws(
    () =>
      assertNoUnpinnedRepoLinks([
        { path: 'README.md', content: '[a](https://github.com/sdcorejs/sdcorejs-angular/blob/main/LICENSE)' },
        { path: 'components/table/sd-table.md', content: 'ok' },
        { path: 'assets/STYLE-GUIDE.md', content: 'x blob/main/ y'.replace('blob/main/', 'https://github.com/sdcorejs/sdcorejs-angular/blob/main/x') },
      ]),
    error => {
      assert.match(error.message, /README\.md/);
      assert.match(error.message, /assets\/STYLE-GUIDE\.md/);
      assert.ok(!error.message.includes('sd-table.md'));
      return true;
    },
  );
});

const CHANGELOG_FIXTURE = [
  '# Changelog',
  '',
  'Intro prose that belongs to no release.',
  '',
  '## [Unreleased]',
  '',
  '- pending work',
  '',
  '## [1.4] - 2026-07-23',
  '',
  '### Added',
  '',
  '- table export',
  '',
  '## [1.3] - 2026-07-18',
  '',
  '- older release',
  '',
].join('\n');

test('extractReleaseNotes returns one release section without its heading', () => {
  const notes = extractReleaseNotes(CHANGELOG_FIXTURE, '1.4');

  assert.equal(notes.date, '2026-07-23');
  assert.match(notes.body, /### Added/);
  assert.match(notes.body, /- table export/);
  assert.ok(!notes.body.includes('older release'));
  assert.ok(!notes.body.includes('pending work'));
  assert.ok(!notes.body.includes('## [1.4]'));
});

test('extractReleaseNotes reads the oldest section up to the end of file', () => {
  const notes = extractReleaseNotes(CHANGELOG_FIXTURE, '1.3');

  assert.match(notes.body, /- older release/);
});

test('extractReleaseNotes returns null for a suffix with no section', () => {
  assert.equal(extractReleaseNotes(CHANGELOG_FIXTURE, '1.5'), null);
  assert.equal(extractReleaseNotes(CHANGELOG_FIXTURE, '0.11'), null);
});

test('extractReleaseNotes does not match a different suffix by prefix', () => {
  assert.equal(extractReleaseNotes(CHANGELOG_FIXTURE, '1'), null);
});

test('previousArchiveVersion picks the closest lower version on the same major', () => {
  const known = ['19.1.4', '19.1.3', '19.0.11', '20.1.4', '21.1.4'];

  assert.equal(previousArchiveVersion('19.1.4', known), '19.1.3');
  assert.equal(previousArchiveVersion('19.1.3', known), '19.0.11');
  assert.equal(previousArchiveVersion('20.1.4', known), null);
});

test('previousArchiveVersion ignores the version being published', () => {
  assert.equal(previousArchiveVersion('19.1.4', ['19.1.4']), null);
});

test('buildVersionChangelog embeds the release notes and a tag diff link', () => {
  const md = buildVersionChangelog({
    version: '19.1.4',
    released: '2026-07-23',
    notes: extractReleaseNotes(CHANGELOG_FIXTURE, '1.4'),
    previousVersion: '19.1.3',
  });

  assert.match(md, /# @sdcorejs\/angular 19\.1\.4/);
  assert.match(md, /- table export/);
  assert.match(md, /compare\/v1\.3\.\.\.v1\.4/);
  assert.match(md, /19\.1\.3/);
  assert.ok(!md.includes('blob/main/'));
});

test('buildVersionChangelog stays valid for the first release of a line', () => {
  const md = buildVersionChangelog({
    version: '19.0.4',
    released: '2026-06-09',
    notes: extractReleaseNotes(CHANGELOG_FIXTURE, '1.4'),
    previousVersion: null,
  });

  assert.match(md, /# @sdcorejs\/angular 19\.0\.4/);
  assert.ok(!md.includes('compare/'));
});

test('buildVersionChangelog states the gap when the changelog has no section', () => {
  const md = buildVersionChangelog({
    version: '19.1.5',
    released: '2026-07-28',
    notes: null,
    previousVersion: '19.1.4',
  });

  assert.match(md, /# @sdcorejs\/angular 19\.1\.5/);
  assert.match(md, /no recorded changelog section/i);
  assert.match(md, /compare\/v1\.4\.\.\.v1\.5/);
});
