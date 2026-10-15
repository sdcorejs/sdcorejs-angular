import type { SdGenericAction } from '../models';

/** Upper-case word chain: `purchaseOrder` and `sales.invoice` become `PURCHASE_ORDER` and `SALES_INVOICE`. */
const segment = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

/** Permission code `<MODULE>_<ENTITY>_C_GENERIC_<ACTION>`; the only place that builds one (INV-005). */
export const sdGenericPermissionCode = (module: string, entity: string, action: SdGenericAction): string =>
  `${segment(module)}_${segment(entity)}_C_GENERIC_${action.toUpperCase()}`;
