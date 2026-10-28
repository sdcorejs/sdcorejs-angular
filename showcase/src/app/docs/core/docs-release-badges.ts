import type { ShowcaseChangelogListItem, ShowcaseChangelogRelease, ShowcaseChangelogSection } from '../generated/changelog.generated';
import { foldSearchText } from './docs-search.utils';

export type DocsReleaseBadge = 'new' | 'updated';

interface BadgeTarget {
  readonly id: string;
  readonly title: string;
}

/** A changelog item and the "#### Name" subsection it sits under; heading is null for an item directly in the section. */
export interface ChangelogSectionItem {
  readonly heading: string | null;
  readonly item: ShowcaseChangelogListItem;
}

/**
 * Items of a "### Added"-style section. Older releases lead each item with "Name:"; newer ones group items under
 * "#### Name" subsections, whose title then names the page.
 */
export function changelogSectionItems(section: ShowcaseChangelogSection): ChangelogSectionItem[] {
  return [
    ...section.items.map(item => ({ heading: null, item })),
    ...section.children.flatMap(child => changelogSectionItems(child).map(({ item }) => ({ heading: child.title, item }))),
  ];
}

function toTag(lead: string): string | null {
  return foldSearchText(lead.replace(/\s*\(.*\)\s*$/, '')).replace(/[^a-z0-9]+/g, ' ').trim() || null;
}

function entryLead(text: string): string | null {
  const match = /^\s*([^:\n]{2,80}?):\s/.exec(text);
  return !match || match[1].trimStart().startsWith('`') ? null : match[1];
}

/** "Avatar: `sd-avatar-group` …" → "avatar"; entries without a "Name:" lead are not tied to a page. */
export function changelogEntryTag(text: string): string | null {
  const lead = entryLead(text);
  return lead ? toTag(lead) : null;
}

/** Tags of an entry; a combined lead or heading ("Select, Autocomplete") names each of its pages. */
function entryTags({ heading, item }: ChangelogSectionItem): string[] {
  const lead = heading ?? entryLead(item.text);
  return lead ? lead.split(/\s*[,&]\s*/).flatMap(part => toTag(part) ?? []) : [];
}

function pagesByTag(pages: readonly BadgeTarget[]): ReadonlyMap<string, readonly string[]> {
  const byTag = new Map<string, string[]>();
  for (const page of pages) {
    const tag = foldSearchText(page.title).replace(/[^a-z0-9]+/g, ' ').trim();
    byTag.set(tag, [...(byTag.get(tag) ?? []), page.id]);
  }
  return byTag;
}

function entryPageIds(entry: ChangelogSectionItem, byTag: ReadonlyMap<string, readonly string[]>): string[] {
  return entryTags(entry).flatMap(tag => byTag.get(matchPageTag(tag, byTag)) ?? []);
}

function badgeForSection(section: ShowcaseChangelogSection): DocsReleaseBadge | null {
  const title = section.title.trim().toLowerCase();
  if (title.startsWith('added')) return 'new';
  if (title.startsWith('changed')) return 'updated';
  return null;
}

/**
 * Sidebar badges for one release: pages named by an entry under "### Added" are New, pages under "### Changed"
 * (including "Changed (BREAKING for consumers)") are Updated. New wins when a page appears in both.
 */
export function deriveReleaseBadges(
  release: ShowcaseChangelogRelease | null | undefined,
  pages: readonly BadgeTarget[]
): ReadonlyMap<string, DocsReleaseBadge> {
  const badges = new Map<string, DocsReleaseBadge>();
  if (!release) return badges;
  const byTag = pagesByTag(pages);

  for (const section of release.sections) {
    const badge = badgeForSection(section);
    if (!badge) continue;
    for (const entry of changelogSectionItems(section)) {
      for (const id of entryPageIds(entry, byTag)) {
        if (badges.get(id) !== 'new') badges.set(id, badge);
      }
    }
  }
  return badges;
}

/** Changelog entries of one release that name a page, in changelog order; the "Name:" lead is dropped. */
export function changelogEntriesForPage(
  release: ShowcaseChangelogRelease | null | undefined,
  page: BadgeTarget,
  pages: readonly BadgeTarget[]
): readonly string[] {
  if (!release) return [];
  const byTag = pagesByTag(pages);
  const entries: string[] = [];
  for (const section of release.sections) {
    if (!badgeForSection(section)) continue;
    for (const entry of changelogSectionItems(section)) {
      if (entryPageIds(entry, byTag).includes(page.id)) {
        entries.push(entry.heading ? entry.item.text : entry.item.text.replace(/^\s*[^:\n]{2,80}?:\s+/, ''));
      }
    }
  }
  return entries;
}

/** Page id for an entry's "#### Name" subsection or "Name:" lead (longest title match; the first of a combined one), or null. */
export function pageIdForEntry(entry: ChangelogSectionItem, pages: readonly BadgeTarget[]): string | null {
  return entryPageIds(entry, pagesByTag(pages))[0] ?? null;
}

/** Longest page title that starts the tag on a word boundary: "button outline" → "button", "tab router" → "tab router". */
function matchPageTag(tag: string, byTag: ReadonlyMap<string, readonly string[]>): string {
  const words = tag.split(' ');
  for (let length = words.length; length > 0; length -= 1) {
    const candidate = words.slice(0, length).join(' ');
    if (byTag.has(candidate)) return candidate;
  }
  return tag;
}
