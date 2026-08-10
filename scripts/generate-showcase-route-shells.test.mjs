import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  PUBLIC_BASE_URL,
  SUPPORTED_RELEASES,
  canonicalReleaseForSuffix,
  createRouteShellDefinitions,
  generateShowcaseRouteShells,
  parseDocumentationRegistry,
  renderNotFoundShell,
  renderRouteShell,
  selectSupportedReleases,
} from './generate-showcase-route-shells.mjs';

const REGISTRY_FIXTURE = `
const COMPONENT_PAGES = [
  defineDocPage({
    category: 'components',
    slug: 'alert',
    title: 'Alert & Notice',
    description: 'Status feedback for warnings & confirmations.',
    publishedDocId: 'components/alert/sd-alert',
    selector: 'sd-alert',
  }),
  defineDocPage({
    category: 'components',
    slug: 'alert-configuration',
    title: 'Alert Configuration',
    description: 'Legacy configuration entry merged into Alert.',
    publishedDocId: 'components/alert/sd-alert',
    selector: 'sd-alert',
  }),
];

const PUBLISHED_ONLY_PAGES = [
  definePublishedDocPage({
    description: "A guide's practical introduction.",
    title: 'Introduction',
    slug: 'introduction',
    category: 'guides',
    publishedDocId: 'guides/introduction',
    importPath: '@sdcorejs/angular',
  }),
];
`;

const INDEX_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Home title</title>
    <base href="/sdcorejs-angular/" />
    <meta name="description" content="Home description" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="https://sdcorejs.github.io/sdcorejs-angular/" />
    <meta property="og:title" content="Home title" />
    <meta property="og:description" content="Home description" />
    <meta property="og:url" content="https://sdcorejs.github.io/sdcorejs-angular/" />
    <meta name="twitter:title" content="Home title" />
    <meta name="twitter:description" content="Home description" />
  </head>
  <body><app-root></app-root></body>
</html>
`;

function metaContent(html, selector, value) {
  const tag = html.match(new RegExp(`<meta\\b(?=[^>]*\\b${selector}=["']${value}["'])[^>]*>`, 'iu'))?.[0];
  return tag?.match(/\bcontent=["']([^"']*)["']/iu)?.[1] ?? null;
}

test('parses page metadata regardless of property order and mirrors published-document merging', () => {
  assert.deepEqual(parseDocumentationRegistry(REGISTRY_FIXTURE), [
    {
      category: 'components',
      slug: 'alert',
      title: 'Alert & Notice',
      description: 'Status feedback for warnings & confirmations.',
    },
    {
      category: 'guides',
      slug: 'introduction',
      title: 'Introduction',
      description: "A guide's practical introduction.",
    },
  ]);
});

test('selects every published release from 1.2 onward so 1.5 route shells are automatic', () => {
  assert.deepEqual(
    selectSupportedReleases({
      versions: [
        { version: '19.1.4' },
        { version: '21.1.5' },
        { version: '20.1.2' },
        { version: '21.1.1' },
        { version: '22.1.5' },
        { version: '20.1.5-beta.1' },
        { version: '19.1.5' },
      ],
    }),
    ['21.1.5', '20.1.5-beta.1', '20.1.2', '19.1.5', '19.1.4']
  );
});

test('builds only the supported release routes, including page redirects and all four tabs', () => {
  const pages = parseDocumentationRegistry(REGISTRY_FIXTURE);
  const routes = createRouteShellDefinitions(pages, SUPPORTED_RELEASES);

  // why: KHÔNG hardcode danh sách release. `SUPPORTED_RELEASES` được suy ra từ
  // `published-docs/versions.json`, nên mỗi lần phát hành là danh sách đổi và một literal sẽ mục
  // ngay. Test này đã đỏ sẵn trên `main` vì lý do đó (dừng ở `21.1.5` trong khi `1.6` đã ra).
  // Khẳng định CẤU TRÚC — thứ thật sự là hợp đồng — thay vì nội dung.
  assert.ok(SUPPORTED_RELEASES.length > 0, 'SUPPORTED_RELEASES must not be empty');
  for (const release of SUPPORTED_RELEASES) {
    assert.match(release, /^(19|20|21)\.\d+\.\d+$/, `unexpected release id: ${release}`);
  }
  const releasesByMajor = new Map();
  for (const release of SUPPORTED_RELEASES) {
    const major = release.split('.')[0];
    releasesByMajor.set(major, (releasesByMajor.get(major) ?? 0) + 1);
  }
  assert.deepEqual([...releasesByMajor.keys()].sort(), ['19', '20', '21'], 'every Angular line must be represented');
  assert.equal(new Set(releasesByMajor.values()).size, 1, 'each Angular line must expose the same number of releases');

  assert.equal(PUBLIC_BASE_URL, 'https://sdcorejs.github.io/sdcorejs-angular/');
  assert.equal(routes.length, 1 + SUPPORTED_RELEASES.length * (3 + 2 + pages.length * 5));
  assert.ok(routes.some(route => route.routePath === 'about'));
  assert.ok(routes.some(route => route.routePath === 'v/21.1.5'));
  assert.ok(routes.some(route => route.routePath === 'v/21.1.4'));
  assert.ok(routes.some(route => route.routePath === 'v/20.1.4/changelog'));
  assert.ok(routes.some(route => route.routePath === 'v/19.1.4/getting-started'));
  assert.ok(routes.some(route => route.routePath === 'v/21.1.3/components'));
  assert.ok(routes.some(route => route.routePath === 'v/21.1.2/components/alert'));
  assert.equal(
    routes.find(route => route.routePath === 'v/21.1.5/components/alert')?.canonicalUrl,
    `${PUBLIC_BASE_URL}v/21.1.5/components/alert/overview/`
  );
  assert.equal(
    routes.some(route => route.routePath.includes('alert-configuration')),
    false
  );

  for (const tab of ['overview', 'styling', 'api', 'examples']) {
    const route = routes.find(candidate => candidate.routePath === `v/21.1.5/components/alert/${tab}`);
    assert.ok(route, `missing ${tab} route`);
    assert.equal(route.canonicalUrl, `${PUBLIC_BASE_URL}v/21.1.5/components/alert/${tab}/`);
    assert.equal(route.description, 'Status feedback for warnings & confirmations.');
  }

  assert.equal(
    routes.some(route => route.routePath.includes('21.1.1')),
    false
  );
});

test('builds route shells for a future release supplied by the published manifest', () => {
  const pages = parseDocumentationRegistry(REGISTRY_FIXTURE);
  const routes = createRouteShellDefinitions(pages, ['21.1.5', '20.1.5', '19.1.5']);

  assert.ok(routes.some(route => route.routePath === 'v/21.1.5/components/alert/overview'));
  assert.ok(routes.some(route => route.routePath === 'v/20.1.5/guides/introduction/api'));
  assert.ok(routes.some(route => route.routePath === 'v/19.1.5/changelog'));
});

test('matches the canonical v19 runtime registry and expected deployment route count', () => {
  const registrySource = readFileSync(
    new URL('../showcase/src/app/docs/core/documentation.registry.ts', import.meta.url),
    'utf8'
  );
  const pages = parseDocumentationRegistry(registrySource);
  const routes = createRouteShellDefinitions(pages);
  const categoryCounts = Object.fromEntries(
    [...new Set(pages.map(page => page.category))]
      .sort()
      .map(category => [category, pages.filter(page => page.category === category).length])
  );

  assert.equal(pages.length, 99);

  // why: `routes.length` từng là hằng số 5941 và đã mục ngay khi release 1.6 ra (thực tế 7426).
  // Con số đó là TÍCH của hai thứ đã được kiểm ở nơi khác — số release được hỗ trợ và số route mỗi
  // release — nên khẳng định quan hệ, không khẳng định tích. Cách này bắt được đúng thứ cần bắt
  // (một release sinh ra nhiều/ít route hơn các release khác) mà không phải sửa test sau mỗi lần tag.
  const routesPerRelease = SUPPORTED_RELEASES.map(
    release => routes.filter(route => route.routePath === `v/${release}` || route.routePath.startsWith(`v/${release}/`)).length
  );
  assert.equal(new Set(routesPerRelease).size, 1, `every release must emit the same route count, got ${routesPerRelease.join(', ')}`);
  assert.equal(routes.length, 1 + SUPPORTED_RELEASES.length * routesPerRelease[0], 'total = 1 root redirect + one identical block per release');
  assert.deepEqual(categoryCounts, {
    components: 36,
    directives: 6,
    forms: 22,
    guides: 3,
    'modules-integrations': 10,
    'pipes-utilities': 9,
    services: 13,
  });
  assert.equal(
    pages.some(page => page.slug === 'icon-configuration'),
    false
  );
});

test('renders route-specific SEO and social metadata with HTML escaping', () => {
  const html = renderRouteShell(INDEX_TEMPLATE, {
    title: 'Alert & "Notice"',
    description: 'Use <sd-alert> & stay safe.',
    canonicalUrl: `${PUBLIC_BASE_URL}v/21.1.2/components/alert/overview/`,
  });

  assert.match(html, /<title>Alert &amp; &quot;Notice&quot;<\/title>/u);
  assert.equal(metaContent(html, 'name', 'description'), 'Use &lt;sd-alert&gt; &amp; stay safe.');
  assert.equal(metaContent(html, 'property', 'og:title'), 'Alert &amp; &quot;Notice&quot;');
  assert.equal(metaContent(html, 'property', 'og:description'), 'Use &lt;sd-alert&gt; &amp; stay safe.');
  assert.equal(metaContent(html, 'property', 'og:url'), `${PUBLIC_BASE_URL}v/21.1.2/components/alert/overview/`);
  assert.equal(metaContent(html, 'name', 'twitter:title'), 'Alert &amp; &quot;Notice&quot;');
  assert.equal(metaContent(html, 'name', 'twitter:description'), 'Use &lt;sd-alert&gt; &amp; stay safe.');
  assert.match(
    html,
    /<link\s+rel="canonical"\s+href="https:\/\/sdcorejs\.github\.io\/sdcorejs-angular\/v\/21\.1\.2\/components\/alert\/overview\/"\s*\/>/u
  );
});

test('renders a non-indexable 404 shell without canonical or Open Graph URL', () => {
  const html = renderNotFoundShell(INDEX_TEMPLATE);

  assert.equal(metaContent(html, 'name', 'robots'), 'noindex,nofollow');
  assert.doesNotMatch(html, /rel=["']canonical["']/iu);
  assert.doesNotMatch(html, /property=["']og:url["']/iu);
  assert.match(html, /<title>Page not found \| @sdcorejs\/angular Documentation<\/title>/u);
});

test('writes every route as route/index.html and emits the special 404 shell', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'sdcorejs-route-shells-'));
  const registryPath = join(tempRoot, 'documentation.registry.ts');
  const outputDir = join(tempRoot, 'browser');
  const templatePath = join(outputDir, 'index.html');

  try {
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(registryPath, REGISTRY_FIXTURE, 'utf8');
    writeFileSync(templatePath, INDEX_TEMPLATE, 'utf8');

    const result = generateShowcaseRouteShells({ registryPath, templatePath, outputDir });
    const expectedRouteCount = 1 + SUPPORTED_RELEASES.length * (3 + 2 + 2 * 5);

    assert.equal(result.pageCount, 2);
    assert.equal(result.routeCount, expectedRouteCount);
    assert.equal(result.shellCount, expectedRouteCount + 1);
    assert.match(readFileSync(join(outputDir, 'about', 'index.html'), 'utf8'), /\/about\//u);
    assert.match(
      readFileSync(join(outputDir, 'v', '21.1.2', 'components', 'alert', 'api', 'index.html'), 'utf8'),
      /Alert &amp; Notice · API/u
    );
    assert.match(readFileSync(join(outputDir, '404.html'), 'utf8'), /noindex,nofollow/u);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('canonicalReleaseForSuffix pins a page to the newest Angular line', () => {
  assert.equal(canonicalReleaseForSuffix('1.6'), '21.1.6');
  assert.equal(canonicalReleaseForSuffix('0.11'), '21.0.11');
});

test('canonicalReleaseForSuffix rejects anything that is not a release suffix', () => {
  assert.throws(() => canonicalReleaseForSuffix('19.1.6'), /release suffix/i);
  assert.throws(() => canonicalReleaseForSuffix('v1.6'), /release suffix/i);
  assert.throws(() => canonicalReleaseForSuffix('1'), /release suffix/i);
});

test('a version-scoped page pre-renders exactly one release', () => {
  const pages = [
    { category: 'components', slug: 'button', title: 'Button' },
    { category: 'forms', slug: 'input', title: 'Input' },
  ];

  const single = createRouteShellDefinitions(pages, [canonicalReleaseForSuffix('1.6')]);
  const all = createRouteShellDefinitions(pages, ['21.1.6', '20.1.6', '19.1.6']);

  assert.ok(single.length < all.length, 'one release must emit fewer shells than three');
  assert.ok(single.every(route => !route.routePath.startsWith('v/19.')));
  assert.ok(single.every(route => !route.routePath.startsWith('v/20.')));
  assert.ok(single.some(route => route.routePath.startsWith('v/21.1.6/')));
});
