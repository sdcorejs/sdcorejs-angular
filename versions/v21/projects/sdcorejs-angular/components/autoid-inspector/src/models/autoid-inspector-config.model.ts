export interface SdAutoidInspectorConfig {
  /** Selector phụ thêm cần audit (mặc định component đã cover sd-* form + sd-button). */
  extraRequireSelectors?: string[];
  /** Root scan, mặc định document.body. */
  root?: HTMLElement;
}

/** Selector mặc định coi là phải có data-autoid. */
export const SD_AUTOID_DEFAULT_REQUIRE_SELECTORS: ReadonlyArray<string> = [
  'sd-input',
  'sd-input-number',
  'sd-textarea',
  'sd-select',
  'sd-autocomplete',
  'sd-checkbox',
  'sd-radio',
  'sd-switch',
  'sd-date',
  'sd-datetime',
  'sd-date-range',
  'sd-chip',
  'sd-chip-calendar',
  'sd-button',
];
