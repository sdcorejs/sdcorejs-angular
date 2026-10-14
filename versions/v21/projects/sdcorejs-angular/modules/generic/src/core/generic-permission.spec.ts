import { sdGenericPermissionCode } from './generic-permission';

describe('sdGenericPermissionCode', () => {
  it('builds <MODULE>_<ENTITY>_C_GENERIC_<ACTION> in upper case', () => {
    expect(sdGenericPermissionCode('tms', 'order', 'list')).toBe('TMS_ORDER_C_GENERIC_LIST');
    expect(sdGenericPermissionCode('tms', 'order', 'create')).toBe('TMS_ORDER_C_GENERIC_CREATE');
    expect(sdGenericPermissionCode('wms', 'stock', 'configuration')).toBe('WMS_STOCK_C_GENERIC_CONFIGURATION');
  });

  it('covers every guarded action', () => {
    const actions = ['list', 'detail', 'create', 'update', 'delete', 'import', 'configuration'] as const;
    expect(actions.map(action => sdGenericPermissionCode('m', 'e', action))).toEqual([
      'M_E_C_GENERIC_LIST',
      'M_E_C_GENERIC_DETAIL',
      'M_E_C_GENERIC_CREATE',
      'M_E_C_GENERIC_UPDATE',
      'M_E_C_GENERIC_DELETE',
      'M_E_C_GENERIC_IMPORT',
      'M_E_C_GENERIC_CONFIGURATION',
    ]);
  });

  it('turns separators of camelCase, kebab-case and dotted names into underscores', () => {
    expect(sdGenericPermissionCode('tms', 'purchaseOrder', 'list')).toBe('TMS_PURCHASE_ORDER_C_GENERIC_LIST');
    expect(sdGenericPermissionCode('core-commerce', 'sales.invoice', 'update')).toBe('CORE_COMMERCE_SALES_INVOICE_C_GENERIC_UPDATE');
  });
});
