#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..');

const DEFAULT_REGISTRY_PATH = join(
  REPO_ROOT,
  'versions',
  'v19',
  'projects',
  'showcase',
  'src',
  'app',
  'docs',
  'core',
  'documentation.registry.ts',
);
const DEFAULT_OUTPUT_DIR = join(REPO_ROOT, 'versions', 'v19', 'dist', 'showcase', 'browser');

export const PUBLIC_BASE_URL = 'https://sdcorejs.github.io/sdcorejs-angular/';
export const SUPPORTED_RELEASES = Object.freeze(['21.1.2', '20.1.2', '19.1.2']);

const DOC_TABS = Object.freeze([
  ['overview', 'Overview'],
  ['styling', 'Styling'],
  ['api', 'API'],
  ['examples', 'Examples'],
]);

const CATEGORY_METADATA = Object.freeze({
  guides: {
    title: 'Guides',
    description: 'Installation, styling and testing guidance for a reliable first implementation.',
  },
  components: {
    title: 'Components',
    description: 'Composable UI building blocks for application screens and workflows.',
  },
  forms: {
    title: 'Forms',
    description: 'Inputs, pickers and controls with consistent validation behavior.',
  },
  directives: {
    title: 'Directives',
    description: 'Template behavior for responsive layouts, navigation and interaction details.',
  },
  services: {
    title: 'Services',
    description: 'Application services for feedback, files, data access and client state.',
  },
  'modules-integrations': {
    title: 'Modules & Integrations',
    description: 'Configuration, authentication, permissions and platform integrations.',
  },
  'pipes-utilities': {
    title: 'Pipes & Utilities',
    description: 'Formatting pipes and shared public utility contracts.',
  },
});

const PAGE_CALL = /\bdefine(?:Published)?DocPage\s*\(\s*\{/gu;
const ROUTE_SEGMENT = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u;

function findObjectEnd(source, openBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error(`Unterminated documentation page seed at character ${openBraceIndex}.`);
}

function decodeStringLiteral(body) {
  let output = '';

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character !== '\\') {
      output += character;
      continue;
    }

    index += 1;
    if (index >= body.length) throw new Error('String literal ends with an incomplete escape sequence.');

    const escaped = body[index];
    const simpleEscapes = {
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
      v: '\v',
      0: '\0',
    };

    if (Object.hasOwn(simpleEscapes, escaped)) {
      output += simpleEscapes[escaped];
      continue;
    }

    if (escaped === '\n') continue;
    if (escaped === '\r') {
      if (body[index + 1] === '\n') index += 1;
      continue;
    }

    if (escaped === 'x') {
      const hexadecimal = body.slice(index + 1, index + 3);
      if (!/^[0-9a-f]{2}$/iu.test(hexadecimal)) throw new Error(`Invalid hexadecimal escape \\x${hexadecimal}.`);
      output += String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      index += 2;
      continue;
    }

    if (escaped === 'u') {
      const braced = body[index + 1] === '{';
      const end = braced ? body.indexOf('}', index + 2) : index + 5;
      const hexadecimal = braced ? body.slice(index + 2, end) : body.slice(index + 1, end);
      if (end < 0 || !/^[0-9a-f]{1,6}$/iu.test(hexadecimal)) throw new Error(`Invalid Unicode escape near \\u${hexadecimal}.`);
      output += String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      index = braced ? end : end - 1;
      continue;
    }

    output += escaped;
  }

  return output;
}

function readStringProperty(objectSource, property) {
  const propertyMatch = new RegExp(`^\\s*${property}\\s*:\\s*`, 'mu').exec(objectSource);
  if (!propertyMatch) throw new Error(`Documentation page seed is missing string property "${property}".`);

  const valueStart = propertyMatch.index + propertyMatch[0].length;
  const quote = objectSource[valueStart];
  if (quote !== "'" && quote !== '"' && quote !== '`') {
    throw new Error(`Documentation page property "${property}" must be a string literal.`);
  }

  let escaped = false;
  for (let index = valueStart + 1; index < objectSource.length; index += 1) {
    const character = objectSource[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (character !== quote) continue;

    const body = objectSource.slice(valueStart + 1, index);
    if (quote === '`' && body.includes('${')) {
      throw new Error(`Documentation page property "${property}" cannot use template interpolation.`);
    }
    return decodeStringLiteral(body);
  }

  throw new Error(`Documentation page property "${property}" has an unterminated string literal.`);
}

function readOptionalStringProperty(objectSource, property) {
  const propertyMatch = new RegExp(`^\\s*${property}\\s*:\\s*`, 'mu').exec(objectSource);
  if (!propertyMatch) return null;

  const valueStart = propertyMatch.index + propertyMatch[0].length;
  if (/^null\b/u.test(objectSource.slice(valueStart))) return null;
  return readStringProperty(objectSource, property);
}

function validateRouteSegment(segment, label) {
  if (!ROUTE_SEGMENT.test(segment)) throw new Error(`Invalid ${label} route segment "${segment}".`);
}

/** Parses canonical route metadata without importing or executing the TypeScript registry. */
export function parseDocumentationRegistry(source) {
  if (typeof source !== 'string') throw new TypeError('Registry source must be a string.');

  const pages = [];
  const paths = new Set();
  const publishedDocumentIds = new Set();
  let match;

  PAGE_CALL.lastIndex = 0;
  while ((match = PAGE_CALL.exec(source))) {
    const openBraceIndex = match.index + match[0].lastIndexOf('{');
    const closeBraceIndex = findObjectEnd(source, openBraceIndex);
    const objectSource = source.slice(openBraceIndex + 1, closeBraceIndex);
    const page = {
      category: readStringProperty(objectSource, 'category'),
      slug: readStringProperty(objectSource, 'slug'),
      title: readStringProperty(objectSource, 'title'),
      description: readStringProperty(objectSource, 'description'),
    };
    const publishedDocId = readOptionalStringProperty(objectSource, 'publishedDocId');

    PAGE_CALL.lastIndex = closeBraceIndex + 1;
    if (publishedDocId && publishedDocumentIds.has(publishedDocId)) continue;

    validateRouteSegment(page.category, 'category');
    validateRouteSegment(page.slug, 'page');
    if (!Object.hasOwn(CATEGORY_METADATA, page.category)) {
      throw new Error(`Unknown documentation category "${page.category}".`);
    }

    const path = `${page.category}/${page.slug}`;
    if (paths.has(path)) throw new Error(`Duplicate documentation route "${path}".`);
    if (publishedDocId) publishedDocumentIds.add(publishedDocId);
    paths.add(path);
    pages.push(page);
  }

  if (pages.length === 0) throw new Error('No documentation page seeds were found in the registry.');
  return pages;
}

function routeDefinition(routePath, title, description, canonicalRoutePath = routePath) {
  for (const segment of routePath.split('/')) validateRouteSegment(segment, 'route');
  for (const segment of canonicalRoutePath.split('/')) validateRouteSegment(segment, 'canonical route');
  return {
    routePath,
    title,
    description,
    canonicalUrl: new URL(`${canonicalRoutePath}/`, PUBLIC_BASE_URL).href,
  };
}

/** Builds the complete, deterministic GitHub Pages route-shell manifest. */
export function createRouteShellDefinitions(pages) {
  if (!Array.isArray(pages) || pages.length === 0) throw new Error('At least one documentation page is required.');

  const routes = [
    routeDefinition(
      'about',
      'About | @sdcorejs/angular Documentation',
      'About SDCoreJS Angular, its maintainer, release support, and documentation project.',
    ),
  ];
  const representedCategories = Object.keys(CATEGORY_METADATA).filter(category =>
    pages.some(page => page.category === category),
  );

  for (const version of SUPPORTED_RELEASES) {
    const versionTitle = `@sdcorejs/angular ${version}`;
    routes.push(
      routeDefinition(
        `v/${version}`,
        `${versionTitle} — Documentation & Live Examples`,
        `Version-aware documentation, API references, and live Angular examples for ${versionTitle}.`,
      ),
      routeDefinition(
        `v/${version}/changelog`,
        `Changelog | ${versionTitle} Documentation`,
        `Release notes, changes, fixes, and migration information for ${versionTitle}.`,
      ),
      routeDefinition(
        `v/${version}/getting-started`,
        `Getting started | ${versionTitle} Documentation`,
        `Install, configure, style, and start building with ${versionTitle}.`,
      ),
    );

    for (const category of representedCategories) {
      const metadata = CATEGORY_METADATA[category];
      routes.push(
        routeDefinition(
          `v/${version}/${category}`,
          `${metadata.title} | ${versionTitle} Documentation`,
          `${metadata.description} Browse the ${versionTitle} reference.`,
        ),
      );
    }

    for (const page of pages) {
      const pagePath = `v/${version}/${page.category}/${page.slug}`;
      routes.push(
        routeDefinition(
          pagePath,
          `${page.title} | ${versionTitle} Documentation`,
          page.description,
          `${pagePath}/overview`,
        ),
      );

      for (const [tab, tabLabel] of DOC_TABS) {
        routes.push(
          routeDefinition(
            `${pagePath}/${tab}`,
            `${page.title} · ${tabLabel} | ${versionTitle} Documentation`,
            page.description,
          ),
        );
      }
    }
  }

  const uniquePaths = new Set(routes.map(route => route.routePath));
  if (uniquePaths.size !== routes.length) throw new Error('Generated route-shell manifest contains duplicate paths.');
  return routes;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function setTagAttribute(tag, attribute, value) {
  const escapedValue = escapeHtml(value);
  const attributePattern = new RegExp(`(\\s${escapeRegExp(attribute)}\\s*=\\s*)(["'])(.*?)\\2`, 'iu');
  if (attributePattern.test(tag)) {
    return tag.replace(attributePattern, (_match, prefix) => `${prefix}"${escapedValue}"`);
  }
  return tag.replace(/\s*\/?>$/u, ending => ` ${attribute}="${escapedValue}"${ending}`);
}

function replaceRequiredTag(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Built index template is missing ${label}.`);
  pattern.lastIndex = 0;
  return html.replace(pattern, replacement);
}

function replaceMetaContent(html, selector, selectorValue, content) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${escapeRegExp(selector)}\\s*=\\s*["']${escapeRegExp(selectorValue)}["'])[^>]*>`,
    'iu',
  );
  return replaceRequiredTag(
    html,
    pattern,
    tag => setTagAttribute(tag, 'content', content),
    `<meta ${selector}="${selectorValue}">`,
  );
}

/** Replaces all route-sensitive document, Open Graph, and Twitter metadata. */
export function renderRouteShell(template, metadata) {
  const { title, description, canonicalUrl } = metadata;
  if (![title, description, canonicalUrl].every(value => typeof value === 'string' && value.length > 0)) {
    throw new Error('Route metadata requires non-empty title, description, and canonicalUrl strings.');
  }

  let html = replaceRequiredTag(
    template,
    /<title\b[^>]*>[\s\S]*?<\/title>/iu,
    `<title>${escapeHtml(title)}</title>`,
    '<title>',
  );
  html = replaceMetaContent(html, 'name', 'description', description);
  html = replaceRequiredTag(
    html,
    /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/iu,
    tag => setTagAttribute(tag, 'href', canonicalUrl),
    '<link rel="canonical">',
  );
  html = replaceMetaContent(html, 'property', 'og:title', title);
  html = replaceMetaContent(html, 'property', 'og:description', description);
  html = replaceMetaContent(html, 'property', 'og:url', canonicalUrl);
  html = replaceMetaContent(html, 'name', 'twitter:title', title);
  html = replaceMetaContent(html, 'name', 'twitter:description', description);
  return html;
}

/** Creates the shared GitHub Pages fallback without an indexable canonical target. */
export function renderNotFoundShell(template) {
  let html = renderRouteShell(template, {
    title: 'Page not found | @sdcorejs/angular Documentation',
    description: 'The requested @sdcorejs/angular documentation page could not be found.',
    canonicalUrl: `${PUBLIC_BASE_URL}404.html`,
  });
  html = replaceMetaContent(html, 'name', 'robots', 'noindex,nofollow');
  html = html.replace(/\s*<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/iu, '\n');
  html = html.replace(/\s*<meta\b(?=[^>]*\bproperty\s*=\s*["']og:url["'])[^>]*>\s*/iu, '\n');
  return html;
}

/** Generates static route shells into an already-built Angular browser output. */
export function generateShowcaseRouteShells(options = {}) {
  const registryPath = resolve(options.registryPath ?? DEFAULT_REGISTRY_PATH);
  const outputDir = resolve(options.outputDir ?? DEFAULT_OUTPUT_DIR);
  const templatePath = resolve(options.templatePath ?? join(outputDir, 'index.html'));
  const registrySource = readFileSync(registryPath, 'utf8');
  const template = readFileSync(templatePath, 'utf8');
  const pages = parseDocumentationRegistry(registrySource);
  const routes = createRouteShellDefinitions(pages);

  for (const route of routes) {
    const outputPath = join(outputDir, ...route.routePath.split('/'), 'index.html');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, renderRouteShell(template, route), 'utf8');
  }

  writeFileSync(join(outputDir, '404.html'), renderNotFoundShell(template), 'utf8');

  return {
    registryPath,
    templatePath,
    outputDir,
    pageCount: pages.length,
    categoryCount: new Set(pages.map(page => page.category)).size,
    routeCount: routes.length,
    shellCount: routes.length + 1,
  };
}

function runCli() {
  const { values } = parseArgs({
    options: {
      registry: { type: 'string' },
      template: { type: 'string' },
      output: { type: 'string' },
    },
  });
  const outputDir = values.output ? resolve(values.output) : DEFAULT_OUTPUT_DIR;
  const result = generateShowcaseRouteShells({
    registryPath: values.registry ? resolve(values.registry) : DEFAULT_REGISTRY_PATH,
    templatePath: values.template ? resolve(values.template) : join(outputDir, 'index.html'),
    outputDir,
  });

  console.log(
    `[showcase-route-shells] ${result.shellCount} shell(s): ${result.routeCount} routes + 404 from ${result.pageCount} pages across ${result.categoryCount} categories -> ${result.outputDir}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli();
}
