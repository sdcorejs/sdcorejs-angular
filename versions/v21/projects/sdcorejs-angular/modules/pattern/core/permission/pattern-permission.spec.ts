import { PATTERN_PERMISSION_CODES, PATTERN_ROLES, patternPermissionsOf } from './pattern-permission';

describe('patternPermissionsOf', () => {
  it('gives every code of the catalog to the administrator', () => {
    expect(patternPermissionsOf('admin')).toEqual([...PATTERN_PERMISSION_CODES]);
  });

  it('keeps delete, approve and reject away from the staff', () => {
    const staff = patternPermissionsOf('staff');
    expect(staff).toContain('PATTERN_ORDER_U_SUBMIT');
    expect(staff).toContain('PATTERN_CUSTOMER_C_CREATE');
    expect(staff.filter(code => code.includes('_D_') || /_U_(APPROVE|REJECT)$/.test(code))).toEqual([]);
  });

  it('lets a viewer read only', () => {
    const viewer = patternPermissionsOf('viewer');
    expect(viewer.length).toBeGreaterThan(0);
    expect(viewer.every(code => code.includes('_R_'))).toBeTrue();
  });

  it('names every code PATTERN_<ENTITY>_<R|C|U|D>_<ACTION> and describes every role', () => {
    for (const code of PATTERN_PERMISSION_CODES) expect(code).toMatch(/^PATTERN_[A-Z]+_[RCUD]_[A-Z]+$/);
    expect(PATTERN_ROLES.map(role => role.value)).toEqual(['admin', 'staff', 'viewer']);
  });
});
