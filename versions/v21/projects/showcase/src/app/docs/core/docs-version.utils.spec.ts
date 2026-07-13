import {
  buildVersionRoute,
  groupVersionsByMajor,
  resolveDocsAssetUrl,
  resolveRequestedVersion,
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
    { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
  ],
};

describe('documentation version utilities', () => {
  it('sorts semantic versions instead of comparing strings', () => {
    expect(sortVersionsDescending(['21.0.9', '21.0.11', '19.1.2', '21.1.2'])).toEqual([
      '21.1.2',
      '21.0.11',
      '21.0.9',
      '19.1.2',
    ]);
    expect(sortVersionsDescending(['21.1.2-beta.2', '21.1.2-beta.10', '21.1.2', '21.1.2-alpha']))
      .toEqual(['21.1.2', '21.1.2-beta.10', '21.1.2-beta.2', '21.1.2-alpha']);
  });

  it('groups published versions by descending Angular major', () => {
    expect(groupVersionsByMajor(manifest.versions).map((group) => group.major)).toEqual([21, 20, 19]);
    expect(groupVersionsByMajor(manifest.versions)[0]?.versions.map((item) => item.version)).toEqual([
      '21.1.2',
      '21.0.11',
    ]);
  });

  it('resolves latest and falls back for an invalid requested version', () => {
    expect(resolveRequestedVersion('latest', manifest)).toEqual({ version: '21.1.2', fallback: false });
    expect(resolveRequestedVersion('99.0.0', manifest)).toEqual({ version: '21.1.2', fallback: true });
  });

  it('preserves category, slug, tab, query and fragment while switching versions', () => {
    expect(buildVersionRoute('/v/21.1.2/components/button/api?mode=full#inputs', '20.1.2')).toBe(
      '/v/20.1.2/components/button/api?mode=full#inputs',
    );
  });

  it('builds docs URLs under the application base href', () => {
    expect(resolveDocsAssetUrl('https://example.test/sdcorejs-angular/', 'docs/versions.json')).toBe(
      'https://example.test/sdcorejs-angular/docs/versions.json',
    );
  });
});
