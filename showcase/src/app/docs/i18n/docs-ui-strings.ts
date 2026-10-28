import type { DocCategory } from '../core/documentation.models';

/** UI strings of the docs site chrome. Content (published Markdown, registry text) is not translated here. */
export interface DocsUiStrings {
  readonly docs: string;
  readonly changelog: string;
  readonly about: string;
  readonly primaryNavigation: string;
  readonly skipToContent: string;
  readonly brandHome: string;
  readonly openMenu: string;
  readonly closeMenu: string;
  readonly search: string;
  readonly release: string;
  readonly angular: string;
  readonly latest: string;
  readonly versionHint: string;
  readonly releaseMenu: string;
  readonly angularMenu: string;
  readonly package: string;
  readonly unavailable: string;
  readonly copy: string;
  readonly copied: string;
  readonly copiedAnnouncement: string;
  readonly copyFailed: string;
  readonly copyInstall: string;
  readonly loadingVersions: string;
  readonly retryVersions: string;
  readonly notLatest: string;
  readonly goLatest: string;
  readonly languageGroup: string;
  readonly switchLanguage: string;
  readonly themeToDark: string;
  readonly themeToLight: string;
  readonly github: string;
  readonly catalog: string;
  readonly docsPages: string;
  readonly filterPages: string;
  readonly pagesMatching: string;
  readonly noResults: string;
  readonly badgeNew: string;
  readonly badgeUpdated: string;
  readonly liveDemo: string;
  readonly categories: Readonly<Record<DocCategory, string>>;
  readonly pageTypes: Readonly<Record<DocCategory, string>>;
  readonly breadcrumb: string;
  readonly updatedIn: string;
  readonly newIn: string;
  readonly selector: string;
  readonly importPath: string;
  readonly className: string;
  readonly providedIn: string;
  readonly copyValue: string;
  readonly identity: string;
  readonly sections: string;
  readonly tabs: Readonly<Record<'overview' | 'styling' | 'api' | 'examples', string>>;
  readonly onThisPage: string;
  readonly editPage: string;
  readonly reportIssue: string;
  readonly backToTop: string;
  readonly viewDemoSource: string;
  readonly previous: string;
  readonly next: string;
  readonly pagination: string;
  readonly changedIn: string;
  readonly fullChangelog: string;
  readonly quickStart: string;
  readonly defaultValue: string;
  readonly filterApi: string;
  readonly entries: string;
  readonly notTranslated: string;
  readonly options: string;
  readonly sharedOption: string;
  readonly showShared: string;
  readonly hideShared: string;
  readonly methods: string;
  readonly copyLink: string;
  readonly showCode: string;
  readonly hideCode: string;
}

export type DocsLanguage = 'en' | 'vi';

/** Catalog keys that hold a plain string (and may carry {name} holes). */
export type DocsUiTextKey = { [K in keyof DocsUiStrings]: DocsUiStrings[K] extends string ? K : never }[keyof DocsUiStrings];

/** Replaces {name} holes with values; unknown holes stay as written. */
export function formatUiString(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (hole, name: string) => (values[name] === undefined ? hole : String(values[name])));
}
