import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ColumnTransformPipe } from './column-transform.pipe';
import { SdImportExcelItem, SdUploadExcelColumn } from '../import-excel.model';

describe('ColumnTransformPipe', () => {
  let pipe: ColumnTransformPipe;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;

  const SAFE_HTML = { __safe: true };

  const makeItem = <T extends Record<string, any>>(
    data: T,
    overrides: Partial<SdImportExcelItem<T>['meta']> = {}
  ): SdImportExcelItem<T> => ({
    data,
    meta: {
      excelIndex: 1,
      origin: data,
      error: {},
      errorMessages: [],
      warning: {},
      warningMessages: [],
      ...overrides,
    },
  });

  beforeEach(() => {
    sanitizer = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustHtml']);
    sanitizer.bypassSecurityTrustHtml.and.returnValue(SAFE_HTML as any);

    TestBed.configureTestingModule({
      providers: [ColumnTransformPipe, { provide: DomSanitizer, useValue: sanitizer }],
    });
    pipe = TestBed.inject(ColumnTransformPipe);
  });

  describe('error branch', () => {
    it('returns origin value when meta.error[field] is set and origin has value', async () => {
      const col: SdUploadExcelColumn = { field: 'name', title: 'N', type: 'string' };
      const item = makeItem({ name: 'current' }, { error: { name: 'bad' }, origin: { name: 'orig' } as any });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('orig');
    });

    it('falls back to current value when origin missing', async () => {
      const col: SdUploadExcelColumn = { field: 'name', title: 'N', type: 'string' };
      const item = makeItem({ name: 'current' }, { error: { name: 'bad' }, origin: {} as any });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('current');
    });

    it('falls back to "" when both origin and value missing', async () => {
      const col: SdUploadExcelColumn = { field: 'name', title: 'N', type: 'string' };
      const item = makeItem({ name: null }, { error: { name: 'bad' }, origin: {} as any });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });
  });

  describe('custom transform branch', () => {
    it('invokes sync transform with (data, value) and returns its result', async () => {
      const col: SdUploadExcelColumn = {
        field: 'x',
        title: 'X',
        type: 'string',
        transform: (data, value) => `${data.x}=${value}`,
      };
      const item = makeItem({ x: 'a' });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('a=a');
    });

    it('awaits async transform', async () => {
      const col: SdUploadExcelColumn = {
        field: 'x',
        title: 'X',
        type: 'string',
        transform: async (_data, value) => `async:${value}`,
      };
      const item = makeItem({ x: 'v' });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('async:v');
    });

    it('returns "" when transform resolves to null/undefined', async () => {
      const col: SdUploadExcelColumn = {
        field: 'x',
        title: 'X',
        type: 'string',
        transform: () => null as any,
      };
      const item = makeItem({ x: 'v' });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });

    it('transform takes precedence over type formatting', async () => {
      const col: SdUploadExcelColumn = {
        field: 'n',
        title: 'N',
        type: 'number',
        transform: () => 'overridden',
      };
      const item = makeItem({ n: 1234 });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('overridden');
    });
  });

  describe('type=number', () => {
    it('formats numeric value using NumberUtilities.toVN', async () => {
      const col: SdUploadExcelColumn = { field: 'n', title: 'N', type: 'number' };
      const item = makeItem({ n: 1234567 });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('1.234.567');
    });

    it('returns "" for null number', async () => {
      const col: SdUploadExcelColumn = { field: 'n', title: 'N', type: 'number' };
      const item = makeItem({ n: null });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });
  });

  describe('type=bool', () => {
    it('wraps boolean true into checked checkbox via bypassSecurityTrustHtml', async () => {
      const col: SdUploadExcelColumn = { field: 'b', title: 'B', type: 'bool' };
      const item = makeItem({ b: true });
      const result = await pipe.transform(item, col);
      expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
      const html = sanitizer.bypassSecurityTrustHtml.calls.mostRecent().args[0];
      expect(html).toContain('checked');
      expect(html).toContain('disabled');
      expect(result).toBe(SAFE_HTML as any);
    });

    it('wraps boolean false into unchecked checkbox', async () => {
      const col: SdUploadExcelColumn = { field: 'b', title: 'B', type: 'bool' };
      const item = makeItem({ b: false });
      await pipe.transform(item, col);
      const html = sanitizer.bypassSecurityTrustHtml.calls.mostRecent().args[0];
      expect(html).not.toContain('checked');
      expect(html).toContain('disabled');
    });

    it('returns "" for non-boolean value', async () => {
      const col: SdUploadExcelColumn = { field: 'b', title: 'B', type: 'bool' };
      const item = makeItem({ b: 'yes' });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
      expect(sanitizer.bypassSecurityTrustHtml).not.toHaveBeenCalled();
    });
  });

  describe('type=date', () => {
    it('uses default format dd/MM/yyyy when column.format absent', async () => {
      const col: SdUploadExcelColumn = { field: 'd', title: 'D', type: 'date' };
      const item = makeItem({ d: new Date(2024, 0, 5) });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('05/01/2024');
    });

    it('honours explicit column.format', async () => {
      const col: SdUploadExcelColumn = { field: 'd', title: 'D', type: 'date', format: 'dd/MM/yyyy' };
      const item = makeItem({ d: new Date(2024, 0, 5) });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('05/01/2024');
    });

    it('returns "" when date value is null', async () => {
      const col: SdUploadExcelColumn = { field: 'd', title: 'D', type: 'date' };
      const item = makeItem({ d: null });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });
  });

  describe('type=datetime', () => {
    it('uses default format dd/MM/yyyy HH:mm', async () => {
      const col: SdUploadExcelColumn = { field: 'd', title: 'D', type: 'datetime' };
      const item = makeItem({ d: new Date(2024, 0, 5, 9, 30) });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('05/01/2024 09:30');
    });

    it('returns "" for null', async () => {
      const col: SdUploadExcelColumn = { field: 'd', title: 'D', type: 'datetime' };
      const item = makeItem({ d: null });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });
  });

  describe('default branch', () => {
    it('returns value as-is for type=string', async () => {
      const col: SdUploadExcelColumn = { field: 's', title: 'S', type: 'string' };
      const item = makeItem({ s: 'plain' });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('plain');
    });

    it('returns "" when value is null', async () => {
      const col: SdUploadExcelColumn = { field: 's', title: 'S', type: 'string' };
      const item = makeItem({ s: null });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });

    it('returns "" when value is undefined', async () => {
      const col: SdUploadExcelColumn = { field: 's', title: 'S', type: 'string' };
      const item = makeItem({ s: undefined });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('');
    });

    it('returns value as-is for unknown / falsy-zero types', async () => {
      const col = { field: 'n', title: 'N', type: 'time' } as any;
      const item = makeItem({ n: 'raw' });
      await expectAsync(pipe.transform(item, col)).toBeResolvedTo('raw');
    });
  });
});
