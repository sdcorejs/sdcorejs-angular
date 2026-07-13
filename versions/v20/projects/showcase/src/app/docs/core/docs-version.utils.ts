import { DocsVersionEntry, DocsVersionGroup, DocsVersionsManifest } from './published-docs.models';

interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: readonly string[];
}

export interface ResolvedDocsVersion {
  version: string;
  fallback: boolean;
}

function parseSemanticVersion(value: string): SemanticVersion {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value.trim());
  if (!match) {
    return { major: -1, minor: -1, patch: -1, prerelease: [value] };
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  };
}

function comparePrerelease(left: readonly string[], right: readonly string[]): number {
  if (!left.length && right.length) return 1;
  if (left.length && !right.length) return -1;

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) - Number(b);
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}

export function compareSemanticVersions(left: string, right: string): number {
  const a = parseSemanticVersion(left);
  const b = parseSemanticVersion(right);
  const numeric = a.major - b.major || a.minor - b.minor || a.patch - b.patch;
  if (numeric !== 0) return numeric;
  return comparePrerelease(a.prerelease, b.prerelease);
}

export function sortVersionsDescending(versions: readonly string[]): string[] {
  return [...versions].sort((left, right) => compareSemanticVersions(right, left));
}

export function groupVersionsByMajor(entries: readonly DocsVersionEntry[]): DocsVersionGroup[] {
  const groups = new Map<number, DocsVersionEntry[]>();
  for (const entry of entries) {
    const major = parseSemanticVersion(entry.version).major;
    if (major < 0) continue;
    groups.set(major, [...(groups.get(major) ?? []), entry]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right - left)
    .map(([major, versions]) => ({
      major,
      label: `${major}.x`,
      versions: [...versions].sort((left, right) => compareSemanticVersions(right.version, left.version)),
    }));
}

export function resolveRequestedVersion(requested: string | null | undefined, manifest: DocsVersionsManifest): ResolvedDocsVersion {
  const normalized = requested?.trim();
  if (!normalized || normalized === 'latest') {
    return { version: manifest.latest, fallback: false };
  }

  const found = manifest.versions.some(entry => entry.version === normalized);
  return found ? { version: normalized, fallback: false } : { version: manifest.latest, fallback: true };
}

export function buildVersionRoute(currentUrl: string, targetVersion: string): string {
  const match = /^(?<path>[^?#]*)(?<query>\?[^#]*)?(?<fragment>#.*)?$/.exec(currentUrl);
  const path = match?.groups?.['path'] ?? '/';
  const query = match?.groups?.['query'] ?? '';
  const fragment = match?.groups?.['fragment'] ?? '';
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'about') return `${path || '/about'}${query}${fragment}`;

  if (segments[0] === 'v') {
    segments[1] = targetVersion;
  } else if (segments[0] === 'components' || segments[0] === 'forms' || segments[0] === 'services') {
    segments.unshift('v', targetVersion);
    if (segments.length === 4) segments.push('overview');
  } else {
    return `/v/${targetVersion}${query}${fragment}`;
  }

  return `/${segments.join('/')}${query}${fragment}`;
}

export function resolveDocsAssetUrl(baseUri: string, relativePath: string): string {
  return new URL(relativePath.replace(/^\/+/, ''), baseUri).toString();
}
