/**
 * Runtime state attributes the component renders on the same anchor as `data-autoid`.
 * Every field is OPTIONAL — only present when the component actually renders that attribute.
 * All values are the raw DOM string (already "true"/"false" or stringified number/value).
 */
export interface SdAutoidElementState {
  disabled?: string;
  loading?: string;
  empty?: string;
  invalid?: string;
  opened?: string;
  count?: string;
  /** Serialized DOM `data-value` (NOT `input.value`). Distinct from `SdAutoidElement.text` field. */
  dataValue?: string;
  // Validation meta — new in v0.0.1
  required?: string;
  maxlength?: string;
  minlength?: string;
  pattern?: string;
  errorMessage?: string;
}

export interface SdAutoidElement {
  stt: number;
  name: string;
  autoid: string;
  tag: string;
  /**
   * Display text resolved from the DOM: `input.value` for form controls, otherwise
   * `textContent.trim().slice(0, 80)`. Use `state.dataValue` for the serialized
   * runtime value rendered by `@sdcorejs/angular` components.
   */
  text: string;
  xpath: string;
  duplicate: boolean;
  /** Runtime state attributes read from the DOM. Always an object — may be empty `{}`. */
  state: SdAutoidElementState;
  /**
   * `data-autoid` of the closest ancestor `<sd-table>` that contains this element,
   * or `undefined` if this element is top-level (not inside any `sd-table`).
   * Used by the UI to group table-scoped elements into a separate section.
   */
  tableScope?: string;
}

export interface SdAutoidMissing {
  tag: string;
  selector: string;
  outerHtmlPreview: string;
  nameHint: string;
}

export interface SdAutoidAuditResult {
  total: number;
  duplicates: Record<string, number>;
  duplicateCount: number;
  missing: SdAutoidMissing[];
  missingCount: number;
}
