import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdExcelService } from '@sdcorejs/angular/services/excel';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SdImportExcel } from './import-excel.component';

describe('SdImportExcel review workflow', () => {
  let fixture: ComponentFixture<SdImportExcel>;
  let component: SdImportExcel;
  let root: HTMLElement;
  let upload: jasmine.Spy;
  let accept: jasmine.Spy;

  beforeEach(() => {
    upload = jasmine.createSpy('upload');
    accept = jasmine.createSpy('accept');
    TestBed.configureTestingModule({
      imports: [SdImportExcel, NoopAnimationsModule],
      providers: [
        { provide: SdExcelService, useValue: { upload, generateTemplate: jasmine.createSpy().and.resolveTo() } },
        { provide: SdLoadingService, useValue: { start: () => {}, stop: () => {} } },
        { provide: SdNotifyService, useValue: { warning: () => {}, error: () => {} } },
      ],
    });
    fixture = TestBed.createComponent(SdImportExcel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('option', {
      columns: [{ field: 'name', title: 'Name', type: 'string', required: true }],
      accept,
    });
    fixture.detectChanges();
    component.open();
    fixture.detectChanges();
    root = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => {
    component.close();
    fixture.destroy();
  });

  async function readRows(rows: Record<string, unknown>[]) {
    upload.and.resolveTo({ items: [['Name'], ...rows], file: new File(['test'], 'employees.xlsx') });
    await component.upload();
    fixture.detectChanges();
  }

  it('starts with file selection outside a table and without an empty paginator', () => {
    expect(root.querySelector('.sd-import-entry')).not.toBeNull();
    expect(root.querySelector('table')).toBeNull();
    expect(root.querySelector('mat-paginator')).toBeNull();
    expect(root.querySelector('[data-import-action="choose"] button')).not.toBeNull();
    expect(root.querySelector('[data-import-action="template"] button')).not.toBeNull();
  });

  it('reads a first file before the preview paginator exists and distinguishes an empty filter', async () => {
    await readRows([{ name: 'An' }]);
    expect(component.numberOfSuccess).toBe(1);
    expect(root.textContent).toContain('employees.xlsx');
    const errorFilter = root.querySelector<HTMLButtonElement>('[data-import-filter="ERROR"]')!;
    errorFilter.click();
    fixture.detectChanges();
    expect(errorFilter.getAttribute('aria-pressed')).toBe('true');
    expect(component.filteredItems).toEqual([]);
    expect(root.querySelector('.sd-import-no-results')).not.toBeNull();
    expect(root.querySelector('.sd-import-entry')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-import-filter="ALL"]')!.click();
    fixture.detectChanges();
    expect(component.viewItems.length).toBe(1);
  });

  it('labels filters and exposes every validation issue alongside the blocked import reason', async () => {
    component.option.columns.push({ field: 'code', title: 'Code', type: 'string', required: true });
    await readRows([{}]);
    const errorFilter = root.querySelector<HTMLElement>('[data-import-filter="ERROR"]')!;
    expect(errorFilter.textContent).toMatch(/Lỗi|Errors/);
    expect(root.querySelector('[data-import-filter="WARNING"]')!.textContent).toMatch(/Cảnh báo|Warnings/);
    const issues = root.querySelectorAll('.sd-import-issues li');
    expect(issues.length).toBe(2);
    expect(root.querySelector('.sd-import-blocked')!.textContent).toContain('1');
    expect(root.querySelector<HTMLButtonElement>('[data-import-action="accept"] button')!.disabled).toBeTrue();
    expect(accept).not.toHaveBeenCalled();
  });

  it('shows repeated validation messages once without changing the validator result', async () => {
    component.option.validateItems = async () => [
      { idx: 0, warningMessage: 'Check department' },
      { idx: 0, warningMessage: 'Check department' },
    ];
    await readRows([{ name: 'An' }]);
    expect(component.excelItems[0].meta.warningMessages.length).toBe(2);
    expect(root.querySelectorAll('.sd-import-issues li').length).toBe(1);
  });

  it('keeps warning-only rows importable and clears the previous filename when reopened', async () => {
    component.option.validateItems = async () => [{ idx: 0, warningMessage: 'Check department' }];
    await readRows([{ name: 'An' }]);
    expect(component.numberOfWarning).toBe(1);
    expect(root.querySelector<HTMLButtonElement>('[data-import-action="accept"] button')!.disabled).toBeFalse();
    component.close();
    component.open();
    fixture.detectChanges();
    expect(component.file).toBeUndefined();
    expect(component.isUploaded).toBeFalse();
  });
});
