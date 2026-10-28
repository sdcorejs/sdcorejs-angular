import type { DocExample, DocNavigationGroup, DocPageDefinition } from '../core/documentation.models';
import { DocsContentTranslation, EN_EXAMPLE_CONTENT, EN_PAGE_CONTENT } from './content.en';

const VIETNAMESE_LETTERS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

type ExampleTranslations = Readonly<Partial<Record<string, DocsContentTranslation>>>;
type PageTranslations = Readonly<Record<string, DocsContentTranslation>>;

/** Vietnamese is told apart by its diacritics; text without them reads as English. */
export function hasVietnameseText(text: string): boolean {
  return VIETNAMESE_LETTERS.test(text);
}

/** The note scripts/generate-showcase-example-sources.mjs writes for a <demo-section> without a `note`. */
export function generatedExampleDescription(title: string): string {
  return `Existing “${title}” scenario preserved from the showcase.`;
}

/** English title and note of an example; the source object when there is no translation. */
export function localizeDocExample(example: DocExample, translations: ExampleTranslations = EN_EXAMPLE_CONTENT): DocExample {
  const english = translations[example.sourceKey];
  if (!english) return example;
  const title = english.title ?? example.title;
  const generated = example.description === generatedExampleDescription(example.title);
  const description = english.description ?? (generated ? generatedExampleDescription(title) : example.description);
  return { ...example, title, description };
}

/** English title, description and examples of a page; the source object when nothing is translated. */
export function localizeDocPage(
  page: DocPageDefinition,
  pageTranslations: PageTranslations = EN_PAGE_CONTENT,
  exampleTranslations: ExampleTranslations = EN_EXAMPLE_CONTENT
): DocPageDefinition {
  const english = pageTranslations[page.id];
  const examples = page.examples.map(example => localizeDocExample(example, exampleTranslations));
  if (!english && examples.every((example, index) => example === page.examples[index])) return page;
  return {
    ...page,
    title: english?.title ?? page.title,
    description: english?.description ?? page.description,
    examples,
  };
}

/** The registry seen in EN mode. Page and group objects are built once, so switching languages keeps identities stable. */
export interface LocalizedDocsContent {
  readonly pages: readonly DocPageDefinition[];
  readonly pagesById: ReadonlyMap<string, DocPageDefinition>;
  readonly groups: readonly DocNavigationGroup[];
}

export function localizeDocsContent(pages: readonly DocPageDefinition[], groups: readonly DocNavigationGroup[]): LocalizedDocsContent {
  const localized = pages.map(page => localizeDocPage(page));
  const pagesById = new Map(localized.map(page => [page.id, page]));
  return {
    pages: localized,
    pagesById,
    groups: groups.map(group => ({ ...group, pages: group.pages.map(page => pagesById.get(page.id) ?? page) })),
  };
}
