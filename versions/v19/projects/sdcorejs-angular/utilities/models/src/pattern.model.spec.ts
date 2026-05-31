import { SdPatternCommons, SdPatternType } from './pattern.model';

describe('SdPatternCommons', () => {
  describe('pattern definitions', () => {
    it('should contain EMAIL pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'EMAIL');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.email.name');
      expect(pattern?.errorMessage).toBe('core.validator.email.error');
    });

    it('should contain PHONE pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'PHONE');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.phone.name');
      expect(pattern?.errorMessage).toBe('core.validator.phone.error');
    });

    it('should contain PHONE_VN pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'PHONE_VN');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.phone-vn.name');
      expect(pattern?.errorMessage).toBe('core.validator.phone-vn.error');
    });

    it('should contain IDVN pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'IDVN');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.cccd.name');
      expect(pattern?.errorMessage).toBe('core.validator.cccd.error');
    });

    it('should contain PASSPORT pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'PASSPORT');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.passport.name');
      expect(pattern?.errorMessage).toBe('core.validator.passport.error');
    });

    it('should contain IDVN_OR_PASSPORT pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'IDVN_OR_PASSPORT');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.id-vn.name');
      expect(pattern?.errorMessage).toBe('core.validator.id-vn.error');
    });

    it('should contain TIME pattern', () => {
      const pattern = SdPatternCommons.find(p => p.type === 'TIME');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('core.validator.time.name');
      expect(pattern?.errorMessage).toBe('core.validator.time.error');
    });
  });

  describe('IDVN pattern validation', () => {
    const pattern = SdPatternCommons.find(p => p.type === 'IDVN');

    it('should match 12-digit CCCD', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('123456789012')).toBeTrue();
      expect(regex.test('034201012345')).toBeTrue();
    });

    it('should not match 9-digit CMND cũ (CCCD chỉ chấp nhận 12 số)', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('123456789')).toBeFalse();
      expect(regex.test('034201012')).toBeFalse();
    });

    it('should not match invalid CCCD formats', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('12345678')).toBeFalse(); // 8 digits
      expect(regex.test('12345678901')).toBeFalse(); // 11 digits
      expect(regex.test('1234567890123')).toBeFalse(); // 13 digits
      expect(regex.test('A34201012345')).toBeFalse(); // contains letter
    });
  });

  describe('PASSPORT pattern validation', () => {
    const pattern = SdPatternCommons.find(p => p.type === 'PASSPORT');

    it('should match valid passport format (1 uppercase letter + 7 digits)', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('A1234567')).toBeTrue();
      expect(regex.test('Z9999999')).toBeTrue();
      expect(regex.test('C0000000')).toBeTrue();
    });

    it('should not match lowercase letters', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('a1234567')).toBeFalse();
      expect(regex.test('z9999999')).toBeFalse();
    });

    it('should not match invalid passport formats', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('A123456')).toBeFalse(); // 6 digits
      expect(regex.test('A12345678')).toBeFalse(); // 8 digits
      expect(regex.test('AB1234567')).toBeFalse(); // 2 letters
      expect(regex.test('1A234567')).toBeFalse(); // letter not at start
    });
  });

  describe('IDVN_OR_PASSPORT pattern validation', () => {
    const pattern = SdPatternCommons.find(p => p.type === 'IDVN_OR_PASSPORT');

    it('should match 12-digit CCCD', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('034201012345')).toBeTrue();
    });

    it('should match valid passport format', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('A1234567')).toBeTrue();
      expect(regex.test('Z9999999')).toBeTrue();
    });

    it('should not match 9-digit CMND cũ', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('123456789')).toBeFalse();
    });

    it('should not match invalid formats', () => {
      const regex = new RegExp(pattern!.regex);
      expect(regex.test('12345678')).toBeFalse(); // 8 digits (invalid)
      expect(regex.test('a1234567')).toBeFalse(); // lowercase letter
      expect(regex.test('AB1234567')).toBeFalse(); // 2 letters
    });
  });

  describe('pattern structure', () => {
    it('should have at least 7 patterns defined', () => {
      expect(SdPatternCommons.length).toBeGreaterThanOrEqual(7);
    });

    it('each pattern should have type, name, regex, and errorMessage', () => {
      SdPatternCommons.forEach(pattern => {
        expect(pattern.type).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.regex).toBeDefined();
        expect(pattern.errorMessage).toBeDefined();
        expect(typeof pattern.type).toBe('string');
        expect(typeof pattern.name).toBe('string');
        expect(typeof pattern.regex).toBe('string');
        expect(typeof pattern.errorMessage).toBe('string');
      });
    });

    it('all pattern types should be unique', () => {
      const types = SdPatternCommons.map(p => p.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });

    it('all name and errorMessage values should be i18n keys (prefix core.)', () => {
      SdPatternCommons.forEach(pattern => {
        expect(pattern.name.startsWith('core.')).toBeTrue();
        expect(pattern.errorMessage.startsWith('core.')).toBeTrue();
      });
    });
  });
});
