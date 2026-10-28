import { changelogSectionItems, pageIdForEntry } from '../../core/docs-release-badges';
import { compareReleases } from '../../core/docs-release.utils';
import { DocPageDefinition } from '../../core/documentation.models';
import type { ShowcaseChangelogListItem, ShowcaseChangelogRelease } from '../../generated/changelog.generated';

export type ChangeType = 'added' | 'changed' | 'breaking' | 'fixed' | 'tooling' | 'other';

// why: CHANGELOG.md lists consumer-breaking sections first; the page and its filters keep that order.
export const CHANGE_TYPE_ORDER: readonly ChangeType[] = ['breaking', 'added', 'changed', 'fixed', 'tooling', 'other'];

export interface ChangelogEntry {
  /** Lead before the first colon ("Kanban"), shown as a tag; null when the entry has none. */
  readonly tag: string | null;
  /** Docs page the tag names, for a link; null when no page matches. */
  readonly pageId: string | null;
  readonly markdown: string;
}

export interface ChangelogMigration {
  readonly before: readonly string[];
  readonly after: readonly string[];
}

export interface ChangelogGroup {
  readonly type: ChangeType;
  readonly entries: readonly ChangelogEntry[];
  readonly migrations: readonly ChangelogMigration[];
}

/** "Changed (BREAKING for consumers)" → breaking, "Release tooling" → tooling, Deprecated → changed… */
export function changeTypeOf(title: string): ChangeType {
  const value = title.toLowerCase();
  if (value.includes('breaking') || value.startsWith('removed')) return 'breaking';
  if (value.startsWith('added')) return 'added';
  if (value.startsWith('changed') || value.startsWith('deprecated')) return 'changed';
  if (value.startsWith('fixed') || value.startsWith('security')) return 'fixed';
  if (value.includes('tooling')) return 'tooling';
  return 'other';
}

function capitalize(text: string): string {
  return /^[a-z]/.test(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function itemMarkdown(item: ShowcaseChangelogListItem, depth = 0): string {
  const children = item.children.map(child => `${'  '.repeat(depth)}- ${itemMarkdown(child, depth + 1)}`);
  return [item.text, ...children].join('\n');
}

/** Before/after rows from ```diff blocks: "-" lines are before, "+" lines are after. */
export function migrationsOf(markdown: string): ChangelogMigration[] {
  const migrations: ChangelogMigration[] = [];
  for (const match of markdown.matchAll(/```diff\s*\n([\s\S]*?)```/g)) {
    const lines = match[1].split(/\r?\n/);
    const before = lines.filter(line => line.startsWith('-')).map(line => line.slice(1).trim());
    const after = lines.filter(line => line.startsWith('+')).map(line => line.slice(1).trim());
    if (before.length || after.length) migrations.push({ before, after });
  }
  return migrations;
}

/** Entries of one release grouped by change type, in the filter order. */
export function changelogGroups(release: ShowcaseChangelogRelease, pages: readonly DocPageDefinition[]): ChangelogGroup[] {
  const groups = new Map<ChangeType, { entries: ChangelogEntry[]; migrations: ChangelogMigration[] }>();
  for (const section of release.sections) {
    const type = changeTypeOf(section.title);
    const group = groups.get(type) ?? { entries: [], migrations: [] };
    for (const entry of changelogSectionItems(section)) {
      const tagMatch = entry.heading ? null : /^\s*([^:\n`]{2,60}?):\s/.exec(entry.item.text);
      const markdown = itemMarkdown(entry.item);
      group.entries.push({
        tag: entry.heading ?? (tagMatch ? tagMatch[1].trim() : null),
        pageId: pageIdForEntry(entry, pages),
        markdown: tagMatch ? capitalize(markdown.slice(tagMatch[0].length)) : markdown,
      });
    }
    group.migrations.push(...migrationsOf(section.markdown));
    if (group.entries.length || group.migrations.length) groups.set(type, group);
  }
  return CHANGE_TYPE_ORDER.flatMap(type => {
    const group = groups.get(type);
    return group ? [{ type, ...group }] : [];
  });
}

/** Released (not Unreleased) entries, newest first, grouped by first digit for the release rail. */
export function releaseRail(releases: readonly ShowcaseChangelogRelease[]): { label: string; releases: ShowcaseChangelogRelease[] }[] {
  const released = releases
    .filter(release => !release.unreleased && release.suffix)
    .sort((left, right) => compareReleases(right.suffix!, left.suffix!));
  const groups: { label: string; releases: ShowcaseChangelogRelease[] }[] = [];
  for (const release of released) {
    const label = `${release.suffix!.split('.')[0]}.x`;
    const group = groups.find(item => item.label === label);
    if (group) group.releases.push(release);
    else groups.push({ label, releases: [release] });
  }
  return groups;
}

/** GitHub compare link from the previous release tag to this one. */
export function compareUrl(release: ShowcaseChangelogRelease, releases: readonly ShowcaseChangelogRelease[]): string | null {
  const ordered = releases
    .filter(item => !item.unreleased && item.suffix)
    .sort((left, right) => compareReleases(right.suffix!, left.suffix!));
  const index = ordered.findIndex(item => item.suffix === release.suffix);
  const previous = index >= 0 ? ordered[index + 1] : undefined;
  return previous ? `https://github.com/sdcorejs/sdcorejs-angular/compare/v${previous.suffix}...v${release.suffix}` : null;
}
