import {
  buildVersionRoute,
  groupVersionsByMajor,
  resolveDocsAssetUrl,
  resolveRequestedVersion,
  selectShowcaseReleaseManifest,
  sortVersionsDescending,
} from './docs-version.utils';
import { DocsVersionsManifest } from './published-docs.models';

const manifest: DocsVersionsManifest = {
  package: '@sdcorejs/angular',
  latest: '21.1.2',
  baseUrl: 'https://example.test/docs',
  versions: [
    { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '21.0.11', index: 'ignored', released: '2026-07-03', count: 85 },
    { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '20.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
    { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '19.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
  ],
};

describe('documentation version utilities', () => {
  it('sorts semantic versions instead of comparing strings', () => {
    expect(sortVersionsDescending(['21.0.9', '21.0.11', '19.1.2', '21.1.2'])).toEqual(['21.1.2', '21.0.11', '21.0.9', '19.1.2']);
    expect(sortVersionsDescending(['21.1.2-beta.2', '21.1.2-beta.10', '21.1.2', '21.1.2-alpha'])).toEqual([
      '21.1.2',
      '21.1.2-beta.10',
      '21.1.2-beta.2',
      '21.1.2-alpha',
    ]);
  });

  it('groups published versions by descending Angular major', () => {
    expect(groupVersionsByMajor(manifest.versions).map(group => group.major)).toEqual([21, 20, 19]);
    expect(groupVersionsByMajor(manifest.versions)[0]?.versions.map(item => item.version)).toEqual(['21.1.2', '21.0.11']);
  });

  it('resolves latest and falls back for an invalid requested version', () => {
    expect(resolveRequestedVersion('latest', manifest)).toEqual({ version: '21.1.2', fallback: false });
    expect(resolveRequestedVersion('99.0.0', manifest)).toEqual({ version: '21.1.2', fallback: true });
  });

  it('uses the highest same-major fallback regardless of manifest order', () => {
    const lowerVersionFirst = {
      ...manifest,
      versions: [
        manifest.versions[3],
        manifest.versions[2],
        manifest.versions[4],
        manifest.versions[0],
        manifest.versions[5],
        manifest.versions[1],
      ],
    };

    expect(resolveRequestedVersion('20.9.9', lowerVersionFirst)).toEqual({ version: '20.1.2', fallback: true });
    expect(resolveRequestedVersion('20.9.9', { ...lowerVersionFirst, versions: [...lowerVersionFirst.versions].reverse() })).toEqual({
      version: '20.1.2',
      fallback: true,
    });
  });

  it('keeps only the first showcase release per Angular major and falls back within the requested major', () => {
    const showcaseManifest = selectShowcaseReleaseManifest(manifest);

    expect(showcaseManifest.versions.map(entry => entry.version)).toEqual(['21.1.2', '20.1.2', '19.1.2']);
    expect(resolveRequestedVersion('20.1.1', showcaseManifest)).toEqual({ version: '20.1.2', fallback: true });
    expect(resolveRequestedVersion('19.1.1', showcaseManifest)).toEqual({ version: '19.1.2', fallback: true });
    expect(resolveRequestedVersion('99.0.0', showcaseManifest)).toEqual({ version: '21.1.2', fallback: true });
  });

  it('preserves category, slug, tab, query and fragment while switching versions', () => {
    expect(buildVersionRoute('/v/21.1.2/components/button/api?mode=full#inputs', '20.1.2')).toBe(
      '/v/20.1.2/components/button/api?mode=full#inputs'
    );
  });

  it('switches versioned Docs and Changelog routes without changing their destination', () => {
    expect(buildVersionRoute('/v/21.1.2', '20.1.2')).toBe('/v/20.1.2');
    expect(buildVersionRoute('/v/21.1.2/changelog', '20.1.2')).toBe('/v/20.1.2/changelog');
  });

  it('keeps the unversioned About route in place when the selected documentation version changes', () => {
    expect(buildVersionRoute('/about?source=header#team', '20.1.2')).toBe('/about?source=header#team');
  });

  it('builds docs URLs under the application base href', () => {
    expect(resolveDocsAssetUrl('https://example.test/sdcorejs-angular/', 'docs/versions.json')).toBe(
      'https://example.test/sdcorejs-angular/docs/versions.json'
    );
  });
});
