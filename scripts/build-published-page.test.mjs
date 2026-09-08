import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { test } from 'node:test';

import {
  RETENTION_PER_LEADING_DIGIT,
  buildPagesIndex,
  parseSuffix,
  selectSuffixesToPrune,
  sortSuffixesDesc,
} from './build-published-page.mjs';

test('Showcase loads library styles from its installed package beside its Angular dependencies', () => {
  const workspace = JSON.parse(readFileSync(new URL('../showcase/angular.json', import.meta.url), 'utf8'));
  const libraryStyles = workspace.projects.showcase.architect.build.options.styles
    .filter(style => typeof style === 'string' && style.endsWith('/sd-core.scss'));
  assert.equal(libraryStyles.length, 1);
  const packageRoot = resolve('showcase/node_modules/@sdcorejs/angular');
  const fromPackage = relative(packageRoot, resolve('showcase', libraryStyles[0]));
  assert.ok(!isAbsolute(fromPackage) && !fromPackage.startsWith('..'),
    'library SCSS must resolve peers from Showcase, without versions/v19/node_modules');
});

test('parseSuffix accepts a release suffix and rejects anything else', () => {
  assert.deepEqual(parseSuffix('1.6'), { major: 1, minor: 6 });
  assert.deepEqual(parseSuffix('0.11'), { major: 0, minor: 11 });

  assert.throws(() => parseSuffix('19.1.6'), /Invalid release suffix/);
  assert.throws(() => parseSuffix('v1.6'), /Invalid release suffix/);
  assert.throws(() => parseSuffix('1'), /Invalid release suffix/);
  assert.throws(() => parseSuffix('latest'), /Invalid release suffix/);
});

test('sortSuffixesDesc orders numerically, not lexicographically', () => {
  assert.deepEqual(sortSuffixesDesc(['0.9', '0.11', '0.10', '1.2']), ['1.2', '0.11', '0.10', '0.9']);
});

test('selectSuffixesToPrune keeps the newest N per leading digit', () => {
  const suffixes = ['1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '1.0', '0.11', '0.10', '0.9'];

  const prune = selectSuffixesToPrune(suffixes, 5);

  assert.deepEqual(prune, ['1.1', '1.0']);
});

test('selectSuffixesToPrune prunes each leading digit independently', () => {
  const suffixes = ['1.1', '1.0', '0.11', '0.10', '0.9', '0.8', '0.7', '0.6', '0.5'];

  const prune = selectSuffixesToPrune(suffixes, 5);

  // The `1` group is under the cap and must survive even though `0` has many releases.
  assert.ok(!prune.includes('1.1'));
  assert.ok(!prune.includes('1.0'));
  assert.deepEqual(prune, ['0.6', '0.5']);
});

test('selectSuffixesToPrune returns nothing while every group is under the cap', () => {
  assert.deepEqual(selectSuffixesToPrune(['1.6', '1.5', '0.11'], 5), []);
  assert.deepEqual(selectSuffixesToPrune([], 5), []);
});

test('selectSuffixesToPrune defaults to the documented retention', () => {
  assert.equal(RETENTION_PER_LEADING_DIGIT, 5);

  const suffixes = ['1.6', '1.5', '1.4', '1.3', '1.2', '1.1'];

  assert.deepEqual(selectSuffixesToPrune(suffixes), ['1.1']);
});

test('buildPagesIndex reports the newest suffix and the retained set', () => {
  const index = buildPagesIndex(['1.4', '1.6', '0.11', '1.5']);

  assert.equal(index.latest, '1.6');
  assert.deepEqual(index.suffixes, ['1.6', '1.5', '1.4', '0.11']);
  assert.equal(index.retentionPerLeadingDigit, 5);
  assert.equal(index.repository, 'sdcorejs-angular');
});

test('buildPagesIndex stays valid with no published pages yet', () => {
  const index = buildPagesIndex([]);

  assert.equal(index.latest, null);
  assert.deepEqual(index.suffixes, []);
});

test('publishing 2.5 prunes exactly 2.0, retains 2.1-2.5 and leaves the 1.x group untouched', () => {
  const historical1x = ['1.6', '1.5', '1.4', '1.3', '1.2'];
  const beforeRelease = [...historical1x, '2.4', '2.3', '2.2', '2.1', '2.0'];
  const afterCopy = [...beforeRelease, '2.5'];

  const prune = selectSuffixesToPrune(afterCopy);
  const retained = afterCopy.filter(suffix => !prune.includes(suffix));
  const index = buildPagesIndex(retained);

  assert.deepEqual(prune, ['2.0']);
  assert.deepEqual(
    index.suffixes.filter(suffix => suffix.startsWith('2.')),
    ['2.5', '2.4', '2.3', '2.2', '2.1'],
  );
  assert.deepEqual(
    index.suffixes.filter(suffix => suffix.startsWith('1.')),
    historical1x,
  );
  assert.equal(index.latest, '2.5');
});
