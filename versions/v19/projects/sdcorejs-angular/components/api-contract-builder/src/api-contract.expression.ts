import { SD_API_CONTRACT_EXPRESSION_ROOTS, type SdApiContractExpressionRoot } from './api-contract.model';

/**
 * How a `source` string relates to the expression grammar.
 *
 * - `literal` — no `${…}` at all.
 * - `exact` — the whole string is one expression, so the referenced value keeps its own type.
 * - `interpolated` — expressions embedded in surrounding text, so the result is always a string.
 */
export type SdApiContractTemplateKind = 'literal' | 'exact' | 'interpolated';

export type SdApiContractTemplateErrorCode =
  | 'template.unterminated'
  | 'template.nested'
  | 'template.empty'
  | 'template.invalid-path'
  | 'template.unknown-root'
  | 'template.forbidden-segment';

export interface SdApiContractTemplateError {
  code: SdApiContractTemplateErrorCode;
  message: string;
  /** Offset of the `${` that opened the offending expression. */
  index: number;
  raw: string;
}

export interface SdApiContractExpressionReference {
  root: SdApiContractExpressionRoot;
  /** Segments *after* the root. `${input.customer.id}` → `['customer', 'id']`. */
  path: readonly string[];
  /** The inner text, e.g. `input.customer.id`. */
  expression: string;
  /** The full match including delimiters, e.g. `${input.customer.id}`. */
  raw: string;
  start: number;
  end: number;
}

export interface SdApiContractTemplate {
  kind: SdApiContractTemplateKind;
  valid: boolean;
  references: readonly SdApiContractExpressionReference[];
  errors: readonly SdApiContractTemplateError[];
}

const OPEN = '${';
const CLOSE = '}';

// why: chỉ chấp nhận identifier thuần. Mọi thứ khác — `a[0]`, `a.toUpperCase()`, `1 + 1`, `a ? b : c`
// — trượt regex này và bị từ chối NGAY tại parser, nên không có nhánh nào có thể chạy JavaScript.
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// why: ba tên này là đường vào prototype chain. Chặn ở parser (không phải ở resolver) để mọi
// consumer của reference — validator, autocomplete, executor tương lai — đều được bảo vệ như nhau.
const FORBIDDEN_SEGMENTS: ReadonlySet<string> = new Set(['__proto__', 'prototype', 'constructor']);

interface Span {
  open: number;
  close: number;
  raw: string;
  reference: SdApiContractExpressionReference | null;
}

function isKnownRoot(value: string): value is SdApiContractExpressionRoot {
  return (SD_API_CONTRACT_EXPRESSION_ROOTS as readonly string[]).includes(value);
}

/**
 * Parses a `source` / URL template into references and errors.
 *
 * Pure string scanning — no `eval`, no `new Function`, no expression evaluation of any kind. The
 * grammar accepts exactly `${<root>.<identifier>(.<identifier>)*}` and nothing else.
 */
export function parseSdApiContractTemplate(source: unknown): SdApiContractTemplate {
  if (typeof source !== 'string') {
    return { kind: 'literal', valid: true, references: [], errors: [] };
  }

  const spans: Span[] = [];
  const errors: SdApiContractTemplateError[] = [];
  let cursor = 0;

  while (cursor <= source.length) {
    const open = source.indexOf(OPEN, cursor);
    if (open < 0) break;

    const close = source.indexOf(CLOSE, open + OPEN.length);
    if (close < 0) {
      const raw = source.slice(open);
      spans.push({ open, close: source.length - 1, raw, reference: null });
      errors.push({ code: 'template.unterminated', message: `Expression "${raw}" is missing its closing "}".`, index: open, raw });
      break;
    }

    const raw = source.slice(open, close + 1);
    const inner = source.slice(open + OPEN.length, close);
    const error = validateInner(inner, raw, open);

    if (error) {
      errors.push(error);
      spans.push({ open, close, raw, reference: null });
    } else {
      const segments = inner.split('.');
      spans.push({
        open,
        close,
        raw,
        reference: {
          root: segments[0] as SdApiContractExpressionRoot,
          path: segments.slice(1),
          expression: inner,
          raw,
          start: open,
          end: close + 1,
        },
      });
    }

    cursor = close + 1;
  }

  return {
    kind: resolveKind(source, spans),
    valid: errors.length === 0,
    references: spans.map(span => span.reference).filter((reference): reference is SdApiContractExpressionReference => reference !== null),
    errors,
  };
}

/** The well-formed references of a template. Malformed expressions are dropped, not thrown. */
export function extractSdApiContractReferences(source: unknown): readonly SdApiContractExpressionReference[] {
  return parseSdApiContractTemplate(source).references;
}

function validateInner(inner: string, raw: string, index: number): SdApiContractTemplateError | null {
  if (inner.includes(OPEN)) {
    return { code: 'template.nested', message: `Expression "${raw}" nests another "\${".`, index, raw };
  }
  if (inner.trim() === '') {
    return { code: 'template.empty', message: 'Expression "${}" declares no path.', index, raw };
  }

  const segments = inner.split('.');
  // why: kiểm identifier TRƯỚC root — `${input["a"]}` phải báo là path sai, không phải root lạ.
  if (segments.some(segment => !IDENTIFIER.test(segment))) {
    return {
      code: 'template.invalid-path',
      message: `Expression "${raw}" is not a plain dotted path of identifiers.`,
      index,
      raw,
    };
  }
  if (segments.length < 2) {
    return {
      code: 'template.invalid-path',
      message: `Expression "${raw}" needs a root and at least one segment, e.g. "\${env.baseUrl}".`,
      index,
      raw,
    };
  }
  if (!isKnownRoot(segments[0])) {
    return {
      code: 'template.unknown-root',
      message: `Unknown expression root "${segments[0]}" — expected one of ${SD_API_CONTRACT_EXPRESSION_ROOTS.join(', ')}.`,
      index,
      raw,
    };
  }
  const forbidden = segments.slice(1).find(segment => FORBIDDEN_SEGMENTS.has(segment));
  if (forbidden) {
    return { code: 'template.forbidden-segment', message: `Segment "${forbidden}" is not addressable.`, index, raw };
  }
  if (segments[0] === 'env' && segments.length !== 2) {
    return {
      code: 'template.invalid-path',
      message: `Environment references address a single key, e.g. "\${env.baseUrl}" — got "${raw}".`,
      index,
      raw,
    };
  }

  return null;
}

function resolveKind(source: string, spans: readonly Span[]): SdApiContractTemplateKind {
  if (spans.length === 0) return 'literal';
  const only = spans[0];
  const isWholeString = spans.length === 1 && only.reference !== null && only.open === 0 && only.close === source.length - 1;
  return isWholeString ? 'exact' : 'interpolated';
}
