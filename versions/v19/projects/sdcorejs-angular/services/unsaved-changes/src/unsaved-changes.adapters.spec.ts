import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
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

  it('keeps the control dirty flag by default, so a value typed back still counts as a change', () => {
    const form = new FormGroup({ name: new FormControl('Initial') });
    registerSdUnsavedChangesForm(service, form, { id: 'profile' });
    form.controls.name.setValue('Changed');
    form.markAsDirty();
    form.controls.name.setValue('Initial');

    expect(service.hasChanges()).toBeTrue();
  });

  // A user edit marks the control dirty before it writes the value, like the DefaultValueAccessor does.
  const edit = (control: FormControl, value: unknown): void => {
    control.markAsDirty();
    control.setValue(value);
  };

  it("compares the edited value with the value before the edit when dirty is 'value'", () => {
    const form = new FormGroup({ name: new FormControl('Initial'), tags: new FormControl<string[]>(['a']) });
    registerSdUnsavedChangesForm(service, form, { id: 'profile', dirty: 'value' });

    edit(form.controls.name, 'Changed');
    expect(service.hasChanges()).toBeTrue();

    form.controls.name.setValue('Initial');
    expect(form.dirty).toBeTrue();
    expect(service.hasChanges()).toBeFalse();

    edit(form.controls.tags as FormControl, ['a', 'b']);
    expect(service.hasChanges()).toBeTrue();
    form.controls.tags.setValue(['a']);
    expect(service.hasChanges()).toBeFalse();
  });

  it("takes a saved value as the new baseline when dirty is 'value'", async () => {
    const form = new FormGroup({ name: new FormControl('Initial') });
    const ref = registerSdUnsavedChangesForm(service, form, { id: 'profile', dirty: 'value', save: () => undefined });
    edit(form.controls.name, 'Saved');
    expect(await ref.save()).toBeTrue();
    expect(service.hasChanges()).toBeFalse();

    edit(form.controls.name, 'Initial');
    expect(service.hasChanges()).toBeTrue();
  });

  it("does not count controls that join later or values written while pristine when dirty is 'value'", () => {
    // As a page with <sd-input [form] name [model]>: registered first, the controls arrive afterwards and the
    // entity value is written without an event.
    const form = new FormGroup<Record<string, FormControl<string | null>>>({});
    registerSdUnsavedChangesForm(service, form, { id: 'product-update', dirty: 'value' });
    const code = new FormControl<string | null>('');
    const name = new FormControl<string | null>('');
    form.addControl('code', code);
    form.addControl('name', name);
    code.setValue('SP-001', { emitEvent: false });
    name.setValue('Sữa tươi', { emitEvent: false });
    expect(service.hasChanges()).toBeFalse();

    edit(name, 'Sữa tươi 1L');
    expect(service.hasChanges()).toBeTrue();
    name.setValue('Sữa tươi');
    expect(service.hasChanges()).toBeFalse();

    form.reset({ code: 'SP-002', name: 'Nước suối' });
    expect(service.hasChanges()).toBeFalse();
  });

  // A control joins the form and its model is written without an event, as <sd-*> fields do; the task ends.
  const join = async (form: FormGroup, name: string, value: unknown): Promise<FormControl> => {
    const control = new FormControl<unknown>(null);
    form.addControl(name, control);
    control.setValue(value, { emitEvent: false });
    await Promise.resolve();
    return control;
  };

  it("counts an edit of a field that never marks its control dirty when dirty is 'value'", async () => {
    const form = new FormGroup<Record<string, FormControl>>({});
    registerSdUnsavedChangesForm(service, form, { id: 'settings', dirty: 'value' });
    const minutes = await join(form, 'sessionMinutes', 30);
    expect(service.hasChanges()).toBeFalse();

    minutes.setValue(3);
    expect(minutes.dirty).toBeFalse();
    expect(service.hasChanges()).toBeTrue();
    minutes.setValue(30);
    expect(service.hasChanges()).toBeFalse();
  });

  it("counts an edit of a field that marks its control dirty after writing when dirty is 'value'", async () => {
    const form = new FormGroup<Record<string, FormControl>>({});
    registerSdUnsavedChangesForm(service, form, { id: 'picker', dirty: 'value' });
    const category = await join(form, 'categoryId', '2');

    category.setValue('3');
    category.markAsDirty();
    expect(service.hasChanges()).toBeTrue();
    category.setValue('2');
    expect(service.hasChanges()).toBeFalse();
  });

  it("takes the current value as saved on markPristine() and keeps reporting later edits when dirty is 'value'", async () => {
    const form = new FormGroup<Record<string, FormControl>>({});
    const ref = registerSdUnsavedChangesForm(service, form, { id: 'settings', dirty: 'value' });
    const minutes = await join(form, 'sessionMinutes', 30);
    minutes.setValue(60);
    expect(ref.dirty()).toBeTrue();

    ref.markPristine();
    expect(ref.dirty()).toBeFalse();
    minutes.setValue(90);
    expect(ref.dirty()).toBeTrue();
    minutes.setValue(60);
    expect(ref.dirty()).toBeFalse();
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

@Component({
  standalone: true,
  imports: [SdInputNumber],
  template: '<sd-input-number name="price" [form]="form" [model]="10" />',
})
class PriceFormHost {
  readonly form = new FormGroup({});
}

// why: <sd-input-number> writes a typed number to its form control without marking the control dirty.
describe('unsaved changes adapters with a Core field', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PriceFormHost, NoopAnimationsModule],
      providers: [{ provide: SD_UNSAVED_CHANGES_WINDOW, useValue: null }],
    });
  });

  it("counts a number typed into <sd-input-number> when dirty is 'value'", async () => {
    const fixture = TestBed.createComponent(PriceFormHost);
    const ref = registerSdUnsavedChangesForm(TestBed.inject(SdUnsavedChangesService), fixture.componentInstance.form, {
      id: 'product-update',
      dirty: 'value',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ref.dirty()).toBeFalse();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '25';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ price: 25 });
    expect(ref.dirty()).toBeTrue();

    input.value = '10';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(ref.dirty()).toBeFalse();
    ref.destroy();
  });
});
