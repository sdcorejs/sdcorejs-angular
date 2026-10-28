import { DOC_PAGES } from '../../core/documentation.registry';
import type { ShowcaseChangelogRelease, ShowcaseChangelogSection } from '../../generated/changelog.generated';
import { changeTypeOf, changelogGroups, compareUrl, migrationsOf, releaseRail } from './changelog-view';

function section(
  title: string,
  texts: readonly string[],
  markdown = '',
  children: readonly ShowcaseChangelogSection[] = []
): ShowcaseChangelogSection {
  return {
    key: title.toLowerCase(),
    title,
    level: 3,
    anchor: title.toLowerCase(),
    markdown,
    items: texts.map(text => ({ text, ordered: false, children: [] })),
    children,
  };
}

function release(suffix: string | null, sections: readonly ShowcaseChangelogSection[] = []): ShowcaseChangelogRelease {
  return {
    id: suffix ? `release-${suffix}` : 'unreleased',
    title: suffix ?? 'Unreleased',
    suffix,
    date: '2026-10-10',
    anchor: suffix ?? 'unreleased',
    unreleased: !suffix,
    packageVersions: [],
    summaryMarkdown: '',
    markdown: '',
    sections,
  };
}

describe('changelog view', () => {
  it('maps changelog headings to the filter types', () => {
    expect(changeTypeOf('Added')).toBe('added');
    expect(changeTypeOf('Changed (BREAKING for consumers)')).toBe('breaking');
    expect(changeTypeOf('Removed')).toBe('breaking');
    expect(changeTypeOf('Deprecated')).toBe('changed');
    expect(changeTypeOf('Security')).toBe('fixed');
    expect(changeTypeOf('Release tooling')).toBe('tooling');
    expect(changeTypeOf('Migration notes')).toBe('other');
  });

  it('groups entries by type, tags them and links tags that name a page', () => {
    const groups = changelogGroups(
      release('3.1', [
        section('Fixed', ['Kanban: keeps focus']),
        section('Added', ['Kanban: generic status columns', 'Tooling note without lead']),
        section('Changed (BREAKING for consumers)', ['Button outline: new border'], '```diff\n- selector: {}\n+ selector: { mode: "picker" }\n```'),
      ]),
      DOC_PAGES
    );

    expect(groups.map(group => group.type)).toEqual(['breaking', 'added', 'fixed']);
    expect(groups[1].entries[0]).toEqual({ tag: 'Kanban', pageId: DOC_PAGES.find(page => page.title === 'Kanban')?.id ?? null, markdown: 'Generic status columns' });
    expect(groups[1].entries[1].tag).toBeNull();
    expect(groups[0].entries[0].pageId).toBe(DOC_PAGES.find(page => page.slug === 'button')?.id ?? null);
    expect(groups[0].migrations).toEqual([{ before: ['selector: {}'], after: ['selector: { mode: "picker" }'] }]);
  });

  it('tags entries with their "#### Name" subsection in the newer changelog format', () => {
    const groups = changelogGroups(
      release(null, [
        section('Added', [], '#### Kanban\n\n- Generic status columns: one per status.', [
          section('Kanban', ['Generic status columns: one per status.']),
        ]),
      ]),
      DOC_PAGES
    );

    expect(groups[0].entries).toEqual([
      { tag: 'Kanban', pageId: DOC_PAGES.find(page => page.title === 'Kanban')?.id ?? null, markdown: 'Generic status columns: one per status.' },
    ]);
  });

  it('reads before/after rows from diff blocks', () => {
    expect(migrationsOf('text\n```diff\n-a\n+b\n context\n```')).toEqual([{ before: ['a'], after: ['b'] }]);
    expect(migrationsOf('```ts\n-a\n```')).toEqual([]);
  });

  it('builds the release rail newest first, grouped by first digit, without Unreleased', () => {
    const rail = releaseRail([release(null), release('2.15'), release('3.0'), release('2.9'), release('3.1'), release('1.6')]);

    expect(rail.map(group => [group.label, group.releases.map(item => item.suffix)])).toEqual([
      ['3.x', ['3.1', '3.0']],
      ['2.x', ['2.15', '2.9']],
      ['1.x', ['1.6']],
    ]);
  });

  it('links the source diff from the previous release', () => {
    const releases = [release('3.1'), release('3.0'), release('2.15')];

    expect(compareUrl(releases[0], releases)).toBe('https://github.com/sdcorejs/sdcorejs-angular/compare/v3.0...v3.1');
    expect(compareUrl(releases[2], releases)).toBeNull();
  });
});
