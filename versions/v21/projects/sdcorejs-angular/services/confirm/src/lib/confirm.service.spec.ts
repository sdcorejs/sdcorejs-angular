import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { Subject } from 'rxjs';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { SdConfirmService } from './confirm.service';

describe('SdConfirmService', () => {
  let service: SdConfirmService;
  let dialogOpenSpy: jasmine.Spy;
  let afterClosed$: Subject<any>;
  let fakeRef: Partial<MatDialogRef<any>>;

  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'vi');
    afterClosed$ = new Subject();
    fakeRef = {
      afterClosed: () => afterClosed$.asObservable(),
      close: jasmine.createSpy('close'),
    };
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(fakeRef as MatDialogRef<any>);
    dialogOpenSpy = dialogSpy.open;

    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    });
    service = TestBed.inject(SdConfirmService);
  });

  // ─── Service creation ──────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── Dismissal always settles the promise ──────────────────────────────────

  // why: mọi API trước đây viết `if (result) { ...ACCEPT/CANCEL... }`, nên đóng dialog bằng ESC,
  // click backdrop hay `dialogRef.close()` (đều cho `result === undefined`) khiến promise KHÔNG
  // BAO GIỜ settle — `await` treo vĩnh viễn và closure của caller bị ghim đến hết phiên.
  // Không có spec nào bắt được: các spec cũ chỉ phát ACCEPT/CANCEL rồi assert.
  const dismissalCases: { name: string; call: (s: SdConfirmService) => Promise<unknown> }[] = [
    { name: 'confirm', call: s => s.confirm('x') as Promise<unknown> },
    { name: 'withInput', call: s => s.withInput('x') },
    {
      name: 'withRadio',
      call: s => s.withRadio('x', { items: [], valueField: 'value', displayField: 'label' }),
    },
    {
      name: 'withSelect',
      call: s => s.withSelect('x', { items: [], valueField: 'value', displayField: 'label' }),
    },
    { name: 'withDate', call: s => s.withDate('x') },
    { name: 'withDatetime', call: s => s.withDatetime('x') },
  ];

  for (const { name, call } of dismissalCases) {
    it(`${name}() rejects instead of hanging when the dialog is dismissed without a choice`, async () => {
      const settled = call(service);
      // `undefined` là đúng thứ MatDialogRef.afterClosed() phát ra khi đóng bằng ESC/backdrop/close().
      afterClosed$.next(undefined);
      afterClosed$.complete();

      await expectAsync(settled).toBeRejectedWith('CANCEL');
    });
  }

  it('confirm() still resolves the value on ACCEPT and rejects on an explicit CANCEL', async () => {
    const accepted = service.confirm('x') as Promise<unknown>;
    afterClosed$.next({ action: 'ACCEPT', value: 'ok' });
    await expectAsync(accepted).toBeResolvedTo('ok');

    afterClosed$ = new Subject();
    const cancelled = service.confirm('x') as Promise<unknown>;
    afterClosed$.next({ action: 'CANCEL' });
    await expectAsync(cancelled).toBeRejectedWith('CANCEL');
  });

  // ─── confirm() ─────────────────────────────────────────────────────────────

  it('confirm() should open MatDialog with DialogConfirmComponent', () => {
    service.confirm('Delete this record?');
    expect(dialogOpenSpy).toHaveBeenCalledTimes(1);
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.message).toBe('Delete this record?');
  });

  it('confirm() should use default title "Xác nhận" when none is provided', () => {
    service.confirm('Are you sure?');
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.title).toBe('Xác nhận');
  });

  it('confirm() should apply custom title, yesTitle and noTitle', () => {
    service.confirm('Delete?', { title: 'Custom Title', yesTitle: 'Yes', noTitle: 'No' });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.title).toBe('Custom Title');
    expect(config.data.yesTitle).toBe('Yes');
    expect(config.data.noTitle).toBe('No');
  });

  it('confirm() should resolve Promise when ACCEPT action is emitted', async () => {
    const promise = service.confirm('Confirm action?');
    afterClosed$.next({ action: 'ACCEPT', value: null });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolved();
  });

  it('confirm() should reject Promise when CANCEL action is emitted', async () => {
    const promise = service.confirm('Confirm action?');
    afterClosed$.next({ action: 'CANCEL', value: null });
    afterClosed$.complete();
    await expectAsync(promise).toBeRejectedWith('CANCEL');
  });

  it('confirm() should use custom width when provided', () => {
    service.confirm('Wide dialog?', { width: '600px' });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.width).toBe('600px');
  });

  it('confirm() should default disableClose to true', () => {
    service.confirm('No backdrop close');
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.disableClose).toBeTrue();
  });

  // ─── withInput() ───────────────────────────────────────────────────────────

  it('withInput() should open dialog with input data including maxlength default', () => {
    service.withInput('Enter reason');
    expect(dialogOpenSpy).toHaveBeenCalledTimes(1);
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.message).toBe('Enter reason');
    expect(config.data.input.maxlength).toBe(255);
  });

  it('withInput() should resolve with user-entered value on ACCEPT', async () => {
    const promise = service.withInput('Enter value');
    afterClosed$.next({ action: 'ACCEPT', value: 'user text' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('user text');
  });

  it('withInput() should reject with "CANCEL" when user cancels', async () => {
    const promise = service.withInput('Enter value');
    afterClosed$.next({ action: 'CANCEL', value: null });
    afterClosed$.complete();
    await expectAsync(promise).toBeRejectedWith('CANCEL');
  });

  // ─── withRadio() ───────────────────────────────────────────────────────────

  it('withRadio() should open dialog with radio data and resolve selected value on ACCEPT', async () => {
    const items = [
      { value: 'A', label: 'Option A' },
      { value: 'B', label: 'Option B' },
    ];
    const promise = service.withRadio('Pick one', {
      items,
      valueField: 'value',
      displayField: 'label',
    });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.radio.items).toEqual(items);
    expect(config.data.radio.display).toBe('row');
    afterClosed$.next({ action: 'ACCEPT', value: 'A' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('A');
  });

  it('withRadio() should pass column display to the dialog when requested', async () => {
    const promise = service.withRadio('Pick one', {
      items: [
        { value: 'A', label: 'Option A' },
        { value: 'B', label: 'Option B' },
      ],
      valueField: 'value',
      displayField: 'label',
      display: 'column',
    });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.radio.display).toBe('column');
    afterClosed$.next({ action: 'ACCEPT', value: 'B' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('B');
  });

  it('withSelect() should open dialog with select data and resolve selected value on ACCEPT', async () => {
    const items = [
      { value: 'sales', label: 'Sales' },
      { value: 'hr', label: 'HR' },
    ];
    const promise = service.withSelect('Pick department', {
      items,
      valueField: 'value',
      displayField: 'label',
      defaultValue: 'sales',
      required: true,
      placeholder: 'Department',
    });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.select.items).toEqual(items);
    expect(config.data.select.valueField).toBe('value');
    expect(config.data.select.displayField).toBe('label');
    expect(config.data.select.defaultValue).toBe('sales');
    expect(config.data.select.required).toBeTrue();
    expect(config.data.select.placeholder).toBe('Department');
    afterClosed$.next({ action: 'ACCEPT', value: 'hr' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('hr');
  });

  // ─── withDate() ────────────────────────────────────────────────────────────

  it('withDate() should open dialog with date data and resolve selected date on ACCEPT', async () => {
    const min = new Date('2024-01-01');
    const max = new Date('2024-12-31');
    const promise = service.withDate('Schedule for', {
      title: 'Schedule',
      placeholder: 'dd/MM/yyyy',
      min,
      max,
    });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.date).toBeDefined();
    expect(config.data.date.placeholder).toBe('dd/MM/yyyy');
    expect(config.data.date.min).toBe(min);
    expect(config.data.date.max).toBe(max);
    afterClosed$.next({ action: 'ACCEPT', value: '2024-01-15' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('2024-01-15');
  });

  it('withDatetime() should open dialog with datetime data and resolve selected value on ACCEPT', async () => {
    const promise = service.withDatetime('Schedule at', {
      title: 'Schedule',
      placeholder: 'dd/MM/yyyy HH:mm',
      showSeconds: true,
      required: true,
    });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.datetime).toBeDefined();
    expect(config.data.datetime.placeholder).toBe('dd/MM/yyyy HH:mm');
    expect(config.data.datetime.showSeconds).toBeTrue();
    expect(config.data.datetime.required).toBeTrue();
    afterClosed$.next({ action: 'ACCEPT', value: '2024-01-15T08:30:00' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('2024-01-15T08:30:00');
  });

  // ─── iconShape pass-through ────────────────────────────────────────────────

  const shapeCases: { name: string; call: (s: SdConfirmService) => Promise<unknown> }[] = [
    { name: 'confirm', call: s => s.confirm('x', { iconShape: 'circle' }) as Promise<unknown> },
    { name: 'withInput', call: s => s.withInput('x', { iconShape: 'circle' }) },
    { name: 'withRadio', call: s => s.withRadio('x', { items: [], valueField: 'value', displayField: 'label', iconShape: 'circle' }) },
    { name: 'withSelect', call: s => s.withSelect('x', { items: [], valueField: 'value', displayField: 'label', iconShape: 'circle' }) },
    { name: 'withDate', call: s => s.withDate('x', { iconShape: 'circle' }) },
    { name: 'withDatetime', call: s => s.withDatetime('x', { iconShape: 'circle' }) },
  ];

  for (const { name, call } of shapeCases) {
    it(`${name}() passes option.iconShape to the dialog data`, () => {
      call(service).catch(() => undefined);
      expect(dialogOpenSpy.calls.mostRecent().args[1].data.iconShape).toBe('circle');
    });
  }

  it('leaves iconShape unset when the option omits it', () => {
    (service.confirm('x') as Promise<unknown>).catch(() => undefined);
    expect(dialogOpenSpy.calls.mostRecent().args[1].data.iconShape).toBeUndefined();
  });
});

// ─── View selection and backdrop flags ───────────────────────────────────────

type ConfirmMethod = 'confirm' | 'withInput' | 'withRadio' | 'withSelect' | 'withDate' | 'withDatetime';
const METHODS: { name: ConfirmMethod; autoFocus: string }[] = [
  { name: 'confirm', autoFocus: '[data-confirm-cancel] button' },
  { name: 'withInput', autoFocus: 'textarea' },
  { name: 'withRadio', autoFocus: 'first-tabbable' },
  { name: 'withSelect', autoFocus: 'first-tabbable' },
  { name: 'withDate', autoFocus: 'first-tabbable' },
  { name: 'withDatetime', autoFocus: 'first-tabbable' },
];

describe('SdConfirmService — view and backdrop flags', () => {
  function setup(isMobile: boolean) {
    localStorage.setItem('sd-core.language', 'vi');
    spyOn(BrowserUtilities, 'isMobile').and.returnValue(isMobile);
    const dialogClosed$ = new Subject<any>();
    const sheetDismissed$ = new Subject<any>();
    const dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => dialogClosed$.asObservable() });
    const sheet = jasmine.createSpyObj('MatBottomSheet', ['open']);
    sheet.open.and.returnValue({ afterDismissed: () => sheetDismissed$.asObservable() });
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: MatBottomSheet, useValue: sheet },
      ],
    });
    return { service: TestBed.inject(SdConfirmService), dialog, sheet, dialogClosed$, sheetDismissed$ };
  }

  // why: option được ép `any` để ca đỏ phản ánh hành vi, không phải lỗi biên dịch khi option chưa tồn tại.
  function call(service: SdConfirmService, method: ConfirmMethod, option: any = {}): Promise<unknown> {
    const listOption = { items: [{ value: 'A', label: 'A' }], valueField: 'value', displayField: 'label', ...option };
    const invoke = service[method] as (message: string, option: any) => Promise<unknown>;
    return invoke('Message', method === 'withRadio' || method === 'withSelect' ? listOption : option);
  }

  for (const { name, autoFocus } of METHODS) {
    it(`${name}() opens a MatBottomSheet on mobile when view is not passed`, () => {
      const { service, dialog, sheet } = setup(true);
      call(service, name).catch(() => undefined);
      expect(sheet.open).toHaveBeenCalledTimes(1);
      expect(dialog.open).not.toHaveBeenCalled();
      const [component, config] = sheet.open.calls.mostRecent().args;
      expect(component).toBe(DialogConfirmComponent);
      expect(config.data.message).toBe('Message');
      expect(config.panelClass).toBe('sd-confirm-bottom-sheet');
      expect(config.autoFocus).toBe(autoFocus);
      expect(config.disableClose).toBeTrue();
    });

    it(`${name}() opens a MatDialog on desktop with the existing dialog config`, () => {
      const { service, dialog, sheet } = setup(false);
      call(service, name).catch(() => undefined);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(sheet.open).not.toHaveBeenCalled();
      const [component, config] = dialog.open.calls.mostRecent().args;
      expect(component).toBe(DialogConfirmComponent);
      expect(config.width).toBe('440px');
      expect(config.panelClass).toBe('sd-confirm-panel');
      expect(config.maxWidth).toBe('calc(100vw - 32px)');
      expect(config.maxHeight).toBe('calc(100dvh - 32px)');
      expect(config.autoFocus).toBe(autoFocus);
      expect(config.disableClose).toBeTrue();
    });

    it(`${name}() with view 'dialog' still opens a MatDialog on mobile`, () => {
      const { service, dialog, sheet } = setup(true);
      call(service, name, { view: 'dialog' }).catch(() => undefined);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(sheet.open).not.toHaveBeenCalled();
    });

    it(`${name}() with view 'bottom-sheet' opens a MatBottomSheet on desktop`, () => {
      const { service, dialog, sheet } = setup(false);
      call(service, name, { view: 'bottom-sheet' }).catch(() => undefined);
      expect(sheet.open).toHaveBeenCalledTimes(1);
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it(`${name}() rejects 'CANCEL' when the bottom sheet is dismissed without a choice`, async () => {
      const { service, sheetDismissed$ } = setup(true);
      const settled = call(service, name);
      sheetDismissed$.next(undefined);
      sheetDismissed$.complete();
      await expectAsync(settled).toBeRejectedWith('CANCEL');
    });
  }

  it('bottom sheet resolves the value on ACCEPT', async () => {
    const { service, sheetDismissed$ } = setup(true);
    const promise = service.withInput('Enter value');
    sheetDismissed$.next({ action: 'ACCEPT', value: 'user text' });
    await expectAsync(promise).toBeResolvedTo('user text');
  });

  it("bottom sheet rejects 'CANCEL' on an explicit CANCEL", async () => {
    const { service, sheetDismissed$ } = setup(true);
    const promise = service.confirm('Confirm?') as Promise<unknown>;
    sheetDismissed$.next({ action: 'CANCEL', value: null });
    await expectAsync(promise).toBeRejectedWith('CANCEL');
  });

  it('confirm() keeps a custom width for the dialog and gives the bottom sheet a plain-text ariaLabel', () => {
    const desktop = setup(false);
    (desktop.service.confirm('Message', { width: '600px' }) as Promise<unknown>).catch(() => undefined);
    expect(desktop.dialog.open.calls.mostRecent().args[1].width).toBe('600px');

    (desktop.service.confirm('Message', { title: 'Xóa <b>bản ghi</b>?', view: 'bottom-sheet' } as any) as Promise<unknown>).catch(
      () => undefined
    );
    const [, config] = desktop.sheet.open.calls.mostRecent().args;
    expect(config.ariaLabel).toBe('Xóa bản ghi?');
    expect(config.width).toBeUndefined();
  });

  const FLAG_TABLE: { name: string; option: any; disableClose: boolean }[] = [
    { name: 'no flag', option: {}, disableClose: true },
    { name: 'only disableBackdropClose false', option: { disableBackdropClose: false }, disableClose: false },
    { name: 'only disableBackdropClose true', option: { disableBackdropClose: true }, disableClose: true },
    { name: 'only enableBackdropClose true', option: { enableBackdropClose: true }, disableClose: false },
    {
      name: 'enableBackdropClose true wins over disableBackdropClose true',
      option: { enableBackdropClose: true, disableBackdropClose: true },
      disableClose: false,
    },
    {
      name: 'enableBackdropClose false wins over disableBackdropClose false',
      option: { enableBackdropClose: false, disableBackdropClose: false },
      disableClose: true,
    },
  ];

  for (const row of FLAG_TABLE) {
    for (const { name } of METHODS) {
      it(`${name}() dialog: ${row.name} → disableClose ${row.disableClose}`, () => {
        const { service, dialog } = setup(false);
        call(service, name, row.option).catch(() => undefined);
        expect(dialog.open.calls.mostRecent().args[1].disableClose).toBe(row.disableClose);
      });

      it(`${name}() bottom sheet: ${row.name} → disableClose ${row.disableClose}`, () => {
        const { service, sheet } = setup(true);
        call(service, name, row.option).catch(() => undefined);
        expect(sheet.open.calls.mostRecent().args[1].disableClose).toBe(row.disableClose);
      });
    }
  }
});
