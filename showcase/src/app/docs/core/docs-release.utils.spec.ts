import {
  DocsRelease,
  angularMajorOfVersion,
  buildReleaseCatalog,
  groupReleasesForMenu,
  packageVersionFor,
  releaseOfVersion,
  resolveAngularMajorForRelease,
  resolveLatestVersion,
  selectMenuReleases,
} from './docs-release.utils';
import { DocsVersionsManifest } from './published-docs.models';

function entry(version: string, released = '2026-01-01') {
  return { version, index: 'ignored', released, count: 1 };
}

/** The real shape: Angular 22 starts at release 2.5, 19/20/21 ship every release since 1.2. */
const manifest: DocsVersionsManifest = {
  package: '@sdcorejs/angular',
  latest: '22.3.2',
  baseUrl: 'ignored',
  versions: [
    ...['3.2', '3.1', '3.0', '2.15', '2.14', '2.13', '2.12', '2.11', '2.5'].map(release =>
      entry(`22.${release}`, release === '3.2' ? '2026-10-23' : release === '3.1' ? '2026-10-10' : '2026-09-01')
    ),
    ...[21, 20, 19].flatMap(major =>
      ['3.2', '3.1', '3.0', '2.15', '2.14', '2.13', '2.12', '2.11', '2.5', '2.4', '1.6', '1.5', '1.2'].map(release =>
        entry(`${major}.${release}`)
      )
    ),
  ],
};

describe('release and Angular major model', () => {
  it('splits a package version into release and Angular major', () => {
    expect(releaseOfVersion('22.3.1')).toBe('3.1');
    expect(releaseOfVersion('21.2.15')).toBe('2.15');
    expect(angularMajorOfVersion('22.3.1')).toBe(22);
    expect(releaseOfVersion('latest')).toBe('');
    expect(angularMajorOfVersion('latest')).toBe(-1);
  });

  it('derives the package version as <ng>.<release>', () => {
    expect(packageVersionFor(22, '3.1')).toBe('22.3.1');
    expect(packageVersionFor(19, '2.15')).toBe('19.2.15');
  });

  it('builds one release per suffix, newest first, with the majors that publish it', () => {
    const catalog = buildReleaseCatalog(manifest);

    expect(catalog.map(release => release.id).slice(0, 4)).toEqual(['3.2', '3.1', '3.0', '2.15']);
    expect(catalog.at(-1)?.id).toBe('1.2');
    expect(catalog[0]).toEqual(
      jasmine.objectContaining({ id: '3.2', group: '3.x', latest: true, released: '2026-10-23', majors: [22, 21, 20, 19] })
    );
    expect(catalog.find(release => release.id === '1.6')?.majors).toEqual([21, 20, 19]);
    expect(catalog.filter(release => release.latest).length).toBe(1);
  });

  it('marks every published combination and only those', () => {
    const catalog = buildReleaseCatalog(manifest);
    const published = new Set(manifest.versions.map(item => item.version));

    for (const release of catalog) {
      for (const major of [22, 21, 20, 19]) {
        expect(release.majors.includes(major)).withContext(`${major}.${release.id}`).toBe(published.has(packageVersionFor(major, release.id)));
      }
    }
  });

  it('keeps the Angular major when the new release publishes it, else falls back to the highest available', () => {
    const catalog = buildReleaseCatalog(manifest);
    const release = (id: string) => catalog.find(item => item.id === id) as DocsRelease;

    expect(resolveAngularMajorForRelease(release('3.1'), 20)).toBe(20);
    expect(resolveAngularMajorForRelease(release('2.11'), 22)).toBe(22);
    expect(resolveAngularMajorForRelease(release('1.6'), 22)).toBe(21);
    expect(resolveAngularMajorForRelease(release('1.6'), null)).toBe(21);
    expect(resolveAngularMajorForRelease(release('3.2'), null)).toBe(22);
  });

  it('resolves latest to the latest release in the preferred Angular major', () => {
    expect(resolveLatestVersion(manifest, null)).toBe('22.3.2');
    expect(resolveLatestVersion(manifest, 19)).toBe('19.3.2');
    expect(resolveLatestVersion(manifest, 17)).toBe('22.3.2');
  });

  it('shows at most 8 releases and always keeps the newest of each group', () => {
    const catalog = buildReleaseCatalog(manifest);
    const menu = selectMenuReleases(catalog, '3.2');

    expect(menu.map(release => release.id)).toEqual(['3.2', '3.1', '3.0', '2.15', '2.14', '2.13', '2.12', '1.6']);
  });

  it('keeps the current release in the menu even when it is outside the newest 8', () => {
    const catalog = buildReleaseCatalog(manifest);
    const menu = selectMenuReleases(catalog, '2.4');

    expect(menu.length).toBe(8);
    expect(menu.map(release => release.id)).toContain('2.4');
    expect(menu.map(release => release.id)).toContain('1.6');
    expect(menu.map(release => release.id)).not.toContain('2.12');
  });

  it('groups menu releases by their first digit', () => {
    const groups = groupReleasesForMenu(selectMenuReleases(buildReleaseCatalog(manifest), '3.2'));

    expect(groups.map(group => group.label)).toEqual(['3.x', '2.x', '1.x']);
    expect(groups[1].releases.map(release => release.id)).toEqual(['2.15', '2.14', '2.13', '2.12']);
  });
});
