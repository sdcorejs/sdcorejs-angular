import type { ShowcaseChangelogRelease, ShowcaseChangelogSection } from '../generated/changelog.generated';
import { changelogEntriesForPage, changelogEntryTag, deriveReleaseBadges } from './docs-release-badges';

function section(
  title: string,
  texts: readonly string[],
  children: readonly ShowcaseChangelogSection[] = [],
  level = 3
): ShowcaseChangelogSection {
  return {
    key: title.toLowerCase(),
    title,
    level,
    anchor: title.toLowerCase(),
    markdown: '',
    items: texts.map(text => ({ text, ordered: false, children: [] })),
    children,
  };
}

function release(sections: readonly ShowcaseChangelogSection[]): ShowcaseChangelogRelease {
  return {
    id: 'release-3-1',
    title: '3.1',
    suffix: '3.1',
    date: '2026-10-10',
    anchor: 'release-3-1',
    unreleased: false,
    packageVersions: [],
    summaryMarkdown: '',
    markdown: '',
    sections,
  };
}

const pages = [
  { id: 'kanban', title: 'Kanban' },
  { id: 'button', title: 'Button' },
  { id: 'chip-calendar', title: 'Chip Calendar' },
  { id: 'file-explorer', title: 'File Explorer' },
  { id: 'select', title: 'Select' },
];

describe('release badges', () => {
  it('reads the "Name:" lead of a changelog entry', () => {
    expect(changelogEntryTag('Kanban: generic status columns')).toBe('kanban');
    expect(changelogEntryTag('Chip calendar: new inputs `minDate`')).toBe('chip calendar');
    expect(changelogEntryTag('Generic module (`@sdcorejs/angular/modules/generic`): list screens')).toBe('generic module');
    expect(changelogEntryTag('`SdWindow` / `sd-window` are the preferred public API.')).toBeNull();
  });

  it('marks Added pages New and Changed pages Updated, with New winning', () => {
    const badges = deriveReleaseBadges(
      release([
        section('Added', ['Kanban: generic status columns', 'File Explorer: typed metadata columns']),
        section('Changed', ['Button: outline neutral border', 'File Explorer: compact controls']),
        section('Changed (BREAKING for consumers)', ['Select: the select-all row moves']),
        section('Fixed', ['Chip calendar: keeps focus']),
      ]),
      pages
    );

    expect(badges.get('kanban')).toBe('new');
    expect(badges.get('file-explorer')).toBe('new');
    expect(badges.get('button')).toBe('updated');
    expect(badges.get('select')).toBe('updated');
    expect(badges.has('chip-calendar')).toBeFalse();
  });

  it('matches the longest page title that starts the entry tag', () => {
    const badges = deriveReleaseBadges(
      release([section('Changed', ['Button outline: neutral border', 'Chip calendar picker: new inputs', 'Theme: graphite preset'])]),
      [...pages, { id: 'chip', title: 'Chip' }]
    );

    expect(badges.get('button')).toBe('updated');
    expect(badges.get('chip-calendar')).toBe('updated');
    expect(badges.has('chip')).toBeFalse();
    expect(badges.size).toBe(2);
  });

  it('reads the page from "#### Name" subsections of the newer changelog format', () => {
    const current = release([
      section('Added', [], [section('Kanban', ['Generic status columns.'], [], 4)]),
      section('Changed (BREAKING for consumers)', [], [section('Button', ['Outline: neutral border.'], [], 4)]),
    ]);

    const badges = deriveReleaseBadges(current, pages);

    expect(badges.get('kanban')).toBe('new');
    expect(badges.get('button')).toBe('updated');
    expect(changelogEntriesForPage(current, pages[1], pages)).toEqual(['Outline: neutral border.']);
  });

  it('returns no badges without a release', () => {
    expect(deriveReleaseBadges(null, pages).size).toBe(0);
  });
});
