import { SD_INPUT_MASKS, SdInputMaskAdapter, SdInputMaskResult, sdCreateInputMask } from './input-mask';

describe('input mask adapter', () => {
  const phone = sdCreateInputMask('#### ### ###');

  it('keeps the raw model separate from its formatted display', () => {
    expect(phone.format('0901234567')).toEqual(jasmine.objectContaining({ raw: '0901234567', display: '0901 234 567', status: 'valid' }));
  });

  it('distinguishes empty, incomplete, valid, and invalid input', () => {
    expect(phone.format('').status).toBe('empty');
    expect(phone.format('0901').status).toBe('incomplete');
    expect(phone.format('0901234567').status).toBe('valid');
    expect(phone.parse('0901x').status).toBe('invalid');
  });

  it('supports optional trailing slots without forcing their separator', () => {
    const taxCode = SD_INPUT_MASKS.VN_TAX_CODE;

    expect(taxCode.format('0123456789')).toEqual(jasmine.objectContaining({ raw: '0123456789', display: '0123456789', status: 'valid' }));
    expect(taxCode.format('0123456789123')).toEqual(
      jasmine.objectContaining({ raw: '0123456789123', display: '0123456789-123', status: 'valid' })
    );
  });

  it('parses display literals back to the raw value', () => {
    expect(phone.parse('0901 234 567')).toEqual(jasmine.objectContaining({ raw: '0901234567', display: '0901 234 567', status: 'valid' }));
  });

  it('only consumes numeric literals at their pattern positions', () => {
    const countryPhone = sdCreateInputMask('+84 ####');

    expect(countryPhone.parse('+84 1844')).toEqual(jasmine.objectContaining({ raw: '1844', display: '+84 1844', status: 'valid' }));
  });

  it('marks display input beyond the available slots as invalid', () => {
    expect(phone.parse('0901 234 5678')).toEqual(jasmine.objectContaining({ raw: '0901234567', status: 'invalid' }));
  });

  it('keeps the caret beside an insertion in the middle', () => {
    const result = phone.parse('09801 234 567', 3, 3);

    expect(result.raw).toBe('0980123456');
    expect(result.display).toBe('0980 123 456');
    expect(result.selectionStart).toBe(3);
    expect(result.selectionEnd).toBe(3);
  });

  it('keeps the caret stable after a middle deletion', () => {
    const result = phone.parse('090 234 567', 3, 3);

    expect(result.raw).toBe('090234567');
    expect(result.display).toBe('0902 345 67');
    expect(result.selectionStart).toBe(3);
  });

  it('reformats pasted text over a selection and places the caret after the paste', () => {
    const result = phone.parse('0901 88 567', 7, 7);

    expect(result.raw).toBe('090188567');
    expect(result.display).toBe('0901 885 67');
    expect(result.selectionStart).toBe(7);
  });

  it('supports custom tokens and character transforms', () => {
    const businessCode = sdCreateInputMask('LL-####', {
      tokens: {
        L: { pattern: /[a-z]/i, transform: value => value.toUpperCase() },
      },
    });

    expect(businessCode.format('ab1234')).toEqual(jasmine.objectContaining({ raw: 'AB1234', display: 'AB-1234', status: 'valid' }));
  });

  it('keeps the adapter contract open for fully custom parser/formatters', () => {
    const result: SdInputMaskResult = {
      raw: 'AB',
      display: '[AB]',
      status: 'valid',
      selectionStart: 4,
      selectionEnd: 4,
    };
    const custom: SdInputMaskAdapter = {
      inputMode: 'text',
      format: () => result,
      parse: () => result,
    };

    expect(custom.parse('[AB]')).toBe(result);
  });
});
