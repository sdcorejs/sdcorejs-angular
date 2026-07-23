import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { CanDeactivateFn } from '@angular/router';
import { createSdUnsavedChangesCloseGuard, registerSdUnsavedChangesForm, sdUnsavedChangesGuard } from './unsaved-changes.adapters';
import { SdUnsavedChangesService } from './unsaved-changes.service';
import { SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, SD_UNSAVED_CHANGES_WINDOW } from './unsaved-changes.tokens';

describe('unsaved changes adapters', () => {
  let service: SdUnsavedChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SD_UNSAVED_CHANGES_WINDOW, useValue: null },
        { provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, useValue: { confirm: () => 'discard' } },
      ],
    });
    service = TestBed.inject(SdUnsavedChangesService);
  });

  it('adapts FormGroup dirty state and restores the registration snapshot on discard/reset', async () => {
    const form = new FormGroup({ name: new FormControl('Initial') });
    const ref = registerSdUnsavedChangesForm(service, form, { id: 'profile' });
    form.controls.name.setValue('Changed');
    form.markAsDirty();

    expect(service.hasChanges()).toBeTrue();
    expect(await ref.discard()).toBeTrue();
    expect(form.getRawValue()).toEqual({ name: 'Initial' });
    expect(form.pristine).toBeTrue();

    form.controls.name.setValue('Again');
    form.markAsDirty();
    expect(await ref.reset()).toBeTrue();
    expect(form.getRawValue()).toEqual({ name: 'Initial' });
    ref.destroy();
  });

  it('runs the optional form save callback and marks the form pristine only after success', async () => {
    const form = new FormGroup({ name: new FormControl('Initial') });
    const save = jasmine.createSpy('save').and.resolveTo(undefined);
    const ref = registerSdUnsavedChangesForm(service, form, { id: 'profile', save });
    form.controls.name.setValue('Saved');
    form.markAsDirty();

    expect(await ref.save()).toBeTrue();
    expect(save).toHaveBeenCalledOnceWith({ name: 'Saved' });
    expect(form.pristine).toBeTrue();
  });

  it('promotes a successfully saved form value to the new discard snapshot', async () => {
    const form = new FormGroup({ name: new FormControl('Initial') });
    const ref = registerSdUnsavedChangesForm(service, form, { id: 'profile', save: () => undefined });
    form.controls.name.setValue('Saved');
    form.markAsDirty();
    expect(await ref.save()).toBeTrue();

    form.controls.name.setValue('Unsaved');
    form.markAsDirty();
    expect(await ref.discard()).toBeTrue();

    expect(form.getRawValue()).toEqual({ name: 'Saved' });
  });

  it('creates close and functional route guards scoped to the registry', async () => {
    const dirty = signal(true);
    service.register({ id: 'editor', scope: 'page-a', isDirty: dirty, discard: () => dirty.set(false) });
    const closeGuard = createSdUnsavedChangesCloseGuard(service, { scope: 'page-a' });

    expect(await closeGuard()).toBeTrue();
    expect(dirty()).toBeFalse();

    dirty.set(true);
    const result = TestBed.runInInjectionContext(() => (sdUnsavedChangesGuard as CanDeactivateFn<unknown>)(null, null!, null!, null!));
    expect(await Promise.resolve(result as boolean | Promise<boolean>)).toBeTrue();
  });
});
