import { isSignal, signal } from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { Filter, Operator } from '@sdcorejs/utils/models';
import { firstValueFrom, isObservable } from 'rxjs';
import { SD_QUERY_NO_DATA_OPERATORS, SdQueryField } from './query-bar.model';

const DATE_FORMAT = 'dd/MM/yyyy';
const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

const hasValue = (value: unknown): boolean => value !== null && value !== undefined && value !== '';

interface Range {
  from?: string | number | null;
  to?: string | number | null;
}

/** What `ɵsdQueryChipValueText` needs from its host: translations, date formatting and the labels it knows. */
export interface ɵSdQueryChipTextContext {
  t: (key: string, params?: Record<string, string | number>) => string;
  toFormat: (value: unknown, format: string) => string;
  /** Options already loaded for the chip being edited (the popover's options). */
  options?: readonly unknown[];
  /** Labels of the field's values loaded by `ɵSdQueryChipLabels`. */
  labels?: ReadonlyMap<unknown, string>;
}

/**
 * Value text of a chip, shared by the query bar and the sd-table phone filters so both show the same string:
 * one value → its label; several → `first +n`; a date range in one year → `01/10 – 31/10/2026`; one open end →
 * `From x` / `To y`; `NULL` / `NOT_NULL` → empty.
 */
export const ɵsdQueryChipValueText = (filter: Filter, field: SdQueryField | undefined, context: ɵSdQueryChipTextContext): string => {
  if (SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return '';
  const data = (filter as any).data;
  if (data === null || data === undefined) return '';
  if (filter.operator === 'BETWEEN' && data && typeof data === 'object' && !Array.isArray(data)) {
    return rangeText(field, data, context);
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const head = displayOne(field, data[0], context);
    return data.length > 1 ? `${head} +${data.length - 1}` : head;
  }
  return displayOne(field, data, context);
};

/** `01/10 – 31/10/2026` inside one year, `From …` / `To …` when one end is open. */
const rangeText = (field: SdQueryField | undefined, range: Range, context: ɵSdQueryChipTextContext): string => {
  const hasFrom = hasValue(range.from);
  const hasTo = hasValue(range.to);
  if (field?.type === 'date' && hasFrom && hasTo) {
    const year = context.toFormat(range.from, 'yyyy');
    if (year && year === context.toFormat(range.to, 'yyyy')) {
      return `${context.toFormat(range.from, 'dd/MM')} – ${context.toFormat(range.to, DATE_FORMAT)}`;
    }
  }
  const from = hasFrom ? displayOne(field, range.from, context) : '';
  const to = hasTo ? displayOne(field, range.to, context) : '';
  if (hasFrom && hasTo) return `${from} – ${to}`;
  if (hasFrom) return context.t('core.component.query-bar.range.from', { value: from });
  if (hasTo) return context.t('core.component.query-bar.range.to', { value: to });
  return '';
};

const displayOne = (field: SdQueryField | undefined, raw: any, context: ɵSdQueryChipTextContext): string => {
  if (!field) return String(raw);
  if (field.type === 'boolean') {
    // why: nhãn mặc định của field boolean phải theo ngôn ngữ đang chọn; consumer vẫn override
    // được bằng `trueLabel` / `falseLabel` trên chính field.
    const trueLabel = (field as any).trueLabel ?? context.t('core.component.query-bar.boolean.true');
    const falseLabel = (field as any).falseLabel ?? context.t('core.component.query-bar.boolean.false');
    return raw ? trueLabel : falseLabel;
  }
  if (field.type === 'date' || field.type === 'datetime') {
    // why: chip in đúng định dạng của sd-date / sd-datetime, không in chuỗi model `yyyy/MM/dd` hay ISO.
    return context.toFormat(raw, field.type === 'date' ? DATE_FORMAT : DATETIME_FORMAT) || String(raw);
  }
  if (field.type === 'values' || field.type === 'lazy-values') {
    const opt = (field as any).option;
    const cachedOptions = context.options ?? [];
    const items = resolveSyncItems(opt?.items) ?? cachedOptions;
    const match = items.find((i: any) => i?.[opt.valueField] === raw);
    if (match) return String((match as any)[opt.displayField]);
    const cached = cachedOptions.find((i: any) => i?.[opt.valueField] === raw);
    if (cached) return String((cached as any)[opt.displayField]);
    return context.labels?.get(raw) ?? String(raw);
  }
  return String(raw);
};

const resolveSyncItems = (items: any): readonly any[] | null => {
  if (Array.isArray(items)) return items;
  if (isSignal(items)) return (items as any)();
  return null;
};

/**
 * Labels of `values` / `lazy-values` chip values that are not in memory (restored from a cache, a URL or the
 * table's filter): looked up once per field (`values` with an items function) or per field + value (`lazy-values`,
 * through `views` or `search`). `get` reads a signal, so a view re-renders when a lookup lands.
 */
export class ɵSdQueryChipLabels {
  /** `field.key` → value → label. Replaced (not mutated) so readers re-render. */
  readonly #labels = signal<ReadonlyMap<string, ReadonlyMap<unknown, string>>>(new Map());
  /** Lookups already started — each runs once per field (values) or per field + value (lazy-values). */
  readonly #requests = new Set<string>();

  get(key: string): ReadonlyMap<unknown, string> | undefined {
    return this.#labels().get(key);
  }

  resolve(filter: Filter, field: SdQueryField | undefined): void {
    if (!('field' in filter) || SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return;
    if (field?.type !== 'values' && field?.type !== 'lazy-values') return;
    const data = (filter as any).data;
    const values: unknown[] = Array.isArray(data) ? data : hasValue(data) ? [data] : [];
    if (!values.length) return;
    const key = field.key as string;
    if (field.type === 'values') {
      const items = field.option.items;
      // why: mảng / signal đã đọc đồng bộ trong displayOne; chỉ hàm (Promise) mới cần nạp.
      if (typeof items !== 'function' || isSignal(items) || this.#requests.has(key)) return;
      this.#requests.add(key);
      this.#load(field, () => (items as () => Promise<unknown[]>)());
      return;
    }
    const known = this.#labels().get(key);
    if (values.every(value => known?.has(value))) return;
    const request = `${key}|${stringify(data)}`;
    if (this.#requests.has(request)) return;
    this.#requests.add(request);
    const option = field.option;
    this.#load(field, () => (option.views ? option.views(values) : option.search({ type: 'VALUE', value: data })));
  }

  #load(field: SdQueryField, load: () => unknown): void {
    const option = (field as any).option;
    let result: unknown;
    try {
      result = load();
    } catch {
      return;
    }
    const items = isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);
    items
      .then(list => {
        if (!Array.isArray(list) || !list.length) return;
        const next = new Map(this.#labels());
        const labels = new Map(next.get(field.key as string) ?? []);
        for (const item of list) {
          const value = item?.[option.valueField];
          if (value !== undefined) labels.set(value, String(item[option.displayField]));
        }
        next.set(field.key as string, labels);
        this.#labels.set(next);
      })
      // why: tra nhãn thất bại thì chip giữ giá trị thô — không phải lỗi của thanh.
      .catch(() => undefined);
  }
}

const stringify = (value: unknown): string => {
  try {
    return Utilities.canonicalStringify(value);
  } catch {
    return String(value);
  }
};
