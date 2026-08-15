import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, NgForm, ValidatorFn, Validators } from '@angular/forms';

import { ɵsdCoerceFormGroup, ɵsdFormControlConnector, ɵSdFormControlParent } from './sd-form-control-connector';

@Component({
  selector: 'sd-connector-host',
  standalone: true,
  template: '',
})
class ConnectorHost {
  readonly form = signal<ɵSdFormControlParent>(undefined);
  readonly name = signal<string | undefined>('field');
  readonly control = signal<AbstractControl<string | null>>(new FormControl<string | null>('control'));
  readonly model = signal<string | null>('model');
  readonly validators = signal<ValidatorFn | readonly ValidatorFn[] | null>(null);
  readonly asyncValidators = signal<AsyncValidatorFn | readonly AsyncValidatorFn[] | null>(null);
  readonly required = signal(false);
  readonly readonly = signal(false);
  readonly viewed = signal<boolean | 'inline'>(false);
  readonly validationError = signal<string | undefined>(undefined);
  readonly disabled = signal(false);
  readonly modelWrites: (string | null)[] = [];

  readonly connector = ɵsdFormControlConnector<string | null, string | null>({
    form: this.form,
    name: this.name,
    control: this.control,
    model: this.model,
    writeModel: (value: string | null) => {
      this.modelWrites.push(value);
      this.model.set(value);
    },
    validators: this.validators,
    asyncValidators: this.asyncValidators,
    required: this.required,
    readonly: this.readonly,
    viewed: this.viewed,
    validationError: this.validationError,
    disabled: this.disabled,
  });
}

@Component({
  selector: 'sd-adapter-host',
  standalone: true,
  template: '',
})
class AdapterHost {
  readonly form = signal<ɵSdFormControlParent>(undefined);
  readonly name = signal('amount');
  readonly control = signal<AbstractControl<string>>(new FormControl('', { nonNullable: true }));
  readonly model = signal(7);

  readonly connector = ɵsdFormControlConnector<number, string>({
    form: this.form,
    name: this.name,
    control: this.control,
    model: this.model,
    writeModel: (value: number) => this.model.set(value),
    modelToControl: (value: number) => String(value),
    controlToModel: (value: string) => Number(value),
  });
}

describe('ɵsdFormControlConnector', () => {
  let fixture: ComponentFixture<ConnectorHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConnectorHost, AdapterHost] });
    fixture = TestBed.createComponent(ConnectorHost);
    fixture.detectChanges();
  });

  it('coerces FormGroup, NgForm, and form wrappers to the canonical FormGroup', () => {
    const group = new FormGroup({});
    const ngForm = new NgForm([], []);

    expect(ɵsdCoerceFormGroup(group)).toBe(group);
    expect(ɵsdCoerceFormGroup(ngForm)).toBe(ngForm.form);
    expect(ɵsdCoerceFormGroup({ form: group })).toBe(group);
    expect(ɵsdCoerceFormGroup({ form: 'not-a-group' })).toBeUndefined();
    expect(ɵsdCoerceFormGroup(null)).toBeUndefined();
  });

  it('rebinds when parent, name, or control changes', () => {
    const host = fixture.componentInstance;
    const firstGroup = new FormGroup({});
    const secondGroup = new FormGroup({});
    const firstControl = host.control();

    host.form.set(firstGroup);
    fixture.detectChanges();
    expect(firstGroup.get('field') === firstControl).toBeTrue();

    host.name.set('renamed');
    fixture.detectChanges();
    expect(firstGroup.get('field')).toBeNull();
    expect(firstGroup.get('renamed') === firstControl).toBeTrue();

    host.form.set(secondGroup);
    fixture.detectChanges();
    expect(firstGroup.get('renamed')).toBeNull();
    expect(secondGroup.get('renamed') === firstControl).toBeTrue();

    const replacement = new FormControl<string | null>('replacement');
    host.control.set(replacement);
    fixture.detectChanges();
    expect(Object.is(secondGroup.get('renamed'), replacement)).toBeTrue();
  });

  it('replaces a FOREIGN control registered under the same name so the value reaches the form', () => {
    // why: guard ngược cho một bug im lặng. Trước đây connector bỏ qua việc đăng ký khi FormGroup đã
    // có control trùng `name` (`ownsRegistration = !current`), nên control nội bộ của component
    // không bao giờ nằm trong form: người dùng gõ, nhưng `group.value[name]` không đổi và form
    // submit ra rỗng, không một cảnh báo nào. Spec cũ ("does not replace or remove a control it does
    // not own") khẳng định đúng hành vi hỏng đó.
    const host = fixture.componentInstance;
    const external = new FormControl('external');
    const group = new FormGroup({ field: external });

    host.form.set(group);
    fixture.detectChanges();

    expect(group.get('field')).toBe(host.control());
    expect(group.get('field')).not.toBe(external);
  });

  it('propagates the control value to the parent form after replacing a foreign control', () => {
    const host = fixture.componentInstance;
    const group = new FormGroup({ field: new FormControl('external') });

    host.form.set(group);
    fixture.detectChanges();

    host.control().setValue('typed by the user');

    expect(group.value).toEqual({ field: 'typed by the user' });
  });

  it('restores the displaced control when the connector rebinds to a different name', () => {
    // why: nếu chỉ `setControl` mà không nhớ control bị đẩy ra, đổi `name` sẽ để control của
    // component nằm lại ở CẢ key cũ lẫn key mới, còn control gốc của consumer thì mất hẳn.
    const host = fixture.componentInstance;
    const external = new FormControl('external');
    const group = new FormGroup({ field: external });

    host.form.set(group);
    fixture.detectChanges();
    expect(group.get('field')).toBe(host.control());

    host.name.set('other');
    fixture.detectChanges();

    expect(group.get('field')).toBe(external);
    expect(group.get('other') === host.control()).toBeTrue();
  });

  it('restores the displaced control when the host is destroyed', () => {
    const host = fixture.componentInstance;
    const external = new FormControl('external');
    const group = new FormGroup({ field: external });

    host.form.set(group);
    fixture.detectChanges();
    expect(group.get('field')).toBe(host.control());

    fixture.destroy();

    expect(group.get('field')).toBe(external);
  });

  it('does not touch a control that someone else registered over ours', () => {
    const host = fixture.componentInstance;
    const group = new FormGroup({ field: new FormControl('external') });

    host.form.set(group);
    fixture.detectChanges();

    const replacement = new FormControl('replacement');
    group.setControl('field', replacement);
    host.name.set('other');
    fixture.detectChanges();

    expect(group.get('field')).toBe(replacement);
    expect(group.get('other') === host.control()).toBeTrue();
  });

  it('keeps a same-instance control that was pre-registered when the connector rebinds', () => {
    const host = fixture.componentInstance;
    const control = host.control();
    const group = new FormGroup({ field: control });

    host.form.set(group);
    fixture.detectChanges();

    host.name.set('other');
    fixture.detectChanges();

    expect(group.get('field')).toBe(control);
    expect(group.get('other') === control).toBeTrue();
  });

  it('keeps a same-instance control that was pre-registered when the connector is destroyed', () => {
    const host = fixture.componentInstance;
    const control = host.control();
    const group = new FormGroup({ field: control });

    host.form.set(group);
    fixture.detectChanges();
    fixture.destroy();

    expect(group.get('field')).toBe(control);
  });

  it('synchronizes model and control without feeding programmatic writes back into the model', () => {
    const host = fixture.componentInstance;

    expect(host.control().value).toBe('model');
    expect(host.modelWrites).toEqual([]);

    host.control().setValue('user');
    expect(host.model()).toBe('user');
    expect(host.modelWrites).toEqual(['user']);

    host.model.set('programmatic');
    fixture.detectChanges();
    expect(host.control().value).toBe('programmatic');
    expect(host.modelWrites).toEqual(['user']);
  });

  it('maps model and control representations through adapters', () => {
    const adapterFixture = TestBed.createComponent(AdapterHost);
    adapterFixture.detectChanges();
    const host = adapterFixture.componentInstance;

    expect(host.control().value).toBe('7');

    host.control().setValue('12');
    expect(host.model()).toBe(12);

    host.model.set(21);
    adapterFixture.detectChanges();
    expect(host.control().value).toBe('21');
  });

  it('requires both adapters when model and control value types differ', () => {
    const invalidBinding = () => {
      // @ts-expect-error Different model/control types require explicit adapters in both directions.
      return ɵsdFormControlConnector<number, string>({
        form: signal<ɵSdFormControlParent>(undefined),
        name: signal('amount'),
        control: signal<AbstractControl<string>>(new FormControl('', { nonNullable: true })),
        model: signal(7),
        writeModel: () => undefined,
      });
    };

    expect(invalidBinding).toBeDefined();
  });

  it('reactively applies validators and disabled state', () => {
    const host = fixture.componentInstance;
    const control = host.control();

    host.validators.set(Validators.required);
    host.model.set('');
    fixture.detectChanges();
    expect(control.hasError('required')).toBeTrue();

    host.disabled.set(true);
    fixture.detectChanges();
    expect(control.disabled).toBeTrue();

    host.disabled.set(false);
    host.validators.set(null);
    fixture.detectChanges();
    expect(control.enabled).toBeTrue();
    expect(control.valid).toBeTrue();
  });

  it('composes required with custom validators without losing either across transitions', () => {
    const host = fixture.componentInstance;
    const control = host.control();
    const customValidator: ValidatorFn = value => (value.value === 'blocked' ? { custom: true } : null);

    host.validators.set(customValidator);
    host.required.set(true);
    host.model.set('');
    fixture.detectChanges();
    expect(control.hasError('required')).toBeTrue();

    host.model.set('blocked');
    fixture.detectChanges();
    expect(control.hasError('required')).toBeFalse();
    expect(control.hasError('custom')).toBeTrue();

    host.required.set(false);
    fixture.detectChanges();
    expect(control.hasError('custom')).toBeTrue();
  });

  it('preserves external validators while adding and removing connector-owned validator references', () => {
    const host = fixture.componentInstance;
    const control = host.control();
    const externalValidator: ValidatorFn = () => ({ external: true });
    const connectorValidator: ValidatorFn = () => ({ connector: true });
    const externalAsyncValidator: AsyncValidatorFn = () => Promise.resolve({ externalAsync: true });
    const connectorAsyncValidator: AsyncValidatorFn = () => Promise.resolve({ connectorAsync: true });

    control.addValidators(externalValidator);
    control.addAsyncValidators(externalAsyncValidator);
    host.validators.set(connectorValidator);
    host.asyncValidators.set(connectorAsyncValidator);
    fixture.detectChanges();

    expect(control.hasValidator(externalValidator)).toBeTrue();
    expect(control.hasValidator(connectorValidator)).toBeTrue();
    expect(control.hasAsyncValidator(externalAsyncValidator)).toBeTrue();
    expect(control.hasAsyncValidator(connectorAsyncValidator)).toBeTrue();

    host.validators.set(null);
    host.asyncValidators.set(null);
    fixture.detectChanges();

    expect(control.hasValidator(externalValidator)).toBeTrue();
    expect(control.hasValidator(connectorValidator)).toBeFalse();
    expect(control.hasAsyncValidator(externalAsyncValidator)).toBeTrue();
    expect(control.hasAsyncValidator(connectorAsyncValidator)).toBeFalse();
  });

  it('restores connector-owned validators and disabled state on control rebind and destroy', () => {
    const host = fixture.componentInstance;
    const oldControl = host.control();
    const replacement = new FormControl<string | null>('replacement');
    const connectorValidator: ValidatorFn = () => ({ connector: true });
    const connectorAsyncValidator: AsyncValidatorFn = () => Promise.resolve({ connectorAsync: true });

    host.validators.set(connectorValidator);
    host.asyncValidators.set(connectorAsyncValidator);
    host.required.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(oldControl.hasValidator(connectorValidator)).toBeTrue();
    expect(oldControl.hasValidator(Validators.required)).toBeTrue();
    expect(oldControl.hasAsyncValidator(connectorAsyncValidator)).toBeTrue();
    expect(oldControl.disabled).toBeTrue();

    host.control.set(replacement);
    fixture.detectChanges();

    expect(oldControl.hasValidator(connectorValidator)).toBeFalse();
    expect(oldControl.hasValidator(Validators.required)).toBeFalse();
    expect(oldControl.hasAsyncValidator(connectorAsyncValidator)).toBeFalse();
    expect(oldControl.enabled).toBeTrue();
    expect(replacement.hasValidator(connectorValidator)).toBeTrue();
    expect(replacement.hasValidator(Validators.required)).toBeTrue();
    expect(replacement.hasAsyncValidator(connectorAsyncValidator)).toBeTrue();
    expect(replacement.disabled).toBeTrue();

    fixture.destroy();

    expect(replacement.hasValidator(connectorValidator)).toBeFalse();
    expect(replacement.hasValidator(Validators.required)).toBeFalse();
    expect(replacement.hasAsyncValidator(connectorAsyncValidator)).toBeFalse();
    expect(replacement.enabled).toBeTrue();
  });

  it('does not restore disabled state when the connector did not apply it', () => {
    const control = fixture.componentInstance.control();

    control.disable({ emitEvent: false });
    fixture.destroy();

    expect(control.disabled).toBeTrue();
  });

  it('exposes readonly and viewed policy without disabling the Angular control', () => {
    const host = fixture.componentInstance;

    host.readonly.set(true);
    host.viewed.set('inline');
    fixture.detectChanges();

    expect(host.connector.state().readonly).toBeTrue();
    expect(host.connector.state().viewed).toBe('inline');
    expect(host.connector.state().isInline).toBeTrue();
    expect(host.connector.state().isViewed).toBeFalse();
    expect(host.control().enabled).toBeTrue();

    host.viewed.set(true);
    fixture.detectChanges();
    expect(host.connector.state().isInline).toBeFalse();
    expect(host.connector.state().isViewed).toBeTrue();
    expect(host.control().enabled).toBeTrue();
  });

  it('gates invalid state and validation errors until touched or dirty', () => {
    const host = fixture.componentInstance;

    host.required.set(true);
    host.validationError.set('Field is required');
    host.model.set('');
    fixture.detectChanges();

    expect(host.control().invalid).toBeTrue();
    expect(host.connector.state().invalid).toBeFalse();
    expect(host.connector.state().showValidationError).toBeFalse();
    expect(host.connector.state().validationError).toBeUndefined();

    host.connector.markAsDirty();
    fixture.detectChanges();
    expect(host.connector.state().dirty).toBeTrue();
    expect(host.connector.state().invalid).toBeTrue();
    expect(host.connector.state().showValidationError).toBeTrue();
    expect(host.connector.state().validationError).toBe('Field is required');

    host.connector.markAsPristine();
    host.connector.markAsTouched();
    fixture.detectChanges();
    expect(host.connector.state().dirty).toBeFalse();
    expect(host.connector.state().touched).toBeTrue();
    expect(host.connector.state().showValidationError).toBeTrue();
  });

  it('rebinds reactive state to the replacement control and stops observing the old one', () => {
    const host = fixture.componentInstance;
    const oldControl = host.control();
    const replacement = new FormControl<string | null>('replacement');

    host.control.set(replacement);
    fixture.detectChanges();
    expect(host.connector.state().value).toBe('model');

    oldControl.setValue('stale');
    oldControl.markAsTouched();
    fixture.detectChanges();
    expect(host.connector.state().value).toBe('model');
    expect(host.connector.state().touched).toBeFalse();

    replacement.setValue('current');
    fixture.detectChanges();
    expect(host.connector.state().value).toBe('current');
  });

  it('exposes touched and dirty helpers on the canonical control', () => {
    const host = fixture.componentInstance;
    const control = host.control();

    host.connector.markAsTouched();
    host.connector.markAsDirty();
    expect(control.touched).toBeTrue();
    expect(control.dirty).toBeTrue();

    host.connector.markAsUntouched();
    host.connector.markAsPristine();
    expect(control.touched).toBeFalse();
    expect(control.pristine).toBeTrue();
  });

  it('cleans registration and subscriptions up when the host is destroyed', () => {
    const host = fixture.componentInstance;
    const group = new FormGroup({});
    const control = host.control();

    host.form.set(group);
    fixture.detectChanges();
    expect(group.get('field') === control).toBeTrue();

    fixture.destroy();
    expect(group.get('field')).toBeNull();

    control.setValue('after-destroy');
    expect(host.model()).toBe('model');
    expect(host.modelWrites).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// `registeredControl` — register something other than the bound control
//
// why: `<sd-date>` / `<sd-datetime>` / `<sd-date-range>` bind their control straight to the Material
// editor, so it holds a `Date` or a display string. With `transform` the consumer is promised that
// `form.get(name).value` matches `model`, which only works if the *registration* can point
// elsewhere. Everything else — validators, disabled, state, model binding — must stay on `control`.
// ---------------------------------------------------------------------------

@Component({
  selector: 'sd-registered-host',
  standalone: true,
  template: '',
})
class RegisteredControlHost {
  readonly form = signal<ɵSdFormControlParent>(undefined);
  readonly name = signal<string | undefined>('field');
  readonly control = signal<AbstractControl<string | null>>(new FormControl<string | null>('editor'));
  readonly registered = signal<AbstractControl | null>(null);
  readonly model = signal<string | null>('model');

  readonly connector = ɵsdFormControlConnector<string | null, string | null>({
    form: this.form,
    name: this.name,
    control: this.control,
    registeredControl: this.registered,
    model: this.model,
    writeModel: (value: string | null) => this.model.set(value),
  });
}

describe('ɵsdFormControlConnector (registeredControl)', () => {
  let fixture: ComponentFixture<RegisteredControlHost>;
  let host: RegisteredControlHost;
  let group: FormGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RegisteredControlHost] });
    fixture = TestBed.createComponent(RegisteredControlHost);
    host = fixture.componentInstance;
    group = new FormGroup({});
  });

  it('registers the bound control when no alternative is supplied', () => {
    host.form.set(group);
    fixture.detectChanges();

    expect(group.get('field')).toBe(host.control());
  });

  it('registers the alternative control instead when one is supplied', () => {
    const modelFacing = new FormControl<string | null>('facing');
    host.registered.set(modelFacing);
    host.form.set(group);
    fixture.detectChanges();

    expect(group.get('field')).toBe(modelFacing);
    expect(group.get('field')).not.toBe(host.control());
  });

  it('swaps the registration when the alternative appears at runtime', () => {
    host.form.set(group);
    fixture.detectChanges();
    expect(group.get('field')).toBe(host.control());

    const modelFacing = new FormControl<string | null>('facing');
    host.registered.set(modelFacing);
    fixture.detectChanges();

    expect(group.get('field')).toBe(modelFacing);
  });

  it('removes the alternative it owns on destroy', () => {
    const modelFacing = new FormControl<string | null>('facing');
    host.registered.set(modelFacing);
    host.form.set(group);
    fixture.detectChanges();

    fixture.destroy();

    expect(group.contains('field')).toBeFalse();
  });

  // why: registration đổi chỗ, còn model binding thì KHÔNG — nó vẫn phải chạy trên `control`.
  it('keeps the model binding on the bound control', () => {
    const modelFacing = new FormControl<string | null>('facing');
    host.registered.set(modelFacing);
    host.form.set(group);
    fixture.detectChanges();

    host.control().setValue('typed');

    expect(host.model()).toBe('typed');
  });
});
