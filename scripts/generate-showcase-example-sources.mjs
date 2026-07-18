#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..');

export const DEFAULT_PAGES_ROOT = join(REPO_ROOT, 'versions', 'v19', 'projects', 'showcase', 'src', 'app', 'pages');

export const DEFAULT_OUTPUT_FILE = join(
  REPO_ROOT,
  'versions',
  'v19',
  'projects',
  'showcase',
  'src',
  'app',
  'docs',
  'generated',
  'example-sources.generated.ts'
);

export const DEFAULT_MANIFEST_OUTPUT_FILE = join(
  REPO_ROOT,
  'versions',
  'v19',
  'projects',
  'showcase',
  'src',
  'app',
  'docs',
  'generated',
  'example-manifest.generated.ts'
);

function toPosix(filePath) {
  return filePath.split(sep).join('/');
}

function normalizeText(content) {
  return content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function normalizeBlock(content) {
  const lines = normalizeText(content).split('\n');

  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines.at(-1).trim() === '') lines.pop();

  const indents = lines.filter(line => line.trim() !== '').map(line => line.match(/^[\t ]*/)?.[0].length ?? 0);
  const commonIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines.map(line => line.slice(commonIndent)).join('\n');
}

function skipQuotedSource(source, start, quote) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index + 1;
    index++;
  }
  throw new Error(`Unterminated ${quote === '`' ? 'template' : 'string'} literal.`);
}

/** Marks TypeScript characters that are outside comments and string/template literals. */
function createCodeMask(source) {
  const mask = new Uint8Array(source.length);
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') index++;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) throw new Error('Unterminated block comment.');
      index = end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      index = skipQuotedSource(source, index, char);
      continue;
    }

    mask[index] = 1;
    index++;
  }

  return mask;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findCodeMatch(source, mask, expression) {
  for (const match of source.matchAll(expression)) {
    if (match.index !== undefined && mask[match.index] === 1) return match;
  }
  return undefined;
}

function findCodeToken(source, mask, token, start = 0, end = source.length) {
  let index = source.indexOf(token, start);
  while (index >= 0 && index < end) {
    if (mask[index] === 1) return index;
    index = source.indexOf(token, index + token.length);
  }
  return -1;
}

function findCodeCharacter(source, mask, character, start, end = source.length) {
  for (let index = start; index < end; index++) {
    if (mask[index] === 1 && source[index] === character) return index;
  }
  return -1;
}

function findMatchingCharacter(source, mask, start, open, close) {
  let depth = 0;
  for (let index = start; index < source.length; index++) {
    if (mask[index] !== 1) continue;
    if (source[index] === open) depth++;
    if (source[index] !== close) continue;
    depth--;
    if (depth === 0) return index;
  }
  throw new Error(`Unmatched "${open}" while parsing component metadata.`);
}

function parseObjectProperties(source, mask, objectStart, objectEnd) {
  const segments = [];
  let segmentStart = objectStart + 1;
  let roundDepth = 0;
  let squareDepth = 0;
  let curlyDepth = 0;

  for (let index = segmentStart; index < objectEnd; index++) {
    if (mask[index] !== 1) continue;
    const char = source[index];

    if (char === '(') roundDepth++;
    else if (char === ')') roundDepth--;
    else if (char === '[') squareDepth++;
    else if (char === ']') squareDepth--;
    else if (char === '{') curlyDepth++;
    else if (char === '}') curlyDepth--;
    else if (char === ',' && roundDepth === 0 && squareDepth === 0 && curlyDepth === 0) {
      segments.push([segmentStart, index]);
      segmentStart = index + 1;
    }
  }
  segments.push([segmentStart, objectEnd]);

  const properties = new Map();
  for (const [start, end] of segments) {
    roundDepth = 0;
    squareDepth = 0;
    curlyDepth = 0;
    let colon = -1;

    for (let index = start; index < end; index++) {
      if (mask[index] !== 1) continue;
      const char = source[index];
      if (char === '(') roundDepth++;
      else if (char === ')') roundDepth--;
      else if (char === '[') squareDepth++;
      else if (char === ']') squareDepth--;
      else if (char === '{') curlyDepth++;
      else if (char === '}') curlyDepth--;
      else if (char === ':' && roundDepth === 0 && squareDepth === 0 && curlyDepth === 0) {
        colon = index;
        break;
      }
    }

    if (colon < 0) continue;
    const name = source.slice(start, colon).trim();
    if (/^[A-Za-z_$][\w$]*$/.test(name)) {
      properties.set(name, source.slice(colon + 1, end).trim());
    }
  }

  return properties;
}

function decodeEscapeSequence(sequence) {
  const simpleEscapes = new Map([
    ['0', '\0'],
    ['b', '\b'],
    ['f', '\f'],
    ['n', '\n'],
    ['r', '\r'],
    ['t', '\t'],
    ['v', '\v'],
  ]);
  return simpleEscapes.get(sequence) ?? sequence;
}

function decodeLiteralContent(content) {
  let decoded = '';
  for (let index = 0; index < content.length; index++) {
    if (content[index] !== '\\' || index + 1 >= content.length) {
      decoded += content[index];
      continue;
    }

    const next = content[++index];
    if (next === 'x' && /^[0-9A-Fa-f]{2}$/.test(content.slice(index + 1, index + 3))) {
      decoded += String.fromCharCode(Number.parseInt(content.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }
    if (next === 'u' && /^[0-9A-Fa-f]{4}$/.test(content.slice(index + 1, index + 5))) {
      decoded += String.fromCharCode(Number.parseInt(content.slice(index + 1, index + 5), 16));
      index += 4;
      continue;
    }
    decoded += decodeEscapeSequence(next);
  }
  return decoded;
}

function readStringLiteral(rawValue, start = 0) {
  const quote = rawValue[start];
  if (quote !== "'" && quote !== '"' && quote !== '`') {
    throw new Error('Expected a string or template literal.');
  }

  let index = start + 1;
  while (index < rawValue.length) {
    if (rawValue[index] === '\\') {
      index += 2;
      continue;
    }
    if (rawValue[index] === quote) {
      return {
        value: decodeLiteralContent(rawValue.slice(start + 1, index)),
        end: index + 1,
      };
    }
    index++;
  }

  throw new Error('Unterminated string literal in component metadata.');
}

function parseStringProperty(rawValue, propertyName) {
  const value = rawValue.trim();
  try {
    const result = readStringLiteral(value);
    if (value.slice(result.end).trim() !== '') {
      throw new Error('unexpected trailing content');
    }
    return result.value;
  } catch (error) {
    throw new Error(`Unsupported ${propertyName} value: ${error.message}`);
  }
}

function skipArrayComment(rawValue, start) {
  if (rawValue[start + 1] === '/') {
    const end = rawValue.indexOf('\n', start + 2);
    return end < 0 ? rawValue.length : end + 1;
  }
  if (rawValue[start + 1] === '*') {
    const end = rawValue.indexOf('*/', start + 2);
    if (end < 0) throw new Error('Unterminated array comment.');
    return end + 2;
  }
  return start;
}

function parseStringArrayProperty(rawValue, propertyName) {
  const value = rawValue.trim();
  if (!value.startsWith('[') || !value.endsWith(']')) {
    throw new Error(`Unsupported ${propertyName} value: expected an array of string literals.`);
  }

  const values = [];
  let index = 1;
  while (index < value.length - 1) {
    if (/\s|,/.test(value[index])) {
      index++;
      continue;
    }
    if (value[index] === '/' && (value[index + 1] === '/' || value[index + 1] === '*')) {
      index = skipArrayComment(value, index);
      continue;
    }
    if (value[index] === "'" || value[index] === '"' || value[index] === '`') {
      const result = readStringLiteral(value, index);
      values.push(result.value);
      index = result.end;
      continue;
    }
    throw new Error(`Unsupported ${propertyName} value near "${value.slice(index, index + 24)}".`);
  }

  return values;
}

function pascalCase(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function toExampleAnchor(value) {
  return `example-${value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function findHtmlTagEnd(html, start) {
  let quote = '';
  for (let index = start; index < html.length; index++) {
    const character = html[index];
    if (quote) {
      if (character === quote && html[index - 1] !== '\\') quote = '';
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  throw new Error('Unterminated <demo-section> opening tag.');
}

function readStaticHtmlAttribute(openingTag, attribute) {
  const expression = new RegExp(`(?:^|\\s)${escapeRegExp(attribute)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`);
  return expression.exec(openingTag)?.[2];
}

/** Extracts stable source records for every existing demo-section in one page template. */
export function extractDemoSectionSources(pageSource) {
  const records = [];
  const seenIds = new Set();
  let cursor = 0;

  if (pageSource.html.includes('<demo-section') && !/<demo-page\b[^>]*#demoPage/.test(pageSource.html)) {
    throw new Error(`Demo page "${pageSource.key}" must expose #demoPage for focused structural guards.`);
  }

  while (cursor < pageSource.html.length) {
    const sectionStart = pageSource.html.indexOf('<demo-section', cursor);
    if (sectionStart < 0) break;
    const openingEnd = findHtmlTagEnd(pageSource.html, sectionStart);
    const closingStart = pageSource.html.indexOf('</demo-section>', openingEnd + 1);
    if (closingStart < 0) throw new Error(`Missing </demo-section> in "${pageSource.key}".`);
    const closingEnd = closingStart + '</demo-section>'.length;
    const openingTag = pageSource.html.slice(sectionStart, openingEnd + 1);
    const heading = readStaticHtmlAttribute(openingTag, 'heading');
    if (!heading) throw new Error(`Every demo-section in "${pageSource.key}" must have a static heading.`);

    const sectionId = toExampleAnchor(heading);
    if (seenIds.has(sectionId)) {
      throw new Error(`Duplicate demo-section id "${sectionId}" in "${pageSource.key}".`);
    }
    seenIds.add(sectionId);
    const guardPrefix = pageSource.html.slice(Math.max(0, sectionStart - 320), sectionStart);
    const guardExpression = new RegExp(
      `@if\\s*\\(\\s*!demoPage\\.focusedSectionId\\s*\\|\\|\\s*demoPage\\.focusedSectionId\\s*===\\s*['"]${escapeRegExp(sectionId)}['"]\\s*\\)\\s*\\{\\s*$`,
    );
    if (!guardExpression.test(guardPrefix)) {
      throw new Error(`Demo section "${pageSource.key}/${sectionId}" must use a matching focused structural guard.`);
    }

    const note = readStaticHtmlAttribute(openingTag, 'note');
    const typescriptPath = readStaticHtmlAttribute(openingTag, 'data-example-typescript');
    const templatePath = readStaticHtmlAttribute(openingTag, 'data-example-template');
    const stylePath = readStaticHtmlAttribute(openingTag, 'data-example-style');
    if (!!typescriptPath !== !!templatePath) {
      throw new Error(`Focused source for "${pageSource.key}/${sectionId}" requires both TypeScript and template paths.`);
    }
    if (stylePath && (!typescriptPath || !templatePath)) {
      throw new Error(`Focused style for "${pageSource.key}/${sectionId}" requires TypeScript and template paths.`);
    }
    const focusedSource = typescriptPath && templatePath
      ? {
          typescript: readExternalSource(pageSource.sourceFile, typescriptPath, pageSource.key, 'focused TypeScript'),
          html: readExternalSource(pageSource.sourceFile, templatePath, pageSource.key, 'focused template'),
          scss: stylePath ? readExternalSource(pageSource.sourceFile, stylePath, pageSource.key, 'focused style') : undefined,
        }
      : null;
    records.push({
      ...pageSource,
      key: `${pageSource.key}/${sectionId}`,
      pageKey: pageSource.key,
      sourceGroupKey: focusedSource ? `${pageSource.key}/${sectionId}` : pageSource.key,
      sectionId,
      sectionOrder: records.length,
      title: heading,
      description: note || `Existing “${heading}” scenario preserved from the showcase.`,
      typescript: focusedSource?.typescript ?? pageSource.typescript,
      html: focusedSource?.html ?? normalizeBlock(pageSource.html.slice(sectionStart, closingEnd)),
      scss: focusedSource?.scss ?? (focusedSource ? undefined : pageSource.scss),
    });
    cursor = closingEnd;
  }

  return records;
}

export function deriveExampleKey(sourceFile, pagesRoot = DEFAULT_PAGES_ROOT) {
  const normalizedRoot = resolve(pagesRoot);
  const normalizedFile = resolve(sourceFile);
  const relativePath = toPosix(relative(normalizedRoot, normalizedFile));

  if (relativePath.startsWith('../') || relativePath === '..') {
    throw new Error(`Demo source is outside pages root: ${normalizedFile}`);
  }

  const parts = relativePath.split('/');
  if (parts.length < 3 || !parts.at(-1).endsWith('-demo.component.ts')) {
    throw new Error(`Invalid showcase demo path: ${relativePath}`);
  }

  return `${parts[0]}/${parts[1]}`;
}

function extractPrimaryComponentProperties(source, slug, sourceFile) {
  const expectedClass = `${pascalCase(slug)}DemoComponent`;
  const mask = createCodeMask(source);
  const classExpression = new RegExp(`\\bexport\\s+class\\s+${escapeRegExp(expectedClass)}\\b`, 'g');
  const classMatch = findCodeMatch(source, mask, classExpression);

  if (!classMatch || classMatch.index === undefined) {
    throw new Error(`Cannot find primary class ${expectedClass} in ${sourceFile}.`);
  }

  let decoratorStart = -1;
  let candidate = findCodeToken(source, mask, '@Component', 0, classMatch.index);
  while (candidate >= 0) {
    decoratorStart = candidate;
    candidate = findCodeToken(source, mask, '@Component', candidate + 1, classMatch.index);
  }
  if (decoratorStart < 0) {
    throw new Error(`Cannot find @Component metadata for ${expectedClass} in ${sourceFile}.`);
  }

  const callStart = findCodeCharacter(source, mask, '(', decoratorStart, classMatch.index);
  const callEnd = findMatchingCharacter(source, mask, callStart, '(', ')');
  if (callEnd > classMatch.index) {
    throw new Error(`Invalid @Component metadata range for ${expectedClass} in ${sourceFile}.`);
  }

  const objectStart = findCodeCharacter(source, mask, '{', callStart + 1, callEnd);
  const objectEnd = findMatchingCharacter(source, mask, objectStart, '{', '}');
  return parseObjectProperties(source, mask, objectStart, objectEnd);
}

function readExternalSource(componentFile, requestedPath, key, kind) {
  const externalPath = resolve(dirname(componentFile), requestedPath);
  if (!existsSync(externalPath) || !statSync(externalPath).isFile()) {
    throw new Error(`Missing external ${kind} for "${key}": ${externalPath}`);
  }
  return normalizeBlock(readFileSync(externalPath, 'utf8'));
}

function extractTemplate(properties, sourceFile, key) {
  if (properties.has('template')) {
    return normalizeBlock(parseStringProperty(properties.get('template'), 'template'));
  }
  if (properties.has('templateUrl')) {
    const templateUrl = parseStringProperty(properties.get('templateUrl'), 'templateUrl');
    return readExternalSource(sourceFile, templateUrl, key, 'template');
  }
  throw new Error(`Primary component for "${key}" has neither template nor templateUrl.`);
}

function extractStyles(properties, sourceFile, key) {
  if (properties.has('styles')) {
    const rawStyles = properties.get('styles');
    const inlineStyles = rawStyles.trim().startsWith('[')
      ? parseStringArrayProperty(rawStyles, 'styles')
      : [parseStringProperty(rawStyles, 'styles')];
    const styles = inlineStyles.map(normalizeBlock).filter(Boolean);
    return styles.length > 0 ? styles.join('\n\n') : undefined;
  }

  let styleUrls = [];
  if (properties.has('styleUrls')) {
    styleUrls = parseStringArrayProperty(properties.get('styleUrls'), 'styleUrls');
  } else if (properties.has('styleUrl')) {
    styleUrls = [parseStringProperty(properties.get('styleUrl'), 'styleUrl')];
  }

  const styles = styleUrls.map(styleUrl => readExternalSource(sourceFile, styleUrl, key, 'style')).filter(Boolean);
  return styles.length > 0 ? styles.join('\n\n') : undefined;
}

/** Extracts one category/slug record from its primary `*DemoComponent`. */
export function extractExampleSource(sourceFile, pagesRoot = DEFAULT_PAGES_ROOT) {
  const key = deriveExampleKey(sourceFile, pagesRoot);
  const slug = key.split('/')[1];
  const typescript = normalizeText(readFileSync(sourceFile, 'utf8'));
  const properties = extractPrimaryComponentProperties(typescript, slug, sourceFile);
  const html = extractTemplate(properties, sourceFile, key);
  const scss = extractStyles(properties, sourceFile, key);

  return scss ? { key, sourceFile, typescript, html, scss } : { key, sourceFile, typescript, html };
}

/** Expands a page-level demo into focused records while retaining a fallback for legacy fixtures. */
export function extractExampleSources(sourceFile, pagesRoot = DEFAULT_PAGES_ROOT) {
  const pageSource = extractExampleSource(sourceFile, pagesRoot);
  const sections = extractDemoSectionSources(pageSource);
  if (sections.length) return sections;

  const title = pageSource.key.split('/').at(-1) ?? pageSource.key;
  return [{
    ...pageSource,
    pageKey: pageSource.key,
    sectionId: null,
    sectionOrder: 0,
    title,
    description: `Existing ${title} showcase.`,
  }];
}

/** Recursively finds page-level demo components in stable path order. */
export function collectDemoSourceFiles(pagesRoot = DEFAULT_PAGES_ROOT) {
  const root = resolve(pagesRoot);
  const files = [];

  function visit(directory) {
    const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && entry.name.endsWith('-demo.component.ts')) files.push(fullPath);
    }
  }

  visit(root);
  return files.sort((a, b) => toPosix(relative(root, a)).localeCompare(toPosix(relative(root, b))));
}

function escapeTemplateValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function renderValue(property, value) {
  return `    ${property}: \`${escapeTemplateValue(value)}\`,`;
}

export function renderGeneratedModule(records) {
  const sortedRecords = [...records].sort((a, b) => a.key.localeCompare(b.key));
  const keys = new Set();
  const pageSources = new Map();
  const blocks = [];

  for (const record of sortedRecords) {
    if (keys.has(record.key)) throw new Error(`Duplicate example source key "${record.key}".`);
    keys.add(record.key);

    const pageKey = record.sourceGroupKey ?? record.pageKey ?? record.key;
    const existingPage = pageSources.get(pageKey);
    if (existingPage && (existingPage.typescript !== record.typescript || existingPage.scss !== record.scss)) {
      throw new Error(`Inconsistent shared source for page "${pageKey}".`);
    }
    pageSources.set(pageKey, { typescript: record.typescript, scss: record.scss });

    const lines = [
      `  ${JSON.stringify(record.key)}: {`,
      `    ...SHOWCASE_PAGE_SOURCES[${JSON.stringify(pageKey)}],`,
      renderValue('html', record.html),
    ];
    lines.push('  },');
    blocks.push(lines.join('\n'));
  }

  const pageBlocks = [...pageSources.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, source]) => {
    const lines = [`  ${JSON.stringify(key)}: {`, renderValue('typescript', source.typescript)];
    if (source.scss !== undefined) lines.push(renderValue('scss', source.scss));
    lines.push('  },');
    return lines.join('\n');
  });

  return `// AUTO-GENERATED by scripts/generate-showcase-example-sources.mjs. DO NOT EDIT.\n// Run \`node scripts/generate-showcase-example-sources.mjs\` after changing showcase demos.\n\nexport interface ShowcaseExampleSource {\n  readonly typescript: string;\n  readonly html: string;\n  readonly scss?: string;\n}\n\nconst SHOWCASE_PAGE_SOURCES = {\n${pageBlocks.join('\n')}\n} as const;\n\nexport const SHOWCASE_EXAMPLE_SOURCES = {\n${blocks.join('\n')}\n} as const satisfies Readonly<Record<string, ShowcaseExampleSource>>;\n\nexport type ShowcaseExampleSourceKey = keyof typeof SHOWCASE_EXAMPLE_SOURCES;\n`;
}

export function renderGeneratedManifest(records) {
  const keySortedRecords = [...records].sort((a, b) => a.key.localeCompare(b.key));
  const manifestRecords = [...records].sort((a, b) => {
    const page = (a.pageKey ?? a.key).localeCompare(b.pageKey ?? b.key);
    if (page !== 0) return page;
    return (a.sectionOrder ?? Number.MAX_SAFE_INTEGER) - (b.sectionOrder ?? Number.MAX_SAFE_INTEGER)
      || a.key.localeCompare(b.key);
  });
  const sourceKeys = keySortedRecords.length
    ? keySortedRecords.map(record => `  | ${JSON.stringify(record.key)}`).join('\n')
    : '  | never';
  const entries = manifestRecords.map(record => [
    '  {',
    `    sourceKey: ${JSON.stringify(record.key)},`,
    `    pageKey: ${JSON.stringify(record.pageKey)},`,
    `    sectionId: ${record.sectionId === null ? 'null' : JSON.stringify(record.sectionId)},`,
    `    title: ${JSON.stringify(record.title)},`,
    `    description: ${JSON.stringify(record.description)},`,
    '  },',
  ].join('\n')).join('\n');

  return `// AUTO-GENERATED by scripts/generate-showcase-example-sources.mjs. DO NOT EDIT.
// This small manifest is safe to import eagerly; source text stays in the lazy source module.

export type ShowcaseExampleSourceKey =
${sourceKeys};

export interface ShowcaseExampleManifestEntry {
  readonly sourceKey: ShowcaseExampleSourceKey;
  readonly pageKey: string;
  readonly sectionId: string | null;
  readonly title: string;
  readonly description: string;
}

export const SHOWCASE_EXAMPLE_MANIFEST = [
${entries}
] as const satisfies readonly ShowcaseExampleManifestEntry[];
`;
}

/** Generates the typed module and returns its sorted source records. */
export function generateExampleSourceModule({
  pagesRoot = DEFAULT_PAGES_ROOT,
  outputFile = DEFAULT_OUTPUT_FILE,
  manifestOutputFile,
  sourceFiles = collectDemoSourceFiles(pagesRoot),
} = {}) {
  const records = sourceFiles.flatMap(sourceFile => extractExampleSources(sourceFile, pagesRoot));
  const generated = renderGeneratedModule(records);
  const manifestFile = manifestOutputFile
    ?? (resolve(outputFile) === resolve(DEFAULT_OUTPUT_FILE)
      ? DEFAULT_MANIFEST_OUTPUT_FILE
      : join(dirname(outputFile), 'example-manifest.generated.ts'));

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, generated, 'utf8');
  mkdirSync(dirname(manifestFile), { recursive: true });
  writeFileSync(manifestFile, renderGeneratedManifest(records), 'utf8');

  return [...records].sort((a, b) => a.key.localeCompare(b.key));
}

function main() {
  const records = generateExampleSourceModule();
  console.log(
    `[generate-showcase-example-sources] wrote ${records.length} entries to ${toPosix(relative(REPO_ROOT, DEFAULT_OUTPUT_FILE))} and ${toPosix(relative(REPO_ROOT, DEFAULT_MANIFEST_OUTPUT_FILE))}`
  );
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  main();
}
