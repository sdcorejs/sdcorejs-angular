import type { Signal } from '@angular/core';
import type { SdTableExternalFilter } from './table-filter.model';

export type SdTableQuickSearchFilterValue = string | number | boolean | (string | number)[] | null | undefined;

type QuickSearchDropdown<F> = F extends { type: 'values' | 'lazy-values' }
  ? Omit<F, 'default' | 'hidden' | 'defaultShowing' | 'onChange'> & {
      /** Signal defaults follow shared state and take precedence over the table's cached value. */
      default?: SdTableQuickSearchFilterValue | Signal<SdTableQuickSearchFilterValue>;
      /** Hides only the control; its value and required constraint remain active. */
      hidden?: boolean | Signal<boolean>;
      disabled?: boolean | Signal<boolean>;
      /** User changes only; initialization and signal synchronization do not emit this callback. */
      onChange?: (value: SdTableQuickSearchFilterValue) => void;
    }
  : never;

export type SdTableQuickSearchFilter<TData = unknown> = QuickSearchDropdown<SdTableExternalFilter<TData>>;

export interface SdTableOptionQuickSearch {
  /** CONTAIN matches, combined with equalFields using OR. Paths need not appear in columns. */
  containFields?: string[];
  /** Exact EQUAL matches, combined with containFields using OR. */
  equalFields?: string[];
  placeholder?: string;
  /** Dropdowns before the keyword input, applied immediately and combined with AND. */
  filters?: SdTableQuickSearchFilter[];
}

/** Applied values only. The unsubmitted keyword remains local to the input. */
export interface SdTableQuickSearchValue {
  term: string;
  filters: Record<string, SdTableQuickSearchFilterValue>;
}
