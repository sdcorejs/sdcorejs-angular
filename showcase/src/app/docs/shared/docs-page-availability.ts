import type { DocPageDefinition } from '../core/documentation.models';

export type DocsPageAvailability = 'unknown' | 'published' | 'live-demo' | 'unavailable';

/** Classifies a registry page against the selected version's published-document index. */
export function resolveDocsPageAvailability(page: DocPageDefinition, publishedDocIds: ReadonlySet<string> | null): DocsPageAvailability {
  if (!page.publishedDocId) return page.examples.length ? 'live-demo' : 'unavailable';
  if (!publishedDocIds) return 'unknown';
  if (publishedDocIds.has(page.publishedDocId)) return 'published';
  return page.examples.length ? 'live-demo' : 'unavailable';
}
