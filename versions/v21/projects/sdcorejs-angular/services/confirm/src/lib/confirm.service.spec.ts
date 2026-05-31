import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
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
    const items = [{ value: 'A', label: 'Option A' }, { value: 'B', label: 'Option B' }];
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

  // ─── withDate() ────────────────────────────────────────────────────────────

  it('withDate() should open dialog with date data and resolve selected date on ACCEPT', async () => {
    const promise = service.withDate('Schedule for', {
      title: 'Schedule',
      placeholder: 'dd/MM/yyyy',
    });
    const [, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(config.data.date).toBeDefined();
    expect(config.data.date.placeholder).toBe('dd/MM/yyyy');
    afterClosed$.next({ action: 'ACCEPT', value: '2024-01-15' });
    afterClosed$.complete();
    await expectAsync(promise).toBeResolvedTo('2024-01-15');
  });
});
