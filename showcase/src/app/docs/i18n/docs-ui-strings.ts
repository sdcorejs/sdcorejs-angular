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
}

export type DocsLanguage = 'en' | 'vi';

/** Replaces {name} holes with values; unknown holes stay as written. */
export function formatUiString(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (hole, name: string) => (values[name] === undefined ? hole : String(values[name])));
}
