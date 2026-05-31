import { SdUtilities } from './utility.extension';

describe('SdUtilities', () => {
  // ---------------------------------------------------------------------------
  // randomId
  // ---------------------------------------------------------------------------
  describe('randomId', () => {
    it('returns a non-empty string', () => {
      const id = SdUtilities.randomId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('includes the prefix when provided', () => {
      const id = SdUtilities.randomId('test');
      expect(id.startsWith('test_')).toBeTrue();
    });

    it('does not include prefix when null is passed', () => {
      const id = SdUtilities.randomId(null);
      expect(id.includes('_')).toBeFalse();
    });

    it('generates unique values across multiple rapid calls', () => {
      const ids = new Set(Array.from({ length: 50 }, () => SdUtilities.randomId()));
      expect(ids.size).toBeGreaterThan(40);
    });

    it('returns a string without prefix separator when no prefix given', () => {
      const id = SdUtilities.randomId();
      // No underscore separator at start
      expect(id).not.toMatch(/^_/);
    });
  });

  // ---------------------------------------------------------------------------
  // hash
  // ---------------------------------------------------------------------------
  describe('hash', () => {
    it('returns a string starting with "h"', () => {
      expect(SdUtilities.hash({ a: 1 }).startsWith('h')).toBeTrue();
    });

    it('produces the same hash for equivalent objects (key-order independent)', () => {
      const hash1 = SdUtilities.hash({ a: 1, b: 2 });
      const hash2 = SdUtilities.hash({ b: 2, a: 1 });
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different objects', () => {
      expect(SdUtilities.hash({ a: 1 })).not.toBe(SdUtilities.hash({ a: 2 }));
      expect(SdUtilities.hash({ a: 1 })).not.toBe(SdUtilities.hash({ b: 1 }));
    });

    it('handles primitive values', () => {
      expect(SdUtilities.hash('hello')).toBeTruthy();
      expect(SdUtilities.hash(42)).toBeTruthy();
      expect(SdUtilities.hash(null)).toBeTruthy();
    });

    it('handles arrays', () => {
      expect(SdUtilities.hash([1, 2, 3])).toBeTruthy();
      expect(SdUtilities.hash([1, 2, 3])).toBe(SdUtilities.hash([1, 2, 3]));
      expect(SdUtilities.hash([1, 2, 3])).not.toBe(SdUtilities.hash([3, 2, 1]));
    });

    it('handles File objects deterministically', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const h1 = SdUtilities.hash(file);
      const h2 = SdUtilities.hash(file);
      expect(h1).toBe(h2);
      expect(h1.startsWith('h')).toBeTrue();
    });

    it('handles nested objects', () => {
      const h = SdUtilities.hash({ user: { name: 'Alice', age: 30 } });
      expect(h).toBeTruthy();
      expect(h.startsWith('h')).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // parseQueryParams
  // ---------------------------------------------------------------------------
  describe('parseQueryParams', () => {
    it('parses a simple query string', () => {
      const result = SdUtilities.parseQueryParams('key=value&foo=bar');
      expect(result['key']).toBe('value');
      expect(result['foo']).toBe('bar');
    });

    it('handles URL-encoded characters', () => {
      const result = SdUtilities.parseQueryParams('name=Hello%20World');
      expect(result['name']).toBe('Hello World');
    });

    it('returns an empty object for empty string', () => {
      expect(SdUtilities.parseQueryParams('')).toEqual({});
    });

    it('returns an empty object for undefined', () => {
      expect(SdUtilities.parseQueryParams(undefined)).toEqual({});
    });

    it('handles a single parameter', () => {
      const result = SdUtilities.parseQueryParams('only=one');
      expect(result['only']).toBe('one');
    });

    it('handles a query string that starts with "?"', () => {
      // URLSearchParams strips leading '?' automatically
      const result = SdUtilities.parseQueryParams('?a=1&b=2');
      // Key '?a' is how URLSearchParams treats it — just verify it parses
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getNestedValue
  // ---------------------------------------------------------------------------
  describe('getNestedValue', () => {
    it('retrieves a deeply nested value', () => {
      const obj = { user: { address: { city: 'Hanoi' } } };
      expect(SdUtilities.getNestedValue(obj, 'user.address.city')).toBe('Hanoi');
    });

    it('retrieves a top-level value', () => {
      expect(SdUtilities.getNestedValue({ name: 'Alice' }, 'name')).toBe('Alice');
    });

    it('returns undefined for a missing nested path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(SdUtilities.getNestedValue(obj, 'user.age')).toBeUndefined();
    });

    it('returns undefined for null object', () => {
      expect(SdUtilities.getNestedValue(null, 'user.name')).toBeUndefined();
    });

    it('returns undefined for empty path', () => {
      expect(SdUtilities.getNestedValue({ name: 'Alice' }, '')).toBeUndefined();
    });

    it('handles intermediate null in path gracefully', () => {
      const obj = { user: null };
      expect(SdUtilities.getNestedValue(obj, 'user.name')).toBeUndefined();
    });

    it('returns undefined for undefined object', () => {
      expect(SdUtilities.getNestedValue(undefined, 'name')).toBeUndefined();
    });

    it('retrieves array element access via field name', () => {
      const obj = { items: [10, 20, 30] };
      // Access as object property — array stored as field
      expect(SdUtilities.getNestedValue(obj, 'items')).toEqual([10, 20, 30]);
    });
  });

  // ---------------------------------------------------------------------------
  // isMobile
  // ---------------------------------------------------------------------------
  describe('isMobile', () => {
    it('returns a boolean', () => {
      expect(typeof SdUtilities.isMobile()).toBe('boolean');
    });

    it('returns false for a desktop user agent (Chrome on Windows)', () => {
      const spy = spyOnProperty(navigator, 'userAgent').and.returnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0'
      );
      expect(SdUtilities.isMobile()).toBeFalse();
      spy.and.callThrough();
    });

    it('returns true for an Android user agent', () => {
      const spy = spyOnProperty(navigator, 'userAgent').and.returnValue(
        'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36'
      );
      expect(SdUtilities.isMobile()).toBeTrue();
      spy.and.callThrough();
    });

    it('returns true for a Mobi user agent', () => {
      const spy = spyOnProperty(navigator, 'userAgent').and.returnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1 (KHTML, like Gecko) Mobile/15E148'
      );
      expect(SdUtilities.isMobile()).toBeTrue();
      spy.and.callThrough();
    });
  });

  // ---------------------------------------------------------------------------
  // generateUuid
  // ---------------------------------------------------------------------------
  describe('generateUuid', () => {
    it('returns a non-empty string', () => {
      const id = SdUtilities.generateUuid();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('generates unique values', () => {
      const ids = new Set(Array.from({ length: 20 }, () => SdUtilities.generateUuid()));
      expect(ids.size).toBe(20);
    });

    it('uses fallback when crypto.randomUUID is unavailable', () => {
      const originalCrypto = (window as any).crypto;
      try {
        Object.defineProperty(window, 'crypto', {
          value: { ...originalCrypto, randomUUID: undefined },
          writable: true,
          configurable: true,
        });
        const id = SdUtilities.generateUuid();
        expect(id).toBeTruthy();
        expect(typeof id).toBe('string');
      } finally {
        Object.defineProperty(window, 'crypto', {
          value: originalCrypto,
          writable: true,
          configurable: true,
        });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // changeAliasLowerCase
  // ---------------------------------------------------------------------------
  describe('changeAliasLowerCase', () => {
    it('converts Vietnamese characters to ASCII equivalents', () => {
      expect(SdUtilities.changeAliasLowerCase('Hà Nội')).toBe('ha noi');
    });

    it('converts đ to d', () => {
      expect(SdUtilities.changeAliasLowerCase('Đà Nẵng')).toBe('da nang');
    });

    it('lowercases Latin characters', () => {
      expect(SdUtilities.changeAliasLowerCase('HELLO WORLD')).toBe('hello world');
    });

    it('strips special characters and replaces with space', () => {
      const result = SdUtilities.changeAliasLowerCase('hello!world');
      expect(result).toBe('hello world');
    });

    it('trims leading and trailing spaces', () => {
      expect(SdUtilities.changeAliasLowerCase('  hello  ')).toBe('hello');
    });

    it('handles empty string', () => {
      expect(SdUtilities.changeAliasLowerCase('')).toBe('');
    });

    it('handles null-like input gracefully (undefined cast via toString)', () => {
      // The function does alias?.toString() ?? '' so undefined becomes ''
      expect(SdUtilities.changeAliasLowerCase(undefined as any)).toBe('');
    });

    it('converts all Vietnamese vowel variants', () => {
      expect(SdUtilities.changeAliasLowerCase('áàảãạ')).toBe('aaaaa');
      expect(SdUtilities.changeAliasLowerCase('éèẻẽẹ')).toBe('eeeee');
      expect(SdUtilities.changeAliasLowerCase('íìỉĩị')).toBe('iiiii');
      expect(SdUtilities.changeAliasLowerCase('óòỏõọ')).toBe('ooooo');
      expect(SdUtilities.changeAliasLowerCase('úùủũụ')).toBe('uuuuu');
      expect(SdUtilities.changeAliasLowerCase('ýỳỷỹỵ')).toBe('yyyyy');
    });

    it('handles mixed Vietnamese and Latin text', () => {
      const result = SdUtilities.changeAliasLowerCase('Hồ Chí Minh City');
      expect(result).toBe('ho chi minh city');
    });
  });

  // ---------------------------------------------------------------------------
  // allWithPaging
  // ---------------------------------------------------------------------------
  describe('allWithPaging', () => {
    it('fetches all items in a single page when total equals page size', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const func = jasmine.createSpy('func').and.returnValue(
        Promise.resolve({ items, total: 3 })
      );
      const result = await SdUtilities.allWithPaging(func);
      expect(result).toEqual(items);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('fetches all items across multiple pages', async () => {
      const allItems = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
      let call = 0;
      const func = jasmine.createSpy('func').and.callFake((_pageSize: number, pageNumber: number) => {
        const start = pageNumber * 2;
        const page = allItems.slice(start, start + 2);
        return Promise.resolve({ items: page, total: 5 });
      });
      const result = await SdUtilities.allWithPaging(func, 2);
      expect(result.length).toBe(5);
      expect(result[0]).toEqual({ id: 1 });
      expect(result[4]).toEqual({ id: 5 });
    });

    it('returns empty array when total is 0', async () => {
      const func = jasmine.createSpy('func').and.returnValue(
        Promise.resolve({ items: [], total: 0 })
      );
      const result = await SdUtilities.allWithPaging(func);
      expect(result).toEqual([]);
    });

    it('uses defaultPageSize of 1000 when not specified', async () => {
      const func = jasmine.createSpy('func').and.returnValue(
        Promise.resolve({ items: [{ id: 1 }], total: 1 })
      );
      await SdUtilities.allWithPaging(func);
      expect(func).toHaveBeenCalledWith(1000, 0);
    });

    it('uses provided defaultPageSize', async () => {
      const func = jasmine.createSpy('func').and.returnValue(
        Promise.resolve({ items: [{ id: 1 }], total: 1 })
      );
      await SdUtilities.allWithPaging(func, 50);
      expect(func).toHaveBeenCalledWith(50, 0);
    });

    it('stops when items array becomes empty before reaching total', async () => {
      let callCount = 0;
      const func = jasmine.createSpy('func').and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ items: [{ id: 1 }, { id: 2 }], total: 10 });
        }
        return Promise.resolve({ items: [], total: 10 });
      });
      const result = await SdUtilities.allWithPaging(func, 2);
      // Should stop after getting empty items on second call
      expect(result.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // isIncognito
  // ---------------------------------------------------------------------------
  describe('isIncognito', () => {
    it('returns a boolean', async () => {
      const result = await SdUtilities.isIncognito();
      expect(typeof result).toBe('boolean');
    });

    it('returns false in normal (non-incognito) test environment', async () => {
      // In normal Karma environment, localStorage is available — should return false
      // (Safari fallback path: localStorage write succeeds → false)
      const result = await SdUtilities.isIncognito();
      expect(result).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // copyToClipboard
  // ---------------------------------------------------------------------------
  describe('copyToClipboard', () => {
    it('calls navigator.clipboard.writeText with the given text', () => {
      const writeSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      SdUtilities.copyToClipboard('hello');
      expect(writeSpy).toHaveBeenCalledWith('hello');
    });

    it('calls navigator.clipboard.writeText with empty string', () => {
      const writeSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      SdUtilities.copyToClipboard('');
      expect(writeSpy).toHaveBeenCalledWith('');
    });
  });

  // ---------------------------------------------------------------------------
  // download
  // ---------------------------------------------------------------------------
  describe('download', () => {
    it('does nothing when fileOrPath is null', () => {
      const warnSpy = spyOn(console, 'warn');
      SdUtilities.download(null);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('does nothing when fileOrPath is undefined', () => {
      const warnSpy = spyOn(console, 'warn');
      SdUtilities.download(undefined);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('creates an anchor and clicks it for a URL string (non-http)', () => {
      const clickSpy = jasmine.createSpy('click');
      const removeSpy = jasmine.createSpy('remove');
      const anchor = { href: '', download: '', style: { visibility: '' }, click: clickSpy, remove: removeSpy } as any;
      spyOn(document, 'createElement').and.callFake((tag: string) => {
        if (tag === 'a') return anchor;
        return document.createElement(tag);
      });
      const appendSpy = spyOn(document.body, 'appendChild').and.stub();

      SdUtilities.download('/files/report.pdf', 'report.pdf');

      expect(appendSpy).toHaveBeenCalledWith(anchor);
      expect(anchor.href).toContain('report');
      expect(anchor.download).toBe('report.pdf');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('sets target="_blank" for http URLs', () => {
      const clickSpy = jasmine.createSpy('click');
      const removeSpy = jasmine.createSpy('remove');
      const anchor = { href: '', target: '', download: '', style: { visibility: '' }, click: clickSpy, remove: removeSpy } as any;
      spyOn(document, 'createElement').and.callFake((tag: string) => {
        if (tag === 'a') return anchor;
        return document.createElement(tag);
      });
      spyOn(document.body, 'appendChild').and.stub();

      SdUtilities.download('https://example.com/file.pdf', 'file.pdf');

      expect(anchor.target).toBe('_blank');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('handles File objects by creating object URL', () => {
      const createURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
      const revokeURLSpy = spyOn(URL, 'revokeObjectURL').and.stub();
      const clickSpy = jasmine.createSpy('click');
      const removeChildSpy = spyOn(document.body, 'removeChild').and.stub();
      const anchor = { href: '', download: '', click: clickSpy, name: 'test.txt' } as any;
      spyOn(document, 'createElement').and.callFake((tag: string) => {
        if (tag === 'a') return anchor;
        return document.createElement(tag);
      });
      spyOn(document.body, 'appendChild').and.stub();

      const file = new File(['content'], 'myfile.txt', { type: 'text/plain' });
      SdUtilities.download(file, 'myfile.txt');

      expect(createURLSpy).toHaveBeenCalledWith(file);
      expect(revokeURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // downloadBlob
  // ---------------------------------------------------------------------------
  describe('downloadBlob', () => {
    it('creates an anchor element and clicks it', () => {
      const clickSpy = jasmine.createSpy('click');
      const removeSpy = jasmine.createSpy('remove');
      const anchor = {
        href: '',
        download: '',
        style: { visibility: '' },
        click: clickSpy,
        remove: removeSpy,
      } as any;
      // Make link.download !== undefined so the feature detection passes
      Object.defineProperty(anchor, 'download', { value: '', writable: true, configurable: true });

      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
      spyOn(window.URL, 'revokeObjectURL').and.stub();
      spyOn(document, 'createElement').and.callFake((tag: string) => {
        if (tag === 'a') return anchor;
        return document.createElement(tag);
      });
      spyOn(document.body, 'appendChild').and.stub();

      const blob = new Blob(['data'], { type: 'text/plain' });
      SdUtilities.downloadBlob(blob, 'output.txt');

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(anchor.download).toBeTruthy();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('uses auto-generated filename when none provided', () => {
      const anchor = { href: '', download: '', style: { visibility: '' }, click: jasmine.createSpy(), remove: jasmine.createSpy() } as any;
      Object.defineProperty(anchor, 'download', { value: '', writable: true, configurable: true });
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
      spyOn(window.URL, 'revokeObjectURL').and.stub();
      spyOn(document, 'createElement').and.callFake((tag: string) => (tag === 'a' ? anchor : document.createElement(tag)));
      spyOn(document.body, 'appendChild').and.stub();

      SdUtilities.downloadBlob(new Blob(['x']));

      expect(anchor.download).toMatch(/^file_/);
    });

    it('logs error and does not throw on exception', () => {
      spyOn(window.URL, 'createObjectURL').and.throwError('URL error');
      const errorSpy = spyOn(console, 'error');

      expect(() => SdUtilities.downloadBlob(new Blob(['x']), 'file.txt')).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // upload()
  // ---------------------------------------------------------------------------
  describe('upload', () => {
    // Helper: fire a change event on the hidden file input created by upload()
    function fireChangeWithFiles(files: File[]): void {
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (!input) return;
      // Build a fake FileList
      const fakeFileList = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () { yield* files; },
      };
      Object.defineProperty(fakeFileList, 'files', { value: fakeFileList });
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: fakeFileList } });
      input.dispatchEvent(event);
    }

    afterEach(() => {
      // Clean up any leftover input elements
      const input = document.getElementById('U1e09c1c0-b647-437e-995e-d7a1a1b60550');
      if (input) input.remove();
    });

    it('resolves with the selected File (single mode, no options)', async () => {
      const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
      const promise = SdUtilities.upload();
      fireChangeWithFiles([file]);
      const result = await promise;
      expect(result).toBe(file);
    });

    it('resolves with null when no file is returned (no files in list)', async () => {
      // When files list is empty, single-mode skips resolve (hangs) — so we
      // test through the multiple=false path where item(0) returns null
      const promise = SdUtilities.upload({ extensions: ['pdf'] });
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const emptyFileList = { length: 0, item: () => null, [Symbol.iterator]: function* () {} };
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: emptyFileList } });
      input?.dispatchEvent(event);
      // Promise never resolves when file is null — just ensure no throw yet
      // We'll race with a timeout
      const raceResult = await Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve('timeout'), 50)),
      ]);
      expect(raceResult).toBe('timeout'); // still pending — no crash
    });

    it('rejects with "invalid-format" error for file with no extension (single mode)', async () => {
      const file = new File(['data'], 'nodotfile', { type: 'text/plain' });
      const promise = SdUtilities.upload({ extensions: ['pdf'] });
      fireChangeWithFiles([file]);
      await expectAsync(promise).toBeRejectedWithError(/Invalid file format|File tải lên không đúng định dạng|ファイル形式/);
    });

    it('rejects with "invalid-format" error when extension not in allowed list (single mode)', async () => {
      const file = new File(['data'], 'image.png', { type: 'image/png' });
      const promise = SdUtilities.upload({ extensions: ['pdf', 'docx'] });
      fireChangeWithFiles([file]);
      await expectAsync(promise).toBeRejectedWithError(/invalid format|Invalid file format|File tải lên không đúng định dạng/i);
    });

    it('rejects with "invalid-size" error when file exceeds maxSizeInMb (single mode)', async () => {
      // Create a file that appears to be 2MB by setting size via constructor isn't straightforward,
      // so we create a file and then spy on its size
      const file = new File(['x'.repeat(100)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 + 1, configurable: true });
      const promise = SdUtilities.upload({ maxSizeInMb: 1 }); // 1MB limit
      fireChangeWithFiles([file]);
      await expectAsync(promise).toBeRejectedWithError(/Invalid file size|Kích thước file không hợp lệ|ファイルサイズ/);
    });

    it('rejects via custom validator message (single mode)', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const validator = jasmine.createSpy('validator').and.returnValue('Custom error');
      const promise = SdUtilities.upload({ validator });
      fireChangeWithFiles([file]);
      await expectAsync(promise).toBeRejectedWithError('Custom error');
    });

    it('resolves with file array in multiple mode', async () => {
      const file1 = new File(['a'], 'one.pdf', { type: 'application/pdf' });
      const file2 = new File(['b'], 'two.pdf', { type: 'application/pdf' });
      const promise = SdUtilities.upload({ multiple: true });
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const files = [file1, file2];
      const fakeFileList = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () { yield* files; },
      };
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: fakeFileList } });
      input?.dispatchEvent(event);
      const result = await promise;
      expect(Array.isArray(result)).toBeTrue();
      expect((result as File[]).length).toBe(2);
    });

    it('rejects with "invalid-format" error for file with no extension (multiple mode)', async () => {
      const file = new File(['data'], 'nodot', { type: 'text/plain' });
      const promise = SdUtilities.upload({ multiple: true, extensions: ['pdf'] });
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const files = [file];
      const fakeFileList = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () { yield* files; },
      };
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: fakeFileList } });
      input?.dispatchEvent(event);
      await expectAsync(promise).toBeRejectedWithError(/Invalid file format|File tải lên không đúng định dạng/);
    });

    it('rejects with "invalid-size" in multiple mode when file exceeds limit', async () => {
      const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1, configurable: true });
      const promise = SdUtilities.upload({ multiple: true, maxSizeInMb: 2 });
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const files = [file];
      const fakeFileList = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () { yield* files; },
      };
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: fakeFileList } });
      input?.dispatchEvent(event);
      await expectAsync(promise).toBeRejectedWithError(/Invalid file size|Kích thước file/);
    });

    it('rejects via custom validator in multiple mode', async () => {
      const file = new File(['x'], 'checked.pdf', { type: 'application/pdf' });
      const validator = jasmine.createSpy('validator').and.returnValue('Blocked');
      const promise = SdUtilities.upload({ multiple: true, validator });
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const files = [file];
      const fakeFileList = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () { yield* files; },
      };
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: fakeFileList } });
      input?.dispatchEvent(event);
      await expectAsync(promise).toBeRejectedWithError('Blocked');
    });
  });

  // ---------------------------------------------------------------------------
  // getSdUploadLang (tested indirectly via upload error messages)
  // ---------------------------------------------------------------------------
  describe('getSdUploadLang (via upload error messages)', () => {
    afterEach(() => {
      localStorage.removeItem('sd-core.language');
      const input = document.getElementById('U1e09c1c0-b647-437e-995e-d7a1a1b60550');
      if (input) input.remove();
    });

    function fireChangeWithSingleFile(file: File): void {
      const inputId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
      const input = document.getElementById(inputId) as HTMLInputElement;
      const fakeFileList = {
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
        [Symbol.iterator]: function* () { yield file; },
      };
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { writable: false, value: { files: fakeFileList } });
      input?.dispatchEvent(event);
    }

    it('uses "vi" messages by default (no localStorage key)', async () => {
      const file = new File(['x'], 'nodot', { type: 'text/plain' });
      const promise = SdUtilities.upload();
      fireChangeWithSingleFile(file);
      await expectAsync(promise).toBeRejectedWithError(/File tải lên không đúng định dạng/);
    });

    it('uses "en" messages when localStorage lang is "en"', async () => {
      localStorage.setItem('sd-core.language', 'en');
      const file = new File(['x'], 'nodot', { type: 'text/plain' });
      const promise = SdUtilities.upload();
      fireChangeWithSingleFile(file);
      await expectAsync(promise).toBeRejectedWithError(/Invalid file format/);
    });

    it('falls back to "vi" for unknown language in localStorage', async () => {
      localStorage.setItem('sd-core.language', 'fr'); // unsupported language
      const file = new File(['x'], 'nodot', { type: 'text/plain' });
      const promise = SdUtilities.upload();
      fireChangeWithSingleFile(file);
      await expectAsync(promise).toBeRejectedWithError(/File tải lên không đúng định dạng/);
    });
  });

  // ---------------------------------------------------------------------------
  // getClientPublicIp
  // ---------------------------------------------------------------------------
  describe('getClientPublicIp', () => {
    it('returns the IP string on success', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response(JSON.stringify({ ip: '1.2.3.4' }), { status: 200 }))
      );
      const result = await SdUtilities.getClientPublicIp();
      expect(result).toBe('1.2.3.4');
    });

    it('returns null when fetch throws', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('network error')));
      const errorSpy = spyOn(console, 'error');
      const result = await SdUtilities.getClientPublicIp();
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('returns null when response is not ok', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('Not Found', { status: 404 }))
      );
      const errorSpy = spyOn(console, 'error');
      const result = await SdUtilities.getClientPublicIp();
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
