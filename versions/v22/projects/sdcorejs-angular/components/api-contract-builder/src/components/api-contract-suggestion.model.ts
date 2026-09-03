import type { SdApiContractDataType, SdApiContractExpressionRoot } from '../api-contract.model';

/**
 * One `${…}` reference the source editor can offer.
 *
 * Internal to the builder UI — it is derived from the contract and the injected env catalog on every
 * edit, so it is never persisted and never part of the public surface.
 */
export interface SdApiContractSuggestion {
  /** Ready-to-insert text, e.g. `${input.customer.id}`. */
  expression: string;
  /** Dotted path without the delimiters, e.g. `input.customer.id`. */
  path: string;
  root: SdApiContractExpressionRoot;
  type: SdApiContractDataType;
  /** What the picker shows. Never contains a value — a sensitive variable only shows its name. */
  display: string;
}
