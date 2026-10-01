import {
  SD_FORM_GENERIC_BREAKPOINTS,
  type SdFormGenericBreakpoint,
  type SdFormGenericBreakpoints,
} from '../configurations/form-generic-breakpoints';
import type { SdFormGenericLayout } from '../models/form-generic-field.model';

// why: the ONLY place that picks the breakpoint level, resolves span inheritance and packs rows.
// The renderer and the builder canvas both call it, so the same input and level always give the same rows.

export const SD_FORM_GENERIC_COLUMNS = 12;

/** Nơi một mức lấy span: tự khai báo, kế thừa desktop (chỉ tablet), hoặc mặc định. */
export type SdFormGenericSpanSource = 'own' | 'desktop' | 'default';

/** Phần tử tối thiểu mà bộ xếp hàng cần: group luôn chiếm trọn một hàng. */
export interface SdFormGenericLayoutElement {
  type?: string;
  layout?: SdFormGenericLayout;
}

export interface SdFormGenericLayoutCell<T> {
  element: T;
  span: number;
}

export type SdFormGenericLayoutRow<T> = SdFormGenericLayoutCell<T>[];

const clampSpan = (value: number): number => Math.min(SD_FORM_GENERIC_COLUMNS, Math.max(1, Math.round(value)));
const isSpan = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Ghép giá trị ghi đè (bỏ qua mục `undefined`) với `SD_FORM_GENERIC_BREAKPOINTS`. */
export const sdResolveBreakpoints = (override?: Partial<SdFormGenericBreakpoints> | null): SdFormGenericBreakpoints => {
  const resolved: SdFormGenericBreakpoints = { ...SD_FORM_GENERIC_BREAKPOINTS };
  if (isSpan(override?.tablet)) resolved.tablet = override.tablet;
  if (isSpan(override?.desktop)) resolved.desktop = override.desktop;
  return resolved;
};

/** Mức theo bề rộng form. Bề rộng chưa đo được (0, NaN) coi là desktop. */
export const sdResolveBreakpoint = (
  width: number,
  breakpoints: Partial<SdFormGenericBreakpoints> = SD_FORM_GENERIC_BREAKPOINTS
): SdFormGenericBreakpoint => {
  if (!Number.isFinite(width) || width <= 0) return 'desktop';
  const { tablet, desktop } = sdResolveBreakpoints(breakpoints);
  if (width >= desktop) return 'desktop';
  return width >= tablet ? 'tablet' : 'mobile';
};

/** Mức ép (vd `[breakpoint]`) thắng mức đo; `null`/`undefined` thì dùng mức đo. */
export const sdEffectiveBreakpoint = (
  forced: SdFormGenericBreakpoint | null | undefined,
  width: number,
  breakpoints?: Partial<SdFormGenericBreakpoints>
): SdFormGenericBreakpoint => forced ?? sdResolveBreakpoint(width, breakpoints);

/** desktop = `span.desktop ?? 12`; tablet = `span.tablet ?? desktop`; mobile = `span.mobile ?? 12`; kẹp 1–12. */
export const sdResolveSpan = (layout: SdFormGenericLayout | null | undefined, level: SdFormGenericBreakpoint): number => {
  const span = layout?.span;
  const desktop = isSpan(span?.desktop) ? clampSpan(span.desktop) : SD_FORM_GENERIC_COLUMNS;
  if (level === 'desktop') return desktop;
  if (level === 'tablet') return isSpan(span?.tablet) ? clampSpan(span.tablet) : desktop;
  return isSpan(span?.mobile) ? clampSpan(span.mobile) : SD_FORM_GENERIC_COLUMNS;
};

export const sdSpanSource = (layout: SdFormGenericLayout | null | undefined, level: SdFormGenericBreakpoint): SdFormGenericSpanSource => {
  if (isSpan(layout?.span?.[level])) return 'own';
  return level === 'tablet' ? 'desktop' : 'default';
};

/** Xếp tham lam 12 cột: `newRow` luôn mở hàng mới; group chiếm trọn hàng. */
export const sdPackRows = <T extends SdFormGenericLayoutElement>(
  elements: readonly T[],
  level: SdFormGenericBreakpoint
): SdFormGenericLayoutRow<T>[] => {
  const rows: SdFormGenericLayoutRow<T>[] = [];
  let current: SdFormGenericLayoutRow<T> = [];
  let used = 0;
  const flush = () => {
    if (current.length) rows.push(current);
    current = [];
    used = 0;
  };
  for (const element of elements) {
    if (element.type === 'group') {
      flush();
      rows.push([{ element, span: SD_FORM_GENERIC_COLUMNS }]);
      continue;
    }
    const span = sdResolveSpan(element.layout, level);
    if (element.layout?.newRow || used + span > SD_FORM_GENERIC_COLUMNS) flush();
    current.push({ element, span });
    used += span;
  }
  flush();
  return rows;
};

/** Layout mới với span của MỘT mức; `null` xoá mức đó về kế thừa. Không mutate input. */
export const sdWithSpan = (
  layout: SdFormGenericLayout | null | undefined,
  level: SdFormGenericBreakpoint,
  value: number | null
): SdFormGenericLayout => {
  const next: SdFormGenericLayout = { ...layout };
  const span = { ...layout?.span };
  if (value === null) delete span[level];
  else span[level] = clampSpan(value);
  if (Object.keys(span).length) next.span = span;
  else delete next.span;
  return next;
};

export const sdWithNewRow = (layout: SdFormGenericLayout | null | undefined, newRow: boolean): SdFormGenericLayout => {
  const next: SdFormGenericLayout = { ...layout };
  if (newRow) next.newRow = true;
  else delete next.newRow;
  return next;
};
