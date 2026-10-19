import { TestBed } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { BrowserUtilities, DateUtilities } from '@sdcorejs/utils/fns';
import { Subject } from 'rxjs';
import { SdImportExcel } from './import-excel.component';
import { SdImportExcelItem } from './import-excel.model';
import { ColumnTransformPipe } from './pipes/column-transform.pipe';

// Import under ISdCoreConfiguration.timeZone, through the real SdExcelService and a real workbook:
// exceljs returns a date cell as a Date whose UTC fields are the Excel wall clock (A-002), so
// 20/05/1960 00:00 in Asia/Ho_Chi_Minh (+08 in 1960) is 1960-05-19T16:00:00Z on any machine zone.

const VN = 'Asia/Ho_Chi_Minh';

async function workbookFile(): Promise<File> {
  const mod: any = await import('exceljs');
  const Workbook: new () => import('exceljs').Workbook = mod.Workbook ?? mod.default?.Workbook;
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('import');
  sheet.addRow(['dateCell', 'textCell', 'timeCell']);
  sheet.addRow(['Date cell', 'Text cell', 'Time cell']);
  sheet.addRow([new Date(Date.UTC(1960, 4, 20)), '20/05/1960', '08:30']);
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function importRow(timeZone?: string): Promise<{ item: SdImportExcelItem; pipe: ColumnTransformPipe; component: SdImportExcel }> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SdImportExcel],
    providers: [
      { provide: SdNotifyService, useValue: { warning: jasmine.createSpy('warning'), error: jasmine.createSpy('error') } },
      { provide: SdLoadingService, useValue: { start: jasmine.createSpy('start'), stop: jasmine.createSpy('stop') } },
      { provide: I18nService, useValue: { t: (key: string) => key } },
      ColumnTransformPipe,
      ...(timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : []),
    ],
  });
  spyOn(BrowserUtilities, 'upload').and.resolveTo(await workbookFile());
  const component = TestBed.createComponent(SdImportExcel).componentInstance;
  component.paginator = { pageIndex: 0, pageSize: 10, page: new Subject<void>() } as unknown as MatPaginator;
  component.modal = { open: jasmine.createSpy('open'), close: jasmine.createSpy('close') } as never;
  component.option = {
    columns: [
      { field: 'dateCell', title: 'Date cell', type: 'date', format: 'dd/MM/yyyy' },
      { field: 'textCell', title: 'Text cell', type: 'date', format: 'dd/MM/yyyy' },
      { field: 'timeCell', title: 'Time cell', type: 'time', format: 'HH:mm' },
    ],
    accept: jasmine.createSpy('accept'),
  };
  await component.upload();
  expect(component.excelItems.length).toBe(1);
  return { item: component.excelItems[0], pipe: TestBed.inject(ColumnTransformPipe), component };
}

describe('SdImportExcel with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reads Date and text cells as wall clock in the zone and keeps the stored types', async () => {
    const { item, pipe, component } = await importRow(VN);
    expect(item.meta.errorMessages).toEqual([]);
    expect(item.data['dateCell']).toBe('1960-05-19T16:00:00.000Z');
    expect(item.data['textCell']).toEqual(jasmine.any(Date));
    expect((item.data['textCell'] as Date).toISOString()).toBe('1960-05-19T16:00:00.000Z');
    const [dateColumn, textColumn] = component.option.columns;
    expect(await pipe.transform(item, dateColumn)).toBe('20/05/1960');
    expect(await pipe.transform(item, textColumn)).toBe('20/05/1960');
  });

  it('takes today in the zone for a time-only format', async () => {
    const { item } = await importRow(VN);
    const time = item.data['timeCell'] as Date;
    expect(time).toEqual(jasmine.any(Date));
    expect(DateUtilities.toFormat(time, 'HH:mm', { timeZone: VN })).toBe('08:30');
    expect(DateUtilities.toFormat(time, 'yyyy/MM/dd', { timeZone: VN })).toBe(
      DateUtilities.toFormat(Date.now(), 'yyyy/MM/dd', { timeZone: VN })
    );
  });

  it('keeps the current values without a zone', async () => {
    const { item, pipe, component } = await importRow();
    expect(item.data['dateCell']).toBe(new Date(Date.UTC(1960, 4, 20)).toISOString());
    expect((item.data['textCell'] as Date).getTime()).toBe(DateUtilities.parseFrom('20/05/1960', 'dd/MM/yyyy')!.getTime());
    expect(await pipe.transform(item, component.option.columns[1])).toBe('20/05/1960');
  });
});
