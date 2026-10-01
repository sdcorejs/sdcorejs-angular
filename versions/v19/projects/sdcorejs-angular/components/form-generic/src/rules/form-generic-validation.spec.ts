import type { SdFormGenericValidator } from '../models/form-generic-config.model';
import type { SdFormGenericValidation } from '../models/form-generic-schema.model';
import { sdRunFormValidations } from './form-generic-validation';

const validations: SdFormGenericValidation[] = [
  { type: 'filter', filter: { field: 'age', operator: 'LESS_THAN', data: 18 }, message: 'Chưa đủ tuổi', alert: 'error' },
  { type: 'filter', filter: { field: 'email', operator: 'NULL' }, message: 'Nên có email', alert: 'warning' },
  { type: 'function', validator: 'unique-code', alert: 'error' },
];

describe('form generic form-level validation', () => {
  it('always returns error and warning lists, even without validations', async () => {
    expect(await sdRunFormValidations(undefined, { value: {}, variables: {} })).toEqual({
      valid: true,
      messages: { error: [], warning: [] },
    });
  });

  it('collects Filter messages by alert and only errors make the form invalid', async () => {
    const onlyWarning = await sdRunFormValidations(validations.slice(0, 2), { value: { age: 20 }, variables: {} });
    expect(onlyWarning).toEqual({ valid: true, messages: { error: [], warning: ['Nên có email'] } });
    const withError = await sdRunFormValidations(validations.slice(0, 2), { value: { age: 10, email: 'a@b.c' }, variables: {} });
    expect(withError).toEqual({ valid: false, messages: { error: ['Chưa đủ tuổi'], warning: [] } });
  });

  it('evaluates Filters on value merged with variables', async () => {
    const byVariable: SdFormGenericValidation[] = [
      { type: 'filter', filter: { field: 'locked', operator: 'EQUAL', data: true }, message: 'Đã khoá', alert: 'error' },
    ];
    expect((await sdRunFormValidations(byVariable, { value: {}, variables: { locked: true } })).valid).toBeFalse();
  });

  it('passes the form value to a registered validator function', async () => {
    const validate = jasmine.createSpy('validate').and.resolveTo('Mã đã tồn tại');
    const validators: SdFormGenericValidator[] = [{ id: 'unique-code', label: 'Unique code', validate }];
    const result = await sdRunFormValidations([validations[2]], { value: { code: 'A1' }, variables: { tenant: 't' }, validators });
    expect(validate).toHaveBeenCalledOnceWith({ code: 'A1' });
    expect(result).toEqual({ valid: false, messages: { error: ['Mã đã tồn tại'], warning: [] } });
  });

  it('treats an empty validator result as valid', async () => {
    const validators: SdFormGenericValidator[] = [{ id: 'unique-code', label: 'Unique code', validate: () => null }];
    expect((await sdRunFormValidations([validations[2]], { value: {}, variables: {}, validators })).valid).toBeTrue();
  });

  it('fails closed when the validator is not registered or throws', async () => {
    const missing = await sdRunFormValidations([validations[2]], {
      value: {},
      variables: {},
      validators: [],
      unregisteredMessage: id => `missing ${id}`,
    });
    expect(missing).toEqual({ valid: false, messages: { error: ['missing unique-code'], warning: [] } });
    const throwing: SdFormGenericValidator[] = [
      { id: 'unique-code', label: 'Unique code', validate: () => Promise.reject(new Error('boom')) },
    ];
    const failed = await sdRunFormValidations([validations[2]], {
      value: {},
      variables: {},
      validators: throwing,
      unregisteredMessage: id => `missing ${id}`,
    });
    expect(failed.valid).toBeFalse();
    expect(failed.messages.error.length).toBe(1);
  });

  it('never fires a filter validation whose filter has no condition', async () => {
    const empty = [
      { type: 'filter', filter: { operator: 'AND', data: [] }, message: 'Always', alert: 'error' },
    ] as SdFormGenericValidation[];
    expect(await sdRunFormValidations(empty, { value: {}, variables: {} })).toEqual({ valid: true, messages: { error: [], warning: [] } });
  });

  it('fails closed on an unknown alert level and skips null entries', async () => {
    const odd = [
      null,
      { type: 'filter', filter: { field: 'age', operator: 'NULL' }, message: 'Age missing', alert: 'critical' },
    ] as unknown as SdFormGenericValidation[];
    const result = await sdRunFormValidations(odd, { value: {}, variables: {} });
    expect(result).toEqual({ valid: false, messages: { error: ['Age missing'], warning: [] } });
  });
});
