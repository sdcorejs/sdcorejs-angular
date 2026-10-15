import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { sdGenericImportColumns } from '../../core';
import type { SdGenericSchema } from '../../models';
import { SdGenericImportService, type SdGenericImportRowResult } from '../../services';
import { GenericImportDialog } from './generic-import-dialog.component';

const schema = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'code', label: 'Code', dataType: 'string', validation: { required: true } },
      { key: 'amount', label: 'Amount', dataType: 'number' },
      {
        key: 'status',
        label: 'Status',
        dataType: 'enum',
        enums: [
          { value: 'NEW', label: 'New' },
          { value: 'DONE', label: 'Done' },
        ],
      },
    ],
  },
});

describe('GenericImportDialog', () => {
  let run: jasmine.Spy<(schema: SdGenericSchema, rows: readonly Record<string, unknown>[]) => Promise<SdGenericImportRowResult[]>>;
  let notify: jasmine.SpyObj<SdNotifyService>;

  const create = () => {
    run = jasmine.createSpy('run');
    notify = jasmine.createSpyObj<SdNotifyService>('notify', ['success', 'error']);
    TestBed.configureTestingModule({
      imports: [GenericImportDialog],
      providers: [provideNoopAnimations(), { provide: SdNotifyService, useValue: notify }],
    });
    // The dialog provides its own import service (plan: component scope).
    TestBed.overrideComponent(GenericImportDialog, {
      set: { providers: [{ provide: SdGenericImportService, useValue: { columns: sdGenericImportColumns, run } }] },
    });
    const fixture = TestBed.createComponent(GenericImportDialog);
    fixture.componentRef.setInput('schema', schema());
    fixture.detectChanges();
    // No spreadsheet is loaded in these tests, so the rows that setValidation would decorate do not exist.
    spyOn(fixture.componentInstance.excel()!, 'setValidation');
    return fixture;
  };
  const accept = (fixture: ReturnType<typeof create>, rows: Record<string, unknown>[]) =>
    fixture.componentInstance.option().accept(rows, { file: new File([], 'orders.xlsx') });

  it('builds the template columns from the import columns of the schema', () => {
    const fixture = create();
    const option = fixture.componentInstance.option();
    expect(option.columns.map(column => [column.field, column.type, !!column.required])).toEqual([
      ['code', 'string', true],
      ['amount', 'number', false],
      ['status', 'string', false],
    ]);
    expect(option.columns[2].description).toBe('New, Done');
  });

  it('saves rows through the import service and returns per-row errors to sd-import-excel (AC-019)', async () => {
    const fixture = create();
    const imported = jasmine.createSpy('imported');
    fixture.componentInstance.imported.subscribe(imported);
    run.and.resolveTo([
      { index: 0, status: 'created', errors: [] },
      { index: 1, status: 'updated', errors: [] },
      { index: 2, status: 'error', errors: [{ key: 'status', code: 'enum-unknown', value: 'Lost' }] },
      { index: 3, status: 'error', errors: [], message: 'duplicate' },
    ]);
    const rows = [{ code: 'A' }, { code: 'B' }, { code: 'C', status: 'Lost' }, { code: 'D' }];
    const validations = await fixture.componentInstance.option().accept(rows, { file: new File([], 'orders.xlsx') });
    expect(run).toHaveBeenCalledWith(jasmine.objectContaining({ entity: 'order' }), rows);
    expect(validations.map(validation => validation.idx)).toEqual([2, 3]);
    expect(validations[0].errorMessage).toContain('Status');
    expect(validations[1].errorMessage).toBe('duplicate');
    expect(notify.success).toHaveBeenCalled();
    expect(imported).toHaveBeenCalledTimes(1);
  });

  it('shows the row results in sd-import-excel, which ignores the value returned by accept (AC-019)', async () => {
    const fixture = create();
    const setValidation = fixture.componentInstance.excel()!.setValidation as jasmine.Spy;
    run.and.resolveTo([
      { index: 0, status: 'created', errors: [] },
      { index: 1, status: 'error', errors: [{ key: 'amount', code: 'number-invalid', value: 'abc' }] },
    ]);
    await accept(fixture, [{ code: 'A' }, { code: 'B', amount: 'abc' }]);
    expect(setValidation).toHaveBeenCalledTimes(1);
    const [validations] = setValidation.calls.mostRecent().args as [{ idx: number; errorMessage: string }[]];
    expect(validations.map(validation => validation.idx)).toEqual([1]);
    expect(validations[0].errorMessage).withContext('number-invalid message, escaped').toContain('Amount');
    expect(validations[0].errorMessage).toContain('&quot;abc&quot;');
    expect(validations[0].errorMessage).not.toBe(
      TestBed.inject(I18nService).t('core.module.generic.import.not-found', { label: 'Amount', value: 'abc' })
    );
  });

  it('escapes spreadsheet and backend text before sd-import-excel renders it as HTML', async () => {
    const fixture = create();
    run.and.resolveTo([
      { index: 0, status: 'error', errors: [], message: '<img src=x onerror=alert(1)>' },
      { index: 1, status: 'error', errors: [{ key: 'status', code: 'enum-unknown', value: '<b>Lost</b>' }] },
    ]);
    const validations = await accept(fixture, [{ code: 'A' }, { code: 'B' }]);
    expect(validations[0].errorMessage).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(validations[1].errorMessage).not.toContain('<b>');
  });

  it('reports a failed import instead of leaving an unhandled rejection', async () => {
    const fixture = create();
    run.and.rejectWith(new Error('search failed'));
    expect(await accept(fixture, [{ code: 'A' }])).toEqual([]);
    expect(notify.error).toHaveBeenCalledWith('search failed');
  });

  it('does not report success when nothing was saved', async () => {
    const fixture = create();
    const imported = jasmine.createSpy('imported');
    fixture.componentInstance.imported.subscribe(imported);
    run.and.resolveTo([{ index: 0, status: 'error', errors: [], message: 'denied' }]);
    await fixture.componentInstance.option().accept([{ code: 'A' }], { file: new File([], 'orders.xlsx') });
    expect(notify.success).not.toHaveBeenCalled();
    expect(imported).not.toHaveBeenCalled();
  });
});
