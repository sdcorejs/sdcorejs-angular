import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// The showcase is a single repo-owned workspace at the root; it is not mirrored per
// Angular line, so branding is asserted once instead of per versions/v<N>.
const showcaseRoot = join(root, 'showcase');
const expectedTitle = '@sdcorejs/angular — Documentation & Live Examples';
const expectedAuthor = 'Trần Thuận Nghĩa';
const productionUrl = 'https://sdcorejs.github.io/sdcorejs-angular/';
const socialImageUrl = `${productionUrl}assets/social/sdcorejs-angular-og-v1.png`;

function tags(html, name) {
  return (html.match(/<meta\b[^>]*>/giu) ?? []).filter(tag =>
    new RegExp(`(?:name|property)=["']${name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}["']`, 'iu').test(tag)
  );
}

function metaContent(html, name) {
  const matches = tags(html, name);
  assert.equal(matches.length, 1, `${name} must appear exactly once`);
  const content = /content=["']([^"']*)["']/iu.exec(matches[0])?.[1];
  assert.ok(content, `${name} must have content`);
  return content.replaceAll('&amp;', '&');
}

function pngDimensions(path) {
  const image = readFileSync(path);
  assert.equal(image.subarray(1, 4).toString('ascii'), 'PNG', `${path} must be a PNG`);
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

test('showcase ships professional static branding and social metadata', () => {
  {
    const indexPath = join(showcaseRoot, 'src', 'index.html');
    const angularConfig = JSON.parse(readFileSync(join(showcaseRoot, 'angular.json'), 'utf8'));
    const indexHtml = readFileSync(indexPath, 'utf8');
    const logoPath = join(showcaseRoot, 'src', 'assets', 'brand', 'sdcorejs-logo.png');
    const socialPath = join(showcaseRoot, 'src', 'assets', 'social', 'sdcorejs-angular-og-v1.png');

    assert.match(indexHtml, new RegExp(`<title>${expectedTitle.replace('&', '&amp;')}</title>`, 'u'));
    assert.equal(metaContent(indexHtml, 'author'), expectedAuthor);
    assert.match(metaContent(indexHtml, 'description'), new RegExp(expectedAuthor, 'u'));
    assert.equal(metaContent(indexHtml, 'og:title'), expectedTitle);
    assert.equal(metaContent(indexHtml, 'og:type'), 'website');
    assert.equal(metaContent(indexHtml, 'og:url'), productionUrl);
    assert.equal(metaContent(indexHtml, 'og:image'), socialImageUrl);
    assert.match(metaContent(indexHtml, 'og:description'), new RegExp(expectedAuthor, 'u'));
    assert.match(metaContent(indexHtml, 'og:image:alt'), new RegExp(expectedAuthor, 'u'));
    assert.equal(metaContent(indexHtml, 'twitter:card'), 'summary_large_image');
    assert.equal(metaContent(indexHtml, 'twitter:image'), socialImageUrl);
    assert.match(
      indexHtml,
      /<link\s+rel=["']canonical["']\s+href=["']https:\/\/sdcorejs\.github\.io\/sdcorejs-angular\/["']\s*\/?>(?:\s*)/iu
    );
    assert.match(indexHtml, /<link\s+rel=["']icon["'][^>]+href=["']assets\/brand\/sdcorejs-logo\.png["']/iu);
    assert.match(indexHtml, /"@type"\s*:\s*"Person"[\s\S]*"name"\s*:\s*"Trần Thuận Nghĩa"/u);

    const assets = angularConfig.projects.showcase.architect.build.options.assets;
    assert.ok(assets.includes('src/assets'), 'showcase must copy its assets');
    assert.ok(existsSync(logoPath), 'showcase logo asset is missing');
    assert.ok(existsSync(socialPath), 'showcase social image is missing');

    const logo = pngDimensions(logoPath);
    const social = pngDimensions(socialPath);
    assert.equal(logo.width, logo.height, 'favicon/avatar logo must be square');
    assert.ok(social.width >= 1200 && social.height >= 630, 'social image must be large enough for rich previews');
    assert.ok(social.width / social.height > 1.85 && social.width / social.height < 2, 'social image must stay near 1.91:1');
    assert.equal(metaContent(indexHtml, 'og:image:width'), String(social.width));
    assert.equal(metaContent(indexHtml, 'og:image:height'), String(social.height));
  }
});
