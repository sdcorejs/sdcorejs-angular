import { computed, inject, Injectable, signal } from '@angular/core';
import { PatternMockApiState } from '../../mock-api/mock-api.state';
import { readSessionValue, writeSessionValue } from '../../session-state';

/** Settings of `/pattern/order` (doc 08 "Tuỳ chỉnh hiển thị"): the parts of `sd-page-list` + `sd-table` to show. */
export interface PatternOrderSettings {
  /** Status tabs in `sdSubheader`. */
  readonly tabs: boolean;
  /** Score cards above the table. */
  readonly score: boolean;
  /** `filter.quickSearch`. */
  readonly quickSearch: boolean;
  /** "Kho xuất" dropdown of the quick search (`quickSearch.filters`). */
  readonly warehouse: boolean;
  /** Filter row under the columns (`hideInlineFilter: false`). */
  readonly inlineFilter: boolean;
  /** `hideInlineFilter: 'auto'`: hide the filter row while there are at most 10 rows. */
  readonly autoHide: boolean;
  /** `filter.externalFilters`. */
  readonly externalFilter: boolean;
  /** External filter collapsed at first (`filter.externalFilterCollapsed`). */
  readonly externalFilterCollapsed: boolean;
  /** `filter.manualFilter`. */
  readonly manualFilter: boolean;
  /** `filter.externalFilterPerRow`. */
  readonly externalFilterPerRow: 6 | 4;
  /** `selector.visible`. */
  readonly selector: boolean;
  /** `reload.visible`, `export`, `config.visible`. */
  readonly footerButtons: boolean;
  /** Records the mock API serves (the first N of the seed). */
  readonly records: 0 | 3 | 20 | 128;
  /** `paginate.pageSize`. */
  readonly pageSize: 10 | 20 | 50;
  /** Read state the mock API forces on the list request. */
  readonly read: 'normal' | 'loading' | 'error';
  /** `sd-page-list` `autoCompact`. */
  readonly autoCompact: boolean;
  /** `sd-page-list` `detail`. */
  readonly detail: 'drawer' | 'page';
}

export const PATTERN_ORDER_SETTINGS_DEFAULTS: PatternOrderSettings = {
  tabs: false,
  score: false,
  quickSearch: true,
  warehouse: true,
  inlineFilter: true,
  autoHide: false,
  externalFilter: false,
  externalFilterCollapsed: false,
  manualFilter: false,
  externalFilterPerRow: 6,
  selector: false,
  footerButtons: true,
  records: 128,
  pageSize: 20,
  read: 'normal',
  autoCompact: true,
  detail: 'drawer',
};

const STORAGE_KEY = 'sd-pattern.order.settings';

/** `?cfg=<json>` of the page URL, so a link (or an e2e test) opens the screen with given settings. */
function fromUrl(): Partial<PatternOrderSettings> {
  try {
    const raw = new URLSearchParams(globalThis.location?.search ?? '').get('cfg');
    return raw ? (JSON.parse(raw) as Partial<PatternOrderSettings>) : {};
  } catch {
    return {};
  }
}

/**
 * State of the "Tuỳ chỉnh hiển thị" drawer, kept for the browser tab. Only `/pattern` has it: the order list reads it
 * to build its table option, the way a real screen would hard-code one choice.
 */
@Injectable()
export class PatternSettingsStore {
  readonly #mock = inject(PatternMockApiState, { optional: true });
  readonly #settings = signal<PatternOrderSettings>({
    ...PATTERN_ORDER_SETTINGS_DEFAULTS,
    ...readSessionValue<Partial<PatternOrderSettings>>(STORAGE_KEY, {}),
    ...fromUrl(),
  });
  readonly settings = this.#settings.asReadonly();
  /** E6: quick search and external filter on one screen is not recommended; the drawer shows a warning. */
  readonly e6 = computed(() => this.#settings().quickSearch && this.#settings().externalFilter);
  /** The drawer is open (its button looks active). */
  readonly open = signal(false);

  constructor() {
    // why: synchronously, before the first list request of the screen reads the mock API.
    this.#applyReadOverride();
  }

  set<K extends keyof PatternOrderSettings>(key: K, value: PatternOrderSettings[K]): void {
    this.#settings.update(settings => ({ ...settings, [key]: value }));
    writeSessionValue(STORAGE_KEY, this.#settings());
    this.#applyReadOverride();
  }

  /** "Mặc định": every setting back to its default. */
  reset(): void {
    this.#settings.set(PATTERN_ORDER_SETTINGS_DEFAULTS);
    writeSessionValue(STORAGE_KEY, undefined);
    this.#applyReadOverride();
  }

  /** "Số bản ghi" and "Trạng thái đọc" act on the mock API, not on the screen. */
  #applyReadOverride(): void {
    const { records, read } = this.#settings();
    this.#mock?.setReadOverride('orders', records === 128 && read === 'normal' ? undefined : { limit: records, mode: read });
  }
}
