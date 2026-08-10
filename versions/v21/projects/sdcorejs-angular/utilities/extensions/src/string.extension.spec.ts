import { StringUtilities, ValidationUtilities } from './string.extension';

describe('StringUtilities', () => {
  describe('isNullOrEmpty', () => {
    it('returns true for null, undefined, empty string', () => {
      expect(StringUtilities.isNullOrEmpty(null)).toBeTrue();
      expect(StringUtilities.isNullOrEmpty(undefined)).toBeTrue();
      expect(StringUtilities.isNullOrEmpty('')).toBeTrue();
    });

    it('returns false for non-empty values', () => {
      expect(StringUtilities.isNullOrEmpty('hello')).toBeFalse();
      expect(StringUtilities.isNullOrEmpty(' ')).toBeFalse();
      expect(StringUtilities.isNullOrEmpty(0)).toBeFalse();
      expect(StringUtilities.isNullOrEmpty(false)).toBeFalse();
    });
  });

  describe('isNullOrWhiteSpace', () => {
    it('returns true for null, undefined, empty string', () => {
      expect(StringUtilities.isNullOrWhiteSpace(null)).toBeTrue();
      expect(StringUtilities.isNullOrWhiteSpace(undefined)).toBeTrue();
      expect(StringUtilities.isNullOrWhiteSpace('')).toBeTrue();
    });

    it('returns true for strings containing only whitespace characters', () => {
      expect(StringUtilities.isNullOrWhiteSpace('   ')).toBeTrue();
      expect(StringUtilities.isNullOrWhiteSpace('\t')).toBeTrue();
      expect(StringUtilities.isNullOrWhiteSpace('\n')).toBeTrue();
    });

    it('returns false for non-whitespace strings', () => {
      expect(StringUtilities.isNullOrWhiteSpace('hello')).toBeFalse();
      expect(StringUtilities.isNullOrWhiteSpace('  a  ')).toBeFalse();
    });

    it('returns true for non-string types', () => {
      expect(StringUtilities.isNullOrWhiteSpace(0 as any)).toBeTrue();

      expect(StringUtilities.isNullOrWhiteSpace([] as any)).toBeTrue();
    });
  });

  describe('ValidationUtilities.isEmail', () => {
    it('returns true for valid emails', () => {
      expect(ValidationUtilities.isEmail('user@example.com')).toBeTrue();
      expect(ValidationUtilities.isEmail('user.name+tag@sub.domain.com')).toBeTrue();
      expect(ValidationUtilities.isEmail('test123@company.org')).toBeTrue();
    });

    it('returns false for invalid emails', () => {
      expect(ValidationUtilities.isEmail('not-an-email')).toBeFalse();
      expect(ValidationUtilities.isEmail('@domain.com')).toBeFalse();
      expect(ValidationUtilities.isEmail('user@')).toBeFalse();
      expect(ValidationUtilities.isEmail('')).toBeFalse();
      expect(ValidationUtilities.isEmail(null)).toBeFalse();
      expect(ValidationUtilities.isEmail(undefined)).toBeFalse();
    });
  });

  describe('ValidationUtilities.isPhone', () => {
    it('returns true for valid phone numbers', () => {
      expect(ValidationUtilities.isPhone('0901234567')).toBeTrue();
      expect(ValidationUtilities.isPhone('+84901234567')).toBeTrue();
      expect(ValidationUtilities.isPhone('(+84)901234567')).toBeTrue();
      expect(ValidationUtilities.isPhone('090-123-4567')).toBeTrue();
    });

    it('returns false for invalid phone numbers', () => {
      expect(ValidationUtilities.isPhone('')).toBeFalse();
      expect(ValidationUtilities.isPhone(null)).toBeFalse();
      expect(ValidationUtilities.isPhone('abc')).toBeFalse();
    });
  });

  describe('ValidationUtilities.isCode', () => {
    it('returns true for valid codes (2-20 alphanumeric + @_-)', () => {
      expect(ValidationUtilities.isCode('abc123')).toBeTrue();
      expect(ValidationUtilities.isCode('My_Code-01')).toBeTrue();
      expect(ValidationUtilities.isCode('ab')).toBeTrue();
    });

    it('returns false for too short codes', () => {
      expect(ValidationUtilities.isCode('a')).toBeFalse();
    });

    it('returns false for too long codes', () => {
      expect(ValidationUtilities.isCode('a'.repeat(21))).toBeFalse();
    });

    it('returns false for codes with spaces or invalid characters', () => {
      expect(ValidationUtilities.isCode('abc def')).toBeFalse();
      expect(ValidationUtilities.isCode('abc!')).toBeFalse();
    });

    it('returns false for empty, null, undefined', () => {
      expect(ValidationUtilities.isCode('')).toBeFalse();
      expect(ValidationUtilities.isCode(null)).toBeFalse();
      expect(ValidationUtilities.isCode(undefined)).toBeFalse();
    });
  });

  describe('changeAliasLowerCase', () => {
    it('converts Vietnamese characters to ASCII lowercase', () => {
      expect(StringUtilities.changeAliasLowerCase('Hà Nội')).toBe('ha noi');
      expect(StringUtilities.changeAliasLowerCase('Bình Dương')).toBe('binh duong');
      expect(StringUtilities.changeAliasLowerCase('Đội Kỹ Thuật')).toBe('doi ky thuat');
    });

    it('converts uppercase ASCII to lowercase', () => {
      expect(StringUtilities.changeAliasLowerCase('HELLO')).toBe('hello');
    });

    it('handles empty and null input gracefully', () => {
      expect(StringUtilities.changeAliasLowerCase('')).toBe('');

      expect(StringUtilities.changeAliasLowerCase(null as any)).toBe('');
    });

    it('trims leading and trailing whitespace', () => {
      expect(StringUtilities.changeAliasLowerCase('  hello  ')).toBe('hello');
    });
  });

  describe('aliasIncludes', () => {
    it('returns true when alias includes search text (case/diacritics insensitive)', () => {
      expect(StringUtilities.aliasIncludes('Hà Nội', 'ha noi')).toBeTrue();
      expect(StringUtilities.aliasIncludes('Đội Kỹ Thuật', 'ky thuat')).toBeTrue();
      expect(StringUtilities.aliasIncludes('Hello World', 'HELLO')).toBeTrue();
    });

    it('returns false when alias does not include search text', () => {
      expect(StringUtilities.aliasIncludes('Hà Nội', 'Sài Gòn')).toBeFalse();
      expect(StringUtilities.aliasIncludes('abc', 'xyz')).toBeFalse();
    });
  });

  describe('format', () => {
    it('replaces indexed placeholders with arguments', () => {
      expect(StringUtilities.format('Hello {0}!', 'World')).toBe('Hello World!');
      expect(StringUtilities.format('{0} + {1} = {2}', 1, 2, 3)).toBe('1 + 2 = 3');
    });

    it('replaces all occurrences of the same placeholder', () => {
      expect(StringUtilities.format('{0} and {0}', 'X')).toBe('X and X');
    });

    it('leaves unfilled placeholders unchanged', () => {
      expect(StringUtilities.format('Hello {0} and {1}!', 'Alice')).toBe('Hello Alice and {1}!');
    });
  });

  describe('templateToDisplay', () => {
    it('replaces ${key} placeholders with entity values', () => {
      const entity = { name: 'Test', code: 'T01' };
      expect(StringUtilities.templateToDisplay('[${code}] ${name}', entity)).toBe('[T01] Test');
    });

    it('resolves nested path placeholders', () => {
      const entity = { user: { name: 'Alice' } };
      expect(StringUtilities.templateToDisplay('${user.name}', entity)).toBe('Alice');
    });

    it('replaces missing keys with empty string', () => {
      expect(StringUtilities.templateToDisplay('${missing}', {})).toBe('');
    });

    it('returns template unchanged when empty', () => {
      expect(StringUtilities.templateToDisplay('', {})).toBe('');
    });
  });

  describe('parseExpression', () => {
    it('returns undefined for empty/null input', () => {
      expect(StringUtilities.parseExpression('', {})).toBeUndefined();
    });

    it('returns literal boolean true/false', () => {
      expect(StringUtilities.parseExpression('true', {})).toBeTrue();
      expect(StringUtilities.parseExpression('false', {})).toBeFalse();
    });

    it('returns literal null', () => {
      expect(StringUtilities.parseExpression('null', {})).toBeNull();
    });

    it('returns literal undefined', () => {
      expect(StringUtilities.parseExpression('undefined', {})).toBeUndefined();
    });

    it('returns numeric literal as number', () => {
      expect(StringUtilities.parseExpression('42', {})).toBe(42);
      expect(StringUtilities.parseExpression('-3.14', {})).toBe(-3.14);
    });

    it('returns entity value for exact ${path} placeholder', () => {
      const entity = { age: 30, active: true };
      expect(StringUtilities.parseExpression('${age}', entity)).toBe(30);
      expect(StringUtilities.parseExpression('${active}', entity)).toBeTrue();
    });

    it('falls back to templateToDisplay for mixed templates', () => {
      const entity = { name: 'Alice' };
      expect(StringUtilities.parseExpression('Hi ${name}!', entity)).toBe('Hi Alice!');
    });
  });

  describe('convertToSnakeCaseCode', () => {
    it('converts Vietnamese names to snake_case', () => {
      expect(StringUtilities.convertToSnakeCaseCode('Đội Kỹ Thuật')).toBe('doi_ky_thuat');
      expect(StringUtilities.convertToSnakeCaseCode('Hà Nội')).toBe('ha_noi');
    });

    it('converts English names to snake_case', () => {
      expect(StringUtilities.convertToSnakeCaseCode('Hello World')).toBe('hello_world');
      expect(StringUtilities.convertToSnakeCaseCode('My Feature Name')).toBe('my_feature_name');
    });

    it('removes leading/trailing underscores', () => {
      const result = StringUtilities.convertToSnakeCaseCode('  Hello  ');
      expect(result.startsWith('_')).toBeFalse();
      expect(result.endsWith('_')).toBeFalse();
    });

    it('throws an error for non-string input', () => {
      expect(() => StringUtilities.convertToSnakeCaseCode(null as any)).toThrow();

      expect(() => StringUtilities.convertToSnakeCaseCode(123 as any)).toThrow();
    });
  });

  describe('generateUniqueCode', () => {
    it('returns the base code when there is no conflict', () => {
      expect(StringUtilities.generateUniqueCode('Test', [])).toBe('test');
      expect(StringUtilities.generateUniqueCode('Hello World', ['other'])).toBe('hello_world');
    });

    it('appends _1 when base code conflicts', () => {
      expect(StringUtilities.generateUniqueCode('Test', ['test'])).toBe('test_1');
    });

    it('increments suffix until a unique code is found', () => {
      expect(StringUtilities.generateUniqueCode('Test', ['test', 'test_1', 'test_2'])).toBe('test_3');
    });
  });

  describe('REGEX_VN_ID (CCCD)', () => {
    it('validates 12-digit CCCD', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID);
      expect(regex.test('034201012345')).toBeTrue();
      expect(regex.test('123456789012')).toBeTrue();
    });

    it('rejects 9-digit CMND cũ (CCCD chỉ chấp nhận 12 số)', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID);
      expect(regex.test('123456789')).toBeFalse();
      expect(regex.test('034201012')).toBeFalse();
    });

    it('rejects invalid VN_ID values', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID);
      expect(regex.test('12345678')).toBeFalse(); // 8 digits
      expect(regex.test('12345678901')).toBeFalse(); // 11 digits
      expect(regex.test('1234567890123')).toBeFalse(); // 13 digits
      expect(regex.test('123456789012A')).toBeFalse(); // contains letter
      expect(regex.test('A34201012345')).toBeFalse(); // contains letter
      expect(regex.test('')).toBeFalse(); // empty
    });
  });

  describe('REGEX_PASSPORT (Hộ chiếu)', () => {
    it('validates passport with 1 uppercase letter + 7 digits', () => {
      const regex = new RegExp(StringUtilities.REGEX_PASSPORT);
      expect(regex.test('A1234567')).toBeTrue();
      expect(regex.test('Z9999999')).toBeTrue();
    });

    it('rejects passport with lowercase letters', () => {
      const regex = new RegExp(StringUtilities.REGEX_PASSPORT);
      expect(regex.test('a1234567')).toBeFalse();
      expect(regex.test('z9999999')).toBeFalse();
    });

    it('rejects invalid passport formats', () => {
      const regex = new RegExp(StringUtilities.REGEX_PASSPORT);
      expect(regex.test('A123456')).toBeFalse(); // 6 digits
      expect(regex.test('A12345678')).toBeFalse(); // 8 digits
      expect(regex.test('AB1234567')).toBeFalse(); // 2 letters
      expect(regex.test('1A234567')).toBeFalse(); // letter not at start
      expect(regex.test('')).toBeFalse(); // empty
    });
  });

  describe('REGEX_VN_ID_OR_PASSPORT (CCCD/Hộ chiếu)', () => {
    it('validates 12-digit CCCD', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT);
      expect(regex.test('034201012345')).toBeTrue();
      expect(regex.test('123456789012')).toBeTrue();
    });

    it('validates passport format', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT);
      expect(regex.test('A1234567')).toBeTrue();
      expect(regex.test('Z9999999')).toBeTrue();
    });

    it('rejects 9-digit CMND cũ (chỉ chấp nhận CCCD 12 số hoặc passport)', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT);
      expect(regex.test('123456789')).toBeFalse();
    });

    it('rejects mixed/invalid formats', () => {
      const regex = new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT);
      expect(regex.test('12345678')).toBeFalse(); // 8 digits
      expect(regex.test('a1234567')).toBeFalse(); // lowercase letter
      expect(regex.test('AB1234567')).toBeFalse(); // 2 letters
      expect(regex.test('')).toBeFalse(); // empty
    });
  });

  describe('encrypt / decrypt', () => {
    it('decrypts what was encrypted (round-trip)', () => {
      const original = { id: 1, name: 'Alice' };
      const encrypted = StringUtilities.encrypt(original);
      const decrypted = StringUtilities.decrypt(encrypted);
      expect(decrypted).toEqual(original);
    });

    it('handles nested objects in round-trip', () => {
      const original = { user: { name: 'Bob', roles: ['admin', 'user'] } };
      expect(StringUtilities.decrypt(StringUtilities.encrypt(original))).toEqual(original);
    });

    it('throws when decrypting an invalid string that does not start with SALT', () => {
      expect(() => StringUtilities.decrypt('invalid-string')).toThrow();
    });
  });
});
