import { foldSearchText } from './docs-search.utils';
import { toMarkdownBlocks } from './markdown-parser';

export interface ApiTypeChip {
  readonly text: string;
  /** String literals use the string colour; everything else the type colour. */
  readonly literal: boolean;
}

/** One member of an API table (input, output, slot, token, field…), as shown in the API row pattern. */
export interface ApiRow {
  /** Stable deep-link id: api-<group>-<name>. */
  readonly id: string;
  readonly name: string;
  readonly types: readonly ApiTypeChip[];
  /** Extra pill after the types, e.g. booleanAttribute. */
  readonly flag: string | null;
  readonly defaultValue: string | null;
  /** Description as inline Markdown. */
  readonly description: string;
}

const NAME_HEADERS = /^(name|input|inputs|output|outputs|member|field|param|parameter|method|slot|token|custom property|attribute|symbol|key|property|option)$/;
const TYPE_HEADERS = /^(type|type \/ default|signature|payload|kind|returns?|trả về|values|accepted values)$/;
const DEFAULT_HEADERS = /^default/;
const DESCRIPTION_HEADERS = /^(notes?|description|purpose|behavior|behaviour|meaning|effect|use for|where it renders)$/;
const EMPTY_VALUE = /^(?:—|–|-|n\/a)?$/i;

function plainHeader(header: string): string {
  return header.replace(/[`*]/g, '').trim().toLowerCase();
}

function stripCode(value: string): string {
  return value.replace(/`/g, '').trim();
}

/** An API table names members in its first column and describes their type, default or purpose. */
export function isApiTable(headers: readonly string[]): boolean {
  const plain = headers.map(plainHeader);
  return (
    plain.length >= 2 &&
    NAME_HEADERS.test(plain[0] ?? '') &&
    plain.slice(1).some(header => TYPE_HEADERS.test(header) || DEFAULT_HEADERS.test(header) || DESCRIPTION_HEADERS.test(header))
  );
}

/** Splits a type on top-level `|`, ignoring unions nested in (), <>, [] or {} and inside quotes. */
export function splitUnion(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const character of type) {
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if ('(<[{'.includes(character)) {
      depth += 1;
    } else if (')>]}'.includes(character)) {
      depth = Math.max(0, depth - 1);
    } else if (character === '|' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }
  parts.push(current.trim());
  return parts.filter(Boolean);
}

/** Type chips from a type cell: the first code span (or the whole cell) split into union members. */
export function typeChips(cell: string): ApiTypeChip[] {
  const code = /`([^`]+)`/.exec(cell)?.[1] ?? stripCode(cell);
  if (EMPTY_VALUE.test(code.trim())) return [];
  return splitUnion(code).map(text => ({ text, literal: /^['"`]/.test(text) }));
}

/** Names that a "uses `booleanAttribute`" note lists, e.g. "`disabled`, `loading` use `booleanAttribute`". */
export function booleanAttributeNames(markdown: string): ReadonlySet<string> {
  const names = new Set<string>();
  for (const block of toMarkdownBlocks(markdown)) {
    const text = block.kind === 'paragraph' || block.kind === 'quote' ? block.text : '';
    if (!text.includes('booleanAttribute')) continue;
    for (const match of text.matchAll(/`([A-Za-z_$][\w$]*)`/g)) {
      if (match[1] !== 'booleanAttribute') names.add(match[1]);
    }
  }
  return names;
}

export function apiRowId(groupId: string, name: string): string {
  return `api-${groupId}-${name.replace(/[^\w-]+/g, '')}`;
}

export function parseApiTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  groupId: string,
  booleanAttributes: ReadonlySet<string> = new Set()
): ApiRow[] {
  const plain = headers.map(plainHeader);
  const typeIndex = plain.findIndex(header => TYPE_HEADERS.test(header));
  const defaultIndex = plain.findIndex(header => DEFAULT_HEADERS.test(header));
  const used = new Set([0, typeIndex, defaultIndex]);
  let descriptionIndex = plain.findIndex(header => DESCRIPTION_HEADERS.test(header));
  if (descriptionIndex < 0) descriptionIndex = plain.length > 2 && !used.has(plain.length - 1) ? plain.length - 1 : -1;
  used.add(descriptionIndex);
  // why: a column the row pattern has no slot for (Required, Applies to…) is kept in the description, not dropped.
  const extraIndexes = plain.flatMap((_, index) => (used.has(index) ? [] : [index]));

  return rows
    .filter(row => stripCode(row[0] ?? ''))
    .map(row => {
      const name = stripCode(row[0] ?? '');
      const typeCell = typeIndex > 0 ? (row[typeIndex] ?? '') : '';
      const types = typeIndex > 0 ? typeChips(typeCell) : [];
      const defaultCell = defaultIndex > 0 ? stripCode(row[defaultIndex] ?? '') : '';
      const extras = extraIndexes.flatMap(index => {
        const value = (row[index] ?? '').trim();
        return EMPTY_VALUE.test(stripCode(value)) ? [] : [`**${headers[index].replace(/[`*]/g, '').trim()}:** ${value}`];
      });
      const description = [descriptionIndex > 0 ? (row[descriptionIndex] ?? '').trim() : '', ...extras].filter(Boolean).join(' · ');
      const usesBooleanAttribute =
        description.includes('booleanAttribute') ||
        typeCell.includes('booleanAttribute') ||
        (booleanAttributes.has(name) && types.some(type => type.text === 'boolean'));
      return {
        id: apiRowId(groupId, name),
        name,
        types,
        flag: usesBooleanAttribute ? 'booleanAttribute' : null,
        defaultValue: EMPTY_VALUE.test(defaultCell) ? null : defaultCell,
        description,
      };
    });
}

/** Every API row of a Markdown section, in table order. */
export function apiRowsOfMarkdown(markdown: string, groupId: string): ApiRow[] {
  const flags = booleanAttributeNames(markdown);
  return toMarkdownBlocks(markdown).flatMap(block =>
    block.kind === 'table' && isApiTable(block.headers) ? parseApiTable(block.headers, block.rows, groupId, flags) : []
  );
}

export interface ApiMethodOption {
  readonly name: string;
  readonly types: readonly ApiTypeChip[];
  readonly defaultValue: string | null;
  readonly description: string;
}

/** A service method documented as "### `name(params): Return`" with an `option?: { … }` signature block. */
export interface ApiMethod {
  readonly id: string;
  readonly name: string;
  readonly params: string;
  readonly returns: string;
  readonly description: string;
  readonly options: readonly ApiMethodOption[];
}

const METHOD_HEADING = /^`?([A-Za-z_$][\w$]*)\((.*)\)\s*:\s*(.+?)`?$/;
const OPTION_LINE = /^\s*([A-Za-z_$][\w$]*)\??\s*:\s*(.+?);?\s*(?:\/\/\s*(.*))?$/;

/** Reads the members of the `option?: { … }` object of a TypeScript signature block. */
export function parseOptionBlock(code: string): ApiMethodOption[] {
  const lines = code.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex(line => /\b\w+\??\s*:\s*\{\s*$/.test(line));
  if (start < 0) return [];
  const options: ApiMethodOption[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s*}/.test(line)) break;
    const match = OPTION_LINE.exec(line);
    if (!match) continue;
    const comment = (match[3] ?? '').trim();
    const defaultMatch = /default:\s*(.+?)\s*(?:;|$)/.exec(comment);
    const description = comment
      .replace(/;?\s*default:\s*(.+?)\s*(?:;|$)/, '')
      .replace(/^[;,\s]+|[;,\s]+$/g, '');
    options.push({
      name: match[1],
      types: splitUnion(match[2].replace(/;$/, '').trim()).map(text => ({ text, literal: /^['"`]/.test(text) })),
      defaultValue: defaultMatch ? defaultMatch[1].trim() : null,
      description,
    });
  }
  return options;
}

/** Turns a method section into an API method card, or null when the heading is not a method signature. */
export function parseApiMethod(heading: string, markdown: string, groupId = 'methods'): ApiMethod | null {
  const match = METHOD_HEADING.exec(heading.trim());
  if (!match) return null;
  const blocks = toMarkdownBlocks(markdown);
  const paragraph = blocks.find(block => block.kind === 'paragraph');
  const code = blocks.find(block => block.kind === 'code');
  return {
    id: apiRowId(groupId, match[1]),
    name: match[1],
    params: `(${match[2]})`,
    returns: match[3].trim(),
    description: paragraph?.kind === 'paragraph' ? paragraph.text : '',
    options: code?.kind === 'code' ? parseOptionBlock(code.code) : [],
  };
}

/** Options every method accepts; they are collapsed behind "Show N shared options". */
export function sharedOptionNames(methods: readonly ApiMethod[]): ReadonlySet<string> {
  if (methods.length < 2) return new Set();
  const [first, ...rest] = methods;
  return new Set(
    first.options.map(option => option.name).filter(name => rest.every(method => method.options.some(option => option.name === name)))
  );
}

/** API filter: the query matches the name, any type or the description (accents folded). */
export function matchesApiQuery(row: ApiRow, query: string): boolean {
  const term = foldSearchText(query.trim());
  if (!term) return true;
  return foldSearchText([row.name, ...row.types.map(type => type.text), row.flag ?? '', row.description].join(' ')).includes(term);
}
