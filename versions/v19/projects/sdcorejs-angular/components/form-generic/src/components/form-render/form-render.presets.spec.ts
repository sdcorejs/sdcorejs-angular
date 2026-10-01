import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { SdFormRender } from './form-render.component';

type Field = Record<string, unknown>;

const text = (key: string, extra: Field = {}): Field => ({
  id: key,
  key,
  type: 'textfield',
  label: key.toUpperCase(),
  layout: { span: { desktop: 6 } },
  ...extra,
});
const schemaOf = (elements: Field[]) => ({ pages: [{ id: 'p', elements }] }) as unknown as SdFormGenericSchema;

describe('SdFormRender · labels, presets and defaults', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let form: FormGroup;
  const root = () => fixture.nativeElement as HTMLElement;
  const value = () => fixture.componentInstance.value();

  const render = (
    elements: Field[],
    initial: Record<string, unknown> = {},
    options: { viewed?: boolean; labelPlacement?: 'top' | 'float' } = {}
  ) => {
    fixture.componentRef.setInput('viewed', !!options.viewed);
    if (options.labelPlacement) fixture.componentRef.setInput('labelPlacement', options.labelPlacement);
    fixture.componentRef.setInput('value', initial);
    fixture.componentRef.setInput('schema', schemaOf(elements));
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  };

  const set = (key: string, next: unknown) => {
    form.get(key)!.setValue(next);
    form.get(key)!.markAsTouched();
    flush();
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [SdFormRender, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdFormRender);
    form = new FormGroup({});
    fixture.componentRef.setInput('form', form);
  });

  afterEach(() => fixture.destroy());

  it('puts every label above its control and associates it (default), with float as an explicit opt-out', fakeAsync(() => {
    render([
      text('email', { subtype: 'email', label: 'Email', placeholder: 'name@example.com', validation: { required: true } }),
      { id: 'amount', key: 'amount', type: 'number', subtype: 'currency', label: 'Amount' },
      { id: 'note', key: 'note', type: 'textarea', label: 'Note' },
    ]);
    const controls = Array.from(root().querySelectorAll<HTMLInputElement>('input, textarea'));
    expect(controls.length).toBe(3);
    for (const control of controls) expect(control.labels?.length).withContext(control.outerHTML).toBe(1);
    expect(root().querySelector('mat-label')).withContext('no floating label duplicate').toBeNull();
    const email = controls[0];
    expect(email.labels![0].textContent?.replace(/\s+/g, ' ').trim()).toBe('Email *');
    expect(email.placeholder).toBe('name@example.com');
    expect(email.type).toBe('email');

    render([text('email', { subtype: 'email', label: 'Email' })], {}, { labelPlacement: 'float' });
    expect(root().querySelector('mat-label')).not.toBeNull();
    flush();
  }));

  it('validates email / phone / url presets without a user regex and keeps the raw string', fakeAsync(() => {
    render([
      text('email', { subtype: 'email' }),
      text('phone', { subtype: 'phone' }),
      text('site', { subtype: 'url' }),
      text('vn', { subtype: 'phone', validation: { phoneCountry: 'VN' } }),
    ]);
    set('email', 'abc@');
    set('phone', '12ab');
    set('site', 'javascript:alert(1)');
    set('vn', '+1 555 123 4567');
    expect(form.get('email')!.invalid).toBeTrue();
    expect(form.get('phone')!.invalid).toBeTrue();
    expect(form.get('site')!.invalid).toBeTrue();
    expect(form.get('vn')!.invalid).toBeTrue();

    set('email', 'an.nguyen@example.com');
    set('phone', '+84 912 345 678');
    set('site', 'https://sdcorejs.dev');
    set('vn', '0912 345 678');
    expect(form.get('email')!.valid).toBeTrue();
    expect(form.get('phone')!.valid).toBeTrue();
    expect(form.get('site')!.valid).toBeTrue();
    expect(form.get('vn')!.valid).toBeTrue();
    expect(form.get('phone')!.value).withContext('phone stays a string, + kept').toBe('+84 912 345 678');
  }));

  it('applies minLength, maxLength and pattern with its message', fakeAsync(() => {
    render([text('code', { validation: { minLength: 3, maxLength: 5, pattern: { value: '^[A-Z]+$', message: 'Chỉ chữ in hoa' } } })]);
    set('code', 'AB');
    expect(form.get('code')!.hasError('minlength')).toBeTrue();
    set('code', 'ABCDEFG');
    expect(form.get('code')!.hasError('maxlength')).toBeTrue();
    set('code', 'abc');
    expect(form.get('code')!.hasError('pattern')).toBeTrue();
    set('code', 'ABC');
    expect(form.get('code')!.valid).toBeTrue();
  }));

  it('rejects integer and precision violations of the number presets', fakeAsync(() => {
    render([
      { id: 'qty', key: 'qty', type: 'number', subtype: 'integer', label: 'Qty' },
      { id: 'rate', key: 'rate', type: 'number', subtype: 'percent', label: 'Rate' },
    ]);
    set('qty', 1.5);
    set('rate', 12.345);
    expect(form.get('qty')!.invalid).toBeTrue();
    expect(form.get('rate')!.invalid).toBeTrue();
    set('qty', 2);
    set('rate', 12.34);
    expect(form.get('qty')!.valid).toBeTrue();
    expect(form.get('rate')!.valid).toBeTrue();
  }));

  it('keeps a plain textfield synchronously valid — no async validator is attached without a preset', fakeAsync(() => {
    render([text('name', { validation: { required: true } })]);
    const control = form.get('name')!;
    control.setValue('An');
    expect(control.status).toBe('VALID');
    flush();
  }));

  it('applies defaultValue only when the value has no key, and never for passwords', fakeAsync(() => {
    render(
      [
        text('title', { defaultValue: 'Default title' }),
        text('kept', { defaultValue: 'ignored' }),
        text('secret', { subtype: 'password', defaultValue: 'hunter2' }),
        { id: 'qty', key: 'qty', type: 'number', subtype: 'integer', label: 'Qty', defaultValue: 0 },
      ],
      { kept: 'from value' }
    );
    expect(value()['title']).toBe('Default title');
    expect(value()['kept']).toBe('from value');
    expect(value()['secret']).toBeUndefined();
    expect(value()['qty']).withContext('0 is a real default').toBe(0);
  }));

  it('does not write defaultValue into the value in viewed mode', fakeAsync(() => {
    render(
      [
        text('title', { defaultValue: 'Default title' }),
        { id: 'amount', key: 'amount', type: 'number', subtype: 'currency', label: 'Amount', defaultValue: 0 },
      ],
      {},
      { viewed: true }
    );
    expect(value()['title']).toBeUndefined();
    expect(value()['amount']).toBeUndefined();
  }));

  it('never reveals a password in viewed mode and links only safe URLs', fakeAsync(() => {
    render(
      [text('secret', { subtype: 'password' }), text('site', { subtype: 'url' }), text('evil', { subtype: 'url' })],
      {
        secret: 'hunter2',
        site: 'https://sdcorejs.dev',
        evil: 'javascript:alert(1)',
      },
      { viewed: true }
    );
    expect(root().textContent).not.toContain('hunter2');
    const links = Array.from(root().querySelectorAll<HTMLAnchorElement>('a[href]')).map(link => link.getAttribute('href'));
    expect(links).toContain('https://sdcorejs.dev');
    expect(links.some(href => href?.startsWith('javascript:'))).toBeFalse();
    flush();
  }));
});
