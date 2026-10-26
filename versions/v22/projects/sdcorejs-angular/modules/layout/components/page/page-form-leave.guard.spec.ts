import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanDeactivateFn } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import {
  SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER,
  SD_UNSAVED_CHANGES_WINDOW,
  SdUnsavedChangesService,
} from '@sdcorejs/angular/services/unsaved-changes';

import { sdPageFormLeaveGuard } from './page-form-leave.guard';

describe('sdPageFormLeaveGuard', () => {
  let confirm: jasmine.Spy;
  let fallback: jasmine.Spy;
  let service: SdUnsavedChangesService;
  let i18n: I18nService;

  beforeEach(() => {
    confirm = jasmine.createSpy('confirm').and.resolveTo(null);
    fallback = jasmine.createSpy('fallback').and.returnValue('cancel');
    TestBed.configureTestingModule({
      providers: [
        { provide: SdConfirmService, useValue: { confirm } },
        { provide: SD_UNSAVED_CHANGES_WINDOW, useValue: null },
        { provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, useValue: { confirm: fallback } },
      ],
    });
    service = TestBed.inject(SdUnsavedChangesService);
    i18n = TestBed.inject(I18nService);
  });

  const run = (): Promise<boolean> =>
    TestBed.runInInjectionContext(() =>
      Promise.resolve((sdPageFormLeaveGuard as CanDeactivateFn<unknown>)(null, null!, null!, null!) as boolean | Promise<boolean>)
    );

  it('lets the navigation go without a dialog when nothing is dirty', async () => {
    expect(await run()).toBeTrue();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks with the Core confirm dialog, not the app-wide adapter, and leaves on accept', async () => {
    const dirty = signal(true);
    service.register({ id: 'product-form', isDirty: dirty, discard: () => dirty.set(false) });

    expect(await run()).toBeTrue();
    expect(confirm).toHaveBeenCalledOnceWith(
      i18n.t('core.module.layout.page.leave.message'),
      jasmine.objectContaining({
        title: i18n.t('core.module.layout.page.leave.title'),
        yesTitle: i18n.t('core.module.layout.page.leave.leave'),
        noTitle: i18n.t('core.module.layout.page.leave.stay'),
        yesButtonColor: 'warning',
      })
    );
    expect(fallback).not.toHaveBeenCalled();
    expect(dirty()).toBeFalse();
  });

  it('stays on the page and keeps the changes when the dialog is cancelled', async () => {
    confirm.and.rejectWith('CANCEL');
    const dirty = signal(true);
    service.register({ id: 'product-form', isDirty: dirty, discard: () => dirty.set(false) });

    expect(await run()).toBeFalse();
    expect(dirty()).toBeTrue();
  });

  it('shows the message of the dirty watcher when it has one', async () => {
    service.register({ id: 'order-form', isDirty: true, message: 'Đơn hàng chưa lưu.' });

    await run();
    expect(confirm.calls.mostRecent().args[0]).toBe('Đơn hàng chưa lưu.');
  });
});
