import type { Type } from '@angular/core';
import type { ShowcaseExampleSourceKey } from '../generated/example-manifest.generated';

/** Stable URL slugs for the public documentation taxonomy. */
export const DOC_CATEGORIES = [
  'guides',
  'components',
  'forms',
  'directives',
  'services',
  'modules-integrations',
  'pipes-utilities',
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_CATEGORY_LABELS: Readonly<Record<DocCategory, string>> = {
  guides: 'Guides',
  components: 'Components',
  forms: 'Forms',
  directives: 'Directives',
  services: 'Services',
  'modules-integrations': 'Modules & Integrations',
  'pipes-utilities': 'Pipes & Utilities',
};

export function isDocCategory(value: string | null | undefined): value is DocCategory {
  return !!value && (DOC_CATEGORIES as readonly string[]).includes(value);
}

export type DocPageStatus = 'stable' | 'experimental' | 'deprecated';

export type DocTabId = 'overview' | 'styling' | 'api' | 'examples';

export interface DocTab {
  readonly id: DocTabId;
  readonly label: 'Overview' | 'Styling' | 'API' | 'Examples';
}

export type DocComponentLoader = () => Promise<Type<unknown>>;

/** A deep-linkable live example backed by a lazily loaded Angular component. */
export interface DocExample {
  readonly id: string;
  readonly sourceKey: ShowcaseExampleSourceKey;
  readonly sectionId: string | null;
  readonly title: string;
  readonly description: string;
  readonly activation: 'viewport' | 'interaction';
  readonly loadComponent: DocComponentLoader;
}

/** Canonical metadata for one component, form, or service documentation page. */
export interface DocPageDefinition {
  readonly id: string;
  readonly category: DocCategory;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly selector: string | null;
  readonly importPath: string;
  readonly publishedDocId: string | null;
  readonly keywords: readonly string[];
  readonly tabs: readonly DocTab[];
  readonly status: DocPageStatus;
  readonly sourcePath: string | null;
  readonly legacyPath: string;
  readonly legacyPaths?: readonly string[];
  readonly demoSectionCount: number;
  readonly examples: readonly DocExample[];
}

export interface DocNavigationGroup {
  readonly category: DocCategory;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly pages: readonly DocPageDefinition[];
}

/** Read-only registry contract consumed by routes, navigation, landing pages, and search. */
export interface DocsRegistry {
  readonly pages: readonly DocPageDefinition[];
  readonly groups: readonly DocNavigationGroup[];
}
