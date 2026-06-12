import { InjectionToken } from '@angular/core';

export interface SdAutoidInspectorConfiguration {
  /** Base URL cua backend sinh E2E test, vi du `http://localhost:3012`. */
  host?: string;
  /** Selector phu them can audit (mac dinh component da cover sd-* form + sd-button). */
  extraRequireSelectors?: string[];
  /** Root scan, mac dinh document.body. */
  root?: HTMLElement;
}

/** Cau hinh global cho AutoId Inspector. `[config]` tren component co the override theo instance. */
export const SD_AUTOID_INSPECTOR_CONFIGURATION = new InjectionToken<SdAutoidInspectorConfiguration>('sd.autoid-inspector.configuration');

/** Selector mac dinh coi la phai co data-autoid. */
export const AUTOID_DEFAULT_REQUIRE_SELECTORS: readonly string[] = [
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
