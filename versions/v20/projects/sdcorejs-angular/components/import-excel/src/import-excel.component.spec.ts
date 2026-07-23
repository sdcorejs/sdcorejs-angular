import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdExcelService } from '@sdcorejs/angular/services/excel';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SdImportExcel } from './import-excel.component';
import { SdImportExcelOption } from './import-excel.model';

describe('SdImportExcel', () => {
  let fixture: ComponentFixture<SdImportExcel>;
  let component: SdImportExcel;
  let excel: {
    upload: jasmine.Spy;
    generateTemplate: jasmine.Spy;
    export: jasmine.Spy;
  };
  let notify: { warning: jasmine.Spy; error: jasmine.Spy };
  let loading: { start: jasmine.Spy; stop: jasmine.Spy };
  let paginator: { pageIndex: number; pageSize: number; page: Subject<void> };

  beforeEach(() => {
    excel = {
      upload: jasmine.createSpy('upload'),
      generateTemplate: jasmine.createSpy('generateTemplate').and.resolveTo(),
      export: jasmine.createSpy('export').and.resolveTo(),
    };
    notify = { warning: jasmine.createSpy('warning'), error: jasmine.createSpy('error') };
    loading = { start: jasmine.createSpy('start'), stop: jasmine.createSpy('stop') };
    TestBed.configureTestingModule({
      imports: [SdImportExcel],
      providers: [
        { provide: SdExcelService, useValue: excel },
        { provide: SdNotifyService, useValue: notify },
        { provide: SdLoadingService, useValue: loading },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    });
    fixture = TestBed.createComponent(SdImportExcel);
    component = fixture.componentInstance;
    paginator = { pageIndex: 0, pageSize: 10, page: new Subject<void>() };
    component.paginator = paginator as unknown as MatPaginator;
    component.modal = { open: jasmine.createSpy('open'), close: jasmine.createSpy('close') } as never;
  });

  function baseOption(overrides: Partial<SdImportExcelOption> = {}): SdImportExcelOption {
    return {
      columns: [{ field: 'name', title: 'Name', type: 'string', required: true }],
      accept: jasmine.createSpy('accept'),
      ...overrides,
    };
  }

  it('resets state on open, closes the modal, and emits closed', () => {
    component.excelItems = [
      { data: {}, meta: { excelIndex: 1, origin: {}, error: {}, warning: {}, errorMessages: [], warningMessages: [] } },
    ];
    const closed = jasmine.createSpy('closed');
    component.sdClosed.subscribe(closed);

    component.open();
    component.close();
    component.onClosed();

    expect(component.excelItems).toEqual([]);
    expect(component.modal.open).toHaveBeenCalled();
    expect(component.modal.close).toHaveBeenCalled();
    expect(closed).toHaveBeenCalled();
  });

  it('warns for empty uploads and row limits without entering loading state', async () => {
    const file = new File(['x'], 'empty.xlsx');
    component.option = baseOption({ limit: 1 });
    excel.upload.and.resolveTo({ items: [['Name']], file });

    await component.upload();
    expect(notify.warning).toHaveBeenCalledWith('core.component.import-excel.no-data-in-file');

    excel.upload.and.resolveTo({ items: [['Name'], { name: 'A' }, { name: 'B' }], file });
    await component.upload();
    expect(notify.warning).toHaveBeenCalledWith('core.component.import-excel.row-limit');
    expect(loading.start).not.toHaveBeenCalled();
  });

  it('normalizes valid rows and reports every supported validation failure', async () => {
    const file = new File(['data'], 'rows.xlsx');
    component.option = baseOption({
      columns: [
        { field: 'required', title: 'Required', type: 'string', required: true },
        { field: 'defaulted', title: 'Defaulted', type: 'string', defaultValue: 'fallback' },
        { field: 'short', title: 'Short', type: 'string', minlength: 3 },
        { field: 'long', title: 'Long', type: 'string', maxlength: 2 },
        { field: 'number', title: 'Number', type: 'number' },
        { field: 'low', title: 'Low', type: 'number', min: 2 },
        { field: 'high', title: 'High', type: 'number', max: 8 },
        { field: 'emptyNumber', title: 'Empty number', type: 'number' },
        { field: 'bool', title: 'Bool', type: 'bool' },
        { field: 'boolFalse', title: 'Bool false', type: 'bool' },
        { field: 'boolEmpty', title: 'Bool empty', type: 'bool' },
        { field: 'valueType', title: 'Value type', type: 'values', values: ['A'] },
        { field: 'valueList', title: 'Value list', type: 'values', values: ['A'], checkValueInArray: true },
        { field: 'date', title: 'Date', type: 'date', format: 'dd/MM/yyyy' },
        { field: 'time', title: 'Time', type: 'time', format: 'HH:mm' },
        { field: 'datetime', title: 'Datetime', type: 'datetime', format: 'dd/MM/yyyy HH:mm' },
        { field: 'hidden', title: 'Hidden', type: 'string', hidden: true },
      ],
    });
    const invalid = {
      required: '',
      short: 'a',
      long: 'abc',
      number: 'NaN',
      low: 1,
      high: 9,
      emptyNumber: '',
      bool: 'maybe',
      boolFalse: 'false',
      boolEmpty: '',
      valueType: { id: 1 },
      valueList: 'B',
      date: 'bad',
      time: '1',
      datetime: 'bad',
    };
    const valid = {
      required: 'ok',
      defaulted: undefined,
      short: 'abc',
      long: 'a',
      number: '5',
      low: 2,
      high: 8,
      emptyNumber: '',
      bool: 'true',
      boolFalse: 0,
      boolEmpty: '',
      valueType: 'A',
      valueList: 'A',
      date: new Date('2026-01-15T00:00:00Z'),
      time: '10:30',
      datetime: '15/01/2026 10:30',
    };
    excel.upload.and.resolveTo({ items: [['header'], invalid, valid], file });

    await component.upload();

    expect(component.excelItems.length).toBe(2);
    expect(component.excelItems[0].meta.errorMessages.length).toBeGreaterThan(8);
    expect(component.excelItems[1].data).toEqual(
      jasmine.objectContaining({
        defaulted: 'fallback',
        number: 5,
        bool: true,
        boolFalse: false,
        boolEmpty: undefined,
      })
    );
    expect(component.numberOfError).toBe(1);
    expect(component.numberOfSuccess).toBe(1);
    expect(component.file).toBe(file);
    expect(loading.start).toHaveBeenCalled();
    expect(loading.stop).toHaveBeenCalled();
  });

  it('applies asynchronous transforms and aggregate validation results', async () => {
    const validateItem = jasmine.createSpy('validateItem').and.resolveTo({ idx: 0, warningMessage: 'row warning' });
    const validateItems = jasmine.createSpy('validateItems').and.resolveTo([
      { idx: 0, errorMessage: 'batch error' },
      { idx: 1, warningMessage: 'batch warning' },
      { idx: -1, errorMessage: 'ignored' },
    ]);
    component.option = baseOption({
      columns: [{ field: 'name', title: 'Name', type: 'string', description: 'Description' }],
      transform: async items => items.map(item => ({ ...item, data: { ...item.data, name: `${item.data.name}!` } })),
      validateItem,
      validateItems,
    });
    excel.upload.and.resolveTo({
      items: [['description'], ['header'], { name: 'A' }, { name: 'B' }],
      file: new File(['x'], 'valid.xlsx'),
    });

    await component.upload();

    expect(component.hasDescription).toBeTrue();
    expect(component.excelItems.map(item => item.data.name)).toEqual(['A!', 'B!']);
    expect(validateItem).toHaveBeenCalled();
    expect(validateItems).toHaveBeenCalledWith([{ name: 'A!' }, { name: 'B!' }]);
    expect(component.excelItems[0].meta.errorMessages).toEqual(['batch error']);
    expect(component.excelItems[1].meta.warningMessages).toContain('batch warning');
    expect(component.uploading).toBeFalse();
  });

  it('captures upload adapter errors and releases loading state', async () => {
    component.option = baseOption();
    const error = new Error('read failed');
    excel.upload.and.rejectWith(error);

    await component.upload();

    expect(notify.error).toHaveBeenCalledWith(error);
    expect(loading.stop).toHaveBeenCalled();
  });

  it('filters and paginates success, warning, and error rows', () => {
    const makeItem = (errors: string[], warnings: string[]) => ({
      data: {},
      meta: { excelIndex: 1, origin: {}, error: {}, warning: {}, errorMessages: errors, warningMessages: warnings },
    });
    component.excelItems = [makeItem([], []), makeItem([], ['warning']), makeItem(['error'], [])];
    paginator.pageSize = 1;

    component.view('WARNING');
    expect(component.filteredItems.length).toBe(1);
    expect(component.numberOfSuccess).toBe(1);
    expect(component.numberOfWarning).toBe(1);
    expect(component.numberOfError).toBe(1);

    component.view('ERROR');
    expect(component.filteredItems[0].meta.errorMessages).toEqual(['error']);
    component.view('SUCCESS');
    expect(component.filteredItems[0].meta.errorMessages).toEqual([]);
    component.view('ALL');
    paginator.pageIndex = 1;
    paginator.page.next();
    expect(component.viewItems.length).toBe(1);
  });

  it('accepts imported data and replaces validation messages', () => {
    const accept = jasmine.createSpy('accept');
    component.option = baseOption({ accept });
    component.file = new File(['x'], 'accepted.xlsx');
    component.excelItems = [
      {
        data: { name: 'A' },
        meta: { excelIndex: 1, origin: { name: 'A' }, error: {}, warning: {}, errorMessages: ['old'], warningMessages: ['old'] },
      },
    ];

    component.setValidation([{ idx: 0, errorMessage: 'new error', warningMessage: 'new warning' }]);
    component.accept();

    expect(component.excelItems[0].meta.errorMessages).toEqual(['new error']);
    expect(component.excelItems[0].meta.warningMessages).toEqual(['new warning']);
    expect(accept).toHaveBeenCalledWith([{ name: 'A' }], { file: component.file });
    expect(component.isUploaded).toBeTrue();
  });

  it('downloads templates with visible columns and static or asynchronous sheets', async () => {
    component.option = baseOption({
      fileName: 'Import template',
      columns: [
        { field: 'name', title: 'Name', type: 'string', required: true, description: 'Description' },
        { field: 'hidden', title: 'Hidden', type: 'string', hidden: () => true },
      ],
      sheets: [
        { name: 'Static', items: [{ id: 1 }], headers: [{ value: 'id', display: 'Id' }] },
        { name: 'Async', items: async () => [{ id: 2 }], headers: [{ value: 'id', display: 'Id' }] },
        { name: '', items: [], headers: [] },
      ],
    });

    await component.downloadTemplate();

    expect(excel.generateTemplate).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fileName: 'Import template',
        columns: [jasmine.objectContaining({ field: 'name', required: true })],
        sheets: [
          jasmine.objectContaining({ name: 'Static', items: [{ id: 1 }] }),
          jasmine.objectContaining({ name: 'Async', items: [{ id: 2 }] }),
        ],
      })
    );
    expect(component.isDownloadTemplate).toBeFalse();
  });

  it('exports original values with a plain-text validation message', async () => {
    component.option = baseOption();
    component.filteredItems = [
      {
        data: { name: 'changed' },
        meta: {
          excelIndex: 1,
          origin: { name: 'original' },
          error: {},
          warning: {},
          errorMessages: ['<strong>[Name]</strong> Required<br>again'],
          warningMessages: [],
        },
      },
    ];

    await component.export();

    expect(excel.export).toHaveBeenCalledWith(
      jasmine.objectContaining({
        items: [{ name: 'original', sdMessage: '[Name] Required\nagain' }],
      })
    );
    expect(loading.start).toHaveBeenCalled();
    expect(loading.stop).toHaveBeenCalled();
  });

  it('unsubscribes paginator events on destroy', () => {
    const unsubscribe = spyOn(paginator.page, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(unsubscribe).not.toHaveBeenCalled();
    expect(paginator.page.observed).toBeFalse();
  });
});
