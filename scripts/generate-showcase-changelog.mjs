#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..');

const DEFAULT_INPUT_PATH = join(REPO_ROOT, 'CHANGELOG.md');
const DEFAULT_OUTPUT_PATH = join(
  REPO_ROOT,
  'showcase',
  'src',
  'app',
  'docs',
  'generated',
  'changelog.generated.ts',
);
const DEFAULT_START_SUFFIX = '1.2';
const DEFAULT_ANGULAR_MAJORS = [19, 20, 21, 22];
// A framework line must not be projected onto releases that predate its first package.
const ANGULAR_MAJOR_INCEPTION_SUFFIXES = new Map([[22, '2.5']]);

const RELEASE_HEADING = /^##\s+\[([^\]]+)](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/;
const SECTION_HEADING = /^(#{3,6})\s+(.+?)\s*$/;
const LIST_ITEM = /^(\s*)([-+*]|\d+\.)\s+(.+)$/;
const KNOWN_SECTION_KEYS = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
  'migration',
  'breaking',
];

function trimBlankLines(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') start += 1;
  while (end > start && lines[end - 1].trim() === '') end -= 1;

  return lines.slice(start, end);
}

function toMarkdown(lines) {
  return trimBlankLines(lines).join('\n');
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function uniqueAnchor(base, usedAnchors) {
  let candidate = base;
  let suffix = 2;

  while (usedAnchors.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedAnchors.add(candidate);
  return candidate;
}

function sectionKey(title) {
  const slug = slugify(title);
  const known = KNOWN_SECTION_KEYS.find(key => slug === key || slug.startsWith(`${key}-`));
  return known ?? slug;
}

function parseReleaseSuffix(value) {
  const match = value.match(/^(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) {
    throw new Error(
      `Invalid release suffix "${value}". Expected two numeric parts with an optional prerelease, for example 1.2 or 1.3-beta.1.`,
    );
  }

  return {
    core: [Number(match[1]), Number(match[2])],
    prerelease: match[3]?.split('.') ?? [],
  };
}

function comparePrereleaseIdentifiers(left, right) {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);

  if (leftNumeric && rightNumeric) return Number(left) - Number(right);
  if (leftNumeric) return -1;
  if (rightNumeric) return 1;
  return left.localeCompare(right);
}

/** Compares two repository release suffixes using SemVer prerelease ordering. */
export function compareReleaseSuffix(left, right) {
  const parsedLeft = parseReleaseSuffix(left);
  const parsedRight = parseReleaseSuffix(right);

  for (let index = 0; index < parsedLeft.core.length; index += 1) {
    const difference = parsedLeft.core[index] - parsedRight.core[index];
    if (difference !== 0) return difference;
  }

  if (parsedLeft.prerelease.length === 0 && parsedRight.prerelease.length > 0) return 1;
  if (parsedLeft.prerelease.length > 0 && parsedRight.prerelease.length === 0) return -1;

  const length = Math.max(parsedLeft.prerelease.length, parsedRight.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = parsedLeft.prerelease[index];
    const rightIdentifier = parsedRight.prerelease[index];
    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;

    const difference = comparePrereleaseIdentifiers(leftIdentifier, rightIdentifier);
    if (difference !== 0) return difference;
  }

  return 0;
}

/** Extracts a nested list tree while preserving Markdown text in each item. */
export function parseMarkdownListItems(lines) {
  const roots = [];
  const stack = [];

  for (const line of lines) {
    const match = line.match(LIST_ITEM);
    if (!match) continue;

    const indent = match[1].replace(/\t/g, '    ').length;
    const marker = match[2];
    const item = {
      text: match[3].trim(),
      ordered: /^\d/.test(marker),
      children: [],
    };

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    if (stack.length > 0) stack[stack.length - 1].item.children.push(item);
    else roots.push(item);

    stack.push({ indent, item });
  }

  return roots;
}

function parseSectionTree(lines, releaseAnchor) {
  const roots = [];
  const stack = [];
  const summaryLines = [];
  const usedAnchors = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(SECTION_HEADING);
    if (!heading) {
      if (stack.length > 0) stack[stack.length - 1].bodyLines.push(lines[index]);
      else summaryLines.push(lines[index]);
      continue;
    }

    const level = heading[1].length;
    const title = heading[2].replace(/\s+#+\s*$/, '').trim();

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop().endIndex = index;
    }

    const parent = stack[stack.length - 1];
    const anchorBase = parent
      ? `${parent.anchor}-${slugify(title)}`
      : `${releaseAnchor}-${slugify(title)}`;
    const node = {
      key: sectionKey(title),
      title,
      level,
      anchor: uniqueAnchor(anchorBase, usedAnchors),
      startIndex: index + 1,
      endIndex: lines.length,
      bodyLines: [],
      children: [],
    };

    if (parent) parent.children.push(node);
    else roots.push(node);
    stack.push(node);
  }

  while (stack.length > 0) stack.pop().endIndex = lines.length;

  function finalize(node) {
    return {
      key: node.key,
      title: node.title,
      level: node.level,
      anchor: node.anchor,
      markdown: toMarkdown(lines.slice(node.startIndex, node.endIndex)),
      items: parseMarkdownListItems(node.bodyLines),
      children: node.children.map(finalize),
    };
  }

  return {
    summaryMarkdown: toMarkdown(summaryLines),
    sections: roots.map(finalize),
  };
}

function parseRelease(lines, heading, options) {
  const isUnreleased = heading.label.toLowerCase() === 'unreleased';
  const suffix = isUnreleased ? null : heading.label;
  const anchor = isUnreleased ? 'unreleased' : `release-${slugify(suffix)}`;
  const parsedSections = parseSectionTree(lines, anchor);
  const releaseAngularMajors = isUnreleased
    ? []
    : options.angularMajors.filter(angularMajor => {
        const inceptionSuffix = ANGULAR_MAJOR_INCEPTION_SUFFIXES.get(angularMajor);
        return inceptionSuffix === undefined || compareReleaseSuffix(suffix, inceptionSuffix) >= 0;
      });

  return {
    id: anchor,
    title: isUnreleased ? 'Unreleased' : `Release ${suffix}`,
    suffix,
    date: heading.date ?? null,
    anchor,
    unreleased: isUnreleased,
    packageVersions: isUnreleased
      ? []
      : releaseAngularMajors.map(angularMajor => ({
          angularMajor,
          version: `${angularMajor}.${suffix}`,
        })),
    summaryMarkdown: parsedSections.summaryMarkdown,
    markdown: toMarkdown(lines),
    sections: parsedSections.sections,
  };
}

/**
 * Parses Keep-a-Changelog release blocks and keeps Unreleased plus releases at
 * or after the configured suffix boundary.
 */
export function parseChangelog(markdown, options = {}) {
  const startSuffix = options.startSuffix ?? DEFAULT_START_SUFFIX;
  const angularMajors = options.angularMajors ?? DEFAULT_ANGULAR_MAJORS;
  const source = options.source ?? 'CHANGELOG.md';
  parseReleaseSuffix(startSuffix);

  if (!Array.isArray(angularMajors) || angularMajors.some(major => !Number.isInteger(major))) {
    throw new Error('angularMajors must be an array of integer Angular major versions.');
  }

  const lines = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const headings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(RELEASE_HEADING);
    if (!match) continue;

    headings.push({
      label: match[1].trim(),
      date: match[2] || null,
      headingIndex: index,
      bodyStart: index + 1,
      bodyEnd: lines.length,
    });
  }

  for (let index = 0; index < headings.length - 1; index += 1) {
    headings[index].bodyEnd = headings[index + 1].headingIndex;
  }

  const releases = [];
  for (const heading of headings) {
    const isUnreleased = heading.label.toLowerCase() === 'unreleased';
    if (!isUnreleased && compareReleaseSuffix(heading.label, startSuffix) < 0) continue;

    releases.push(
      parseRelease(lines.slice(heading.bodyStart, heading.bodyEnd), heading, {
        angularMajors,
      }),
    );
  }

  return {
    source,
    startSuffix,
    angularMajors: [...angularMajors],
    releases,
  };
}

function quoteTypeScriptString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Renders parsed changelog data as a self-contained, strongly typed module. */
export function renderGeneratedModule(changelog) {
  const angularMajorUnion = changelog.angularMajors.join(' | ') || 'never';
  const angularMajorArray = `[${changelog.angularMajors.join(', ')}]`;
  const releases = JSON.stringify(changelog.releases, null, 2);

  return `// AUTO-GENERATED by scripts/generate-showcase-changelog.mjs from ${changelog.source}.
// Do not edit this file directly. Update CHANGELOG.md and run npm run generate:showcase-changelog.

export type ShowcaseChangelogAngularMajor = ${angularMajorUnion};

export interface ShowcaseChangelogPackageVersion {
  readonly angularMajor: ShowcaseChangelogAngularMajor;
  readonly version: string;
}

export interface ShowcaseChangelogListItem {
  readonly text: string;
  readonly ordered: boolean;
  readonly children: readonly ShowcaseChangelogListItem[];
}

export interface ShowcaseChangelogSection {
  readonly key: string;
  readonly title: string;
  readonly level: number;
  readonly anchor: string;
  readonly markdown: string;
  readonly items: readonly ShowcaseChangelogListItem[];
  readonly children: readonly ShowcaseChangelogSection[];
}

export interface ShowcaseChangelogRelease {
  readonly id: string;
  readonly title: string;
  readonly suffix: string | null;
  readonly date: string | null;
  readonly anchor: string;
  readonly unreleased: boolean;
  readonly packageVersions: readonly ShowcaseChangelogPackageVersion[];
  readonly summaryMarkdown: string;
  readonly markdown: string;
  readonly sections: readonly ShowcaseChangelogSection[];
}

export interface ShowcaseChangelogData {
  readonly source: string;
  readonly startSuffix: string;
  readonly angularMajors: readonly ShowcaseChangelogAngularMajor[];
  readonly releases: readonly ShowcaseChangelogRelease[];
}

export const SHOWCASE_CHANGELOG_SOURCE = ${quoteTypeScriptString(changelog.source)} as const;
export const SHOWCASE_CHANGELOG_START_SUFFIX = ${quoteTypeScriptString(changelog.startSuffix)} as const;
export const SHOWCASE_CHANGELOG_ANGULAR_MAJORS = ${angularMajorArray} as const;

export const SHOWCASE_CHANGELOG_RELEASES = ${releases} as const satisfies readonly ShowcaseChangelogRelease[];

export const SHOWCASE_CHANGELOG = {
  source: SHOWCASE_CHANGELOG_SOURCE,
  startSuffix: SHOWCASE_CHANGELOG_START_SUFFIX,
  angularMajors: SHOWCASE_CHANGELOG_ANGULAR_MAJORS,
  releases: SHOWCASE_CHANGELOG_RELEASES,
} as const satisfies ShowcaseChangelogData;
`;
}

/** Reads CHANGELOG.md and writes the deterministic Angular showcase data module. */
export function generateShowcaseChangelog(options = {}) {
  const inputPath = options.inputPath ?? DEFAULT_INPUT_PATH;
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT_PATH;
  const startSuffix = options.startSuffix ?? DEFAULT_START_SUFFIX;
  const angularMajors = options.angularMajors ?? DEFAULT_ANGULAR_MAJORS;
  const markdown = readFileSync(inputPath, 'utf8');
  const changelog = parseChangelog(markdown, {
    startSuffix,
    angularMajors,
    source: options.source ?? basename(inputPath),
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderGeneratedModule(changelog), 'utf8');

  return changelog;
}

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-showcase-changelog.mjs [options]

Options:
  --input <path>         Changelog Markdown source (default: CHANGELOG.md)
  --output <path>        Generated TypeScript destination
  --start-suffix <x.y>   Oldest included release suffix (default: 1.2)
  --help                 Show this help
`);
}

function runCli() {
  if (process.argv.includes('--help')) {
    printHelp();
    return;
  }

  const inputArg = getArg('input');
  const outputArg = getArg('output');
  const startSuffix = getArg('start-suffix') ?? DEFAULT_START_SUFFIX;
  const inputPath = inputArg ? resolve(process.cwd(), inputArg) : DEFAULT_INPUT_PATH;
  const outputPath = outputArg ? resolve(process.cwd(), outputArg) : DEFAULT_OUTPUT_PATH;
  const changelog = generateShowcaseChangelog({ inputPath, outputPath, startSuffix });

  console.log(
    `[generate-showcase-changelog] ${changelog.releases.length} entries from ${changelog.source} -> ${outputPath}`,
  );
}

const isDirectExecution =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) runCli();
