import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdConfirmService, SdExcelService, SdLoadingService, SdNotifyService } from '@sdcorejs/angular/services';
import { SdTableOption } from '../../models';
import { SdPopupExport } from './popup-export.component';

describe('SdPopupExport', () => {
  let fixture: ComponentFixture<SdPopupExport>;
  let component: SdPopupExport;
  let loading: { start: jasmine.Spy; stop: jasmine.Spy };
  let excel: { generateTemplate: jasmine.Spy };
  let notify: { warning: jasmine.Spy };
  let confirm: { confirm: jasmine.Spy };

  beforeEach(() => {
    loading = { start: jasmine.createSpy('start'), stop: jasmine.createSpy('stop') };
    excel = { generateTemplate: jasmine.createSpy('generateTemplate').and.resolveTo(new Blob()) };
    notify = { warning: jasmine.createSpy('warning') };
    confirm = { confirm: jasmine.createSpy('confirm').and.resolveTo(true) };
    TestBed.configureTestingModule({
      imports: [SdPopupExport],
      providers: [
        { provide: SdLoadingService, useValue: loading },
        { provide: SdExcelService, useValue: excel },
        { provide: SdNotifyService, useValue: notify },
        { provide: SdConfirmService, useValue: confirm },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    });
    fixture = TestBed.createComponent(SdPopupExport);
    component = fixture.componentInstance;
  });

  function option(key?: string): SdTableOption {
    return {
      columns: [
        { field: 'name', title: 'Name', type: 'string', width: '120px' },
        { field: 'hidden', title: 'Hidden', type: 'string', export: { disabled: true } },
        {
          field: 'group',
          title: 'Group',
          type: 'children',
          children: [
            { field: 'child', title: { title: 'Child' }, type: 'string' },
            { field: 'disabled-child', title: 'Disabled', type: 'string', export: { disabled: true } },
          ],
        },
      ],
      export: {
        type: 'default',
        key,
        fileName: 'table',
        columns: [
          { field: 'virtual', title: 'Virtual' },
          { field: 'disabled-extra', title: 'Disabled extra', export: { disabled: true } },
        ],
      },
    } as unknown as SdTableOption;
  }

  it('builds exportable columns and emits default and CSV requests', () => {
    const emissions: { file: unknown; columns: { field: string }[]; isCSV?: boolean }[] = [];
    component.export.subscribe(value => emissions.push(value));
    component._tableOption = option();

    component.exportDefault();
    component.exportCSV();

    expect(component.columns.map(column => column.field)).toEqual(['name', 'child', 'virtual']);
    expect(emissions.map(item => item.isCSV)).toEqual([false, true]);
    expect(emissions[0].columns.map(column => column.field)).toEqual(['name', 'child', 'virtual']);
  });

  it('respects configured table order while retaining additional export columns', () => {
    component._tableOption = option();
    fixture.componentRef.setInput('configuration', {
      firstColumns: [{ field: 'group' }],
      secondColumns: [{ field: 'child' }, { field: 'name' }],
    });
    const emissions: { columns: { field: string }[] }[] = [];
    component.export.subscribe(value => emissions.push(value));

    component.exportDefault();

    expect(emissions[0].columns.map(column => column.field)).toEqual(['child', 'name', 'virtual']);
  });

  it('exports immediately when no reusable-template key is configured', async () => {
    component._tableOption = option();
    const emitted = jasmine.createSpy('emitted');
    component.export.subscribe(emitted);

    await component.open();

    expect(emitted).toHaveBeenCalled();
  });

  it('opens the reusable-template picker and resets its selection when a key is configured', async () => {
    component._tableOption = option('orders');
    component.selected = { name: true };
    const loadFiles = spyOn(component, 'loadFiles').and.resolveTo();
    const open = jasmine.createSpy('open');
    component.modal = { open } as never;

    await component.open();

    expect(loadFiles).toHaveBeenCalled();
    expect(component.selected).toEqual({});
    expect(open).toHaveBeenCalled();
  });

  it('generates a template with static and asynchronous sheets under loading state', async () => {
    const tableOption = option();
    const exportOption = tableOption.export!;
    if (exportOption.type !== 'default') throw new Error('Expected default export option');
    exportOption.sheets = [
      { name: 'Static', items: [{ id: 1 }], headers: [{ value: 'id', display: 'Id' }] },
      { name: 'Async', items: async () => [{ id: 2 }], headers: [{ value: 'id', display: 'Id' }] },
      { name: '', items: [], headers: [] },
    ];
    component._tableOption = tableOption;

    await component.generateTemplate();

    expect(loading.start).toHaveBeenCalled();
    expect(loading.stop).toHaveBeenCalled();
    expect(excel.generateTemplate).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fileName: 'table',
        sheets: [
          jasmine.objectContaining({ name: 'Static', items: [{ id: 1 }] }),
          jasmine.objectContaining({ name: 'Async', items: [{ id: 2 }] }),
        ],
      })
    );
  });

  it('emits an existing template file with all available columns', () => {
    component._tableOption = option();
    const emitted = jasmine.createSpy('emitted');
    component.export.subscribe(emitted);
    const file = { fileName: 'saved.xlsx' };

    component.onExport(file);

    expect(emitted).toHaveBeenCalledWith({ file, columns: component.columns });
  });

  it('removes a confirmed template from the visible list', async () => {
    const first = { fileName: 'first.xlsx' };
    const second = { fileName: 'second.xlsx' };
    component.files = [first, second];

    component.removeFile(first);
    await Promise.resolve();

    expect(confirm.confirm).toHaveBeenCalledWith('Remove template');
    expect(component.files).toEqual([second]);
  });

  it('marks an invalid creation form without starting export work', async () => {
    const control = new FormControl('', Validators.required);
    component.form.addControl('name', control);
    spyOn(component.form, 'markAllAsTouched').and.callThrough();

    await component.createTemplate();

    expect(component.form.markAllAsTouched).toHaveBeenCalled();
    expect(loading.start).not.toHaveBeenCalled();
  });

  it('warns when template creation has no selected columns', async () => {
    component._tableOption = option();

    await component.createTemplate();

    expect(notify.warning).toHaveBeenCalledWith('core.component.table.popup-export.select-columns');
    expect(loading.start).not.toHaveBeenCalled();
  });

  it('runs selected-column template creation and always releases loading state', async () => {
    component._tableOption = option();
    component.templateName = 'Monthly';
    component.selected = { name: true };
    const generate = spyOn(component, 'generateAndUploadTemplate').and.resolveTo();

    await component.createTemplate();

    expect(loading.start).toHaveBeenCalled();
    expect(generate).toHaveBeenCalledWith('Monthly.xlsx');
    expect(loading.stop).toHaveBeenCalled();
  });

  it('validates required, length, character, and valid template names', () => {
    expect(component.templateNameValidator('')).toBe('Please enter your template name');
    expect(component.templateNameValidator('a'.repeat(51))).toBe('Template name is too long');
    expect(component.templateNameValidator('bad/name')).toBe('Template name only contains letters, numbers and spaces');
    expect(component.templateNameValidator('Monthly Report 2026')).toBe('');
  });
});
