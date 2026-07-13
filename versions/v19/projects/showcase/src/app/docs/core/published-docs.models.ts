export interface DocsVersionEntry {
  version: string;
  index: string;
  released: string;
  count: number;
}

export interface DocsVersionsManifest {
  package: string;
  latest: string;
  baseUrl: string;
  versions: DocsVersionEntry[];
}

export interface DocsVersionGroup {
  major: number;
  label: string;
  versions: DocsVersionEntry[];
}

export interface PublishedDocIndexEntry {
  id: string;
  title: string;
  category: string;
  path: string;
  url: string;
}

export interface PublishedDocsIndex {
  package: string;
  version: string;
  released: string;
  baseUrl: string;
  count: number;
  docs: PublishedDocIndexEntry[];
}

export interface MarkdownSection {
  heading: string;
  level: number;
  id: string;
  markdown: string;
}

export interface ParsedMarkdownDocument {
  title: string;
  metadata: Record<string, string>;
  sections: MarkdownSection[];
  raw: string;
}

export type MarkdownBlock =
  | { kind: 'heading'; level: number; text: string; id: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export interface PublishedDocTabsViewModel {
  document: PublishedDocIndexEntry;
  parsed: ParsedMarkdownDocument;
  overview: MarkdownSection[];
  styling: MarkdownSection[];
  api: MarkdownSection[];
  examples: MarkdownSection[];
}
