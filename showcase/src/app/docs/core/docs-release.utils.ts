import { DocsVersionsManifest } from './published-docs.models';

/**
 * One release suffix (3.1, 2.15…). Each release ships as <ng>.<release> for every Angular major that publishes it;
 * Angular 22 starts at 2.5, so older releases list 21/20/19 only.
 */
export interface DocsRelease {
  readonly id: string;
  /** First-digit group shown in the menu and on the changelog rail, e.g. '3.x'. */
  readonly group: string;
  readonly released: string;
  /** Published Angular majors, highest first. */
  readonly majors: readonly number[];
  readonly latest: boolean;
}

export interface DocsReleaseGroup {
  readonly label: string;
  readonly releases: readonly DocsRelease[];
}

/** The Release menu never lists more than this many releases. */
export const RELEASE_MENU_LIMIT = 8;

const PACKAGE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

export function releaseOfVersion(version: string): string {
  const match = PACKAGE_VERSION.exec(version.trim());
  return match ? `${match[2]}.${match[3]}` : '';
}

export function angularMajorOfVersion(version: string): number {
  const match = PACKAGE_VERSION.exec(version.trim());
  return match ? Number(match[1]) : -1;
}

export function packageVersionFor(angularMajor: number, release: string): string {
  return `${angularMajor}.${release}`;
}

export function compareReleases(left: string, right: string): number {
  const [leftMajor = 0, leftMinor = 0] = left.split('.').map(Number);
  const [rightMajor = 0, rightMinor = 0] = right.split('.').map(Number);
  return leftMajor - rightMajor || leftMinor - rightMinor;
}

export function releaseGroupOf(release: string): string {
  return `${release.split('.')[0]}.x`;
}

/** Collapses the per-package manifest into releases, newest first. */
export function buildReleaseCatalog(manifest: DocsVersionsManifest): DocsRelease[] {
  const byRelease = new Map<string, { majors: Set<number>; released: string; releasedMajor: number }>();
  for (const entry of manifest.versions) {
    const release = releaseOfVersion(entry.version);
    const major = angularMajorOfVersion(entry.version);
    if (!release || major < 0) continue;
    const current = byRelease.get(release) ?? { majors: new Set<number>(), released: '', releasedMajor: -1 };
    current.majors.add(major);
    // why: the date of the highest major is the release date shown in the menu and on the changelog card.
    if (major > current.releasedMajor) {
      current.released = entry.released;
      current.releasedMajor = major;
    }
    byRelease.set(release, current);
  }

  const latestRelease = releaseOfVersion(manifest.latest);
  return [...byRelease.entries()]
    .sort(([left], [right]) => compareReleases(right, left))
    .map(([id, value], index) => ({
      id,
      group: releaseGroupOf(id),
      released: value.released,
      majors: [...value.majors].sort((left, right) => right - left),
      latest: latestRelease ? id === latestRelease : index === 0,
    }));
}

/** Keeps the Angular major when the release publishes it; otherwise picks the highest published major. */
export function resolveAngularMajorForRelease(release: DocsRelease, preferredMajor: number | null | undefined): number {
  if (preferredMajor != null && release.majors.includes(preferredMajor)) return preferredMajor;
  return release.majors[0] ?? -1;
}

/** Package version for "latest": the latest release in the preferred Angular major, when it publishes one. */
export function resolveLatestVersion(manifest: DocsVersionsManifest, preferredMajor: number | null | undefined): string {
  const latest = buildReleaseCatalog(manifest).find(release => release.latest);
  if (!latest) return manifest.latest;
  const major = preferredMajor != null && latest.majors.includes(preferredMajor) ? preferredMajor : angularMajorOfVersion(manifest.latest);
  return latest.majors.includes(major) ? packageVersionFor(major, latest.id) : manifest.latest;
}

/**
 * Picks the releases of the Release menu: the newest release of each group always stays, the remaining slots go to
 * the newest releases, and the current release replaces the oldest of those when it would fall outside the limit.
 */
export function selectMenuReleases(catalog: readonly DocsRelease[], currentRelease: string | null, limit = RELEASE_MENU_LIMIT): DocsRelease[] {
  const heads = new Set<DocsRelease>();
  const seenGroups = new Set<string>();
  for (const release of catalog) {
    if (seenGroups.has(release.group)) continue;
    seenGroups.add(release.group);
    heads.add(release);
  }

  const picked = new Set<DocsRelease>([...heads].slice(0, limit));
  const fill: DocsRelease[] = [];
  for (const release of catalog) {
    if (picked.size + fill.length >= limit) break;
    if (!picked.has(release)) fill.push(release);
  }
  const current = catalog.find(release => release.id === currentRelease);
  if (current && !picked.has(current) && !fill.includes(current)) {
    if (picked.size + fill.length >= limit) fill.pop();
    fill.push(current);
  }

  const selected = new Set([...picked, ...fill]);
  return catalog.filter(release => selected.has(release));
}

export function groupReleasesForMenu(releases: readonly DocsRelease[]): DocsReleaseGroup[] {
  const groups: { label: string; releases: DocsRelease[] }[] = [];
  for (const release of releases) {
    const group = groups.find(item => item.label === release.group);
    if (group) group.releases.push(release);
    else groups.push({ label: release.group, releases: [release] });
  }
  return groups;
}
