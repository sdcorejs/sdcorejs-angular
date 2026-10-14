import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { SdFormRender } from './form-render.component';

type Field = Record<string, unknown>;

const schemaOf = (elements: Field[]) => ({ pages: [{ id: 'p', elements }] }) as unknown as SdFormGenericSchema;
const time = (extra: Field = {}): Field => ({ id: 'start', key: 'start', type: 'time', label: 'Start', ...extra });
const json = (extra: Field = {}): Field => ({ id: 'payload', key: 'payload', type: 'json', label: 'Payload', ...extra });

describe('SdFormRender · time and json fields', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let form: FormGroup;
  const root = () => fixture.nativeElement as HTMLElement;
  const value = () => fixture.componentInstance.value();

  const render = (elements: Field[], initial: Record<string, unknown> = {}, viewed = false) => {
    fixture.componentRef.setInput('viewed', viewed);
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
    localStorage.setItem('sd-core.language', 'en');
    TestBed.configureTestingModule({ imports: [SdFormRender, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdFormRender);
    form = new FormGroup({});
    fixture.componentRef.setInput('form', form);
  });

  afterEach(() => fixture.destroy());

  it('renders a time field that keeps HH:mm and rejects an impossible time', fakeAsync(() => {
    render([time()]);
    expect(root().querySelector('sd-time')).withContext('time field uses sd-time').not.toBeNull();
    expect(form.get('start')).withContext('registered under its key').not.toBeNull();

    set('start', '25:00');
    expect(form.get('start')!.invalid).toBeTrue();

    set('start', '09:30');
    expect(form.get('start')!.valid).toBeTrue();
    expect(value()['start']).toBe('09:30');
  }));

  it('marks a required time field invalid while empty', fakeAsync(() => {
    render([time({ validation: { required: true } })]);
    set('start', null);
    expect(form.get('start')!.invalid).toBeTrue();
  }));

  it('renders a json field that stores the parsed value and rejects invalid JSON text', fakeAsync(() => {
    render([json()]);
    expect(root().querySelector('sd-code-editor')).withContext('json field uses sd-code-editor').not.toBeNull();
    expect(form.get('payload')).withContext('registered under its key').not.toBeNull();

    set('payload', '{"a":');
    expect(form.get('payload')!.invalid).toBeTrue();
    expect(form.get('payload')!.hasError('json')).toBeTrue();

    set('payload', '{"a":1,"b":[true]}');
    expect(form.get('payload')!.valid).toBeTrue();
    expect(value()['payload']).toEqual({ a: 1, b: [true] });
  }));

  it('marks a required json field invalid while empty', fakeAsync(() => {
    render([json({ validation: { required: true } })]);
    set('payload', '');
    expect(form.get('payload')!.invalid).toBeTrue();
  }));

  it('shows the required message of an untouched json field on submit and names the field group', fakeAsync(() => {
    render([json({ validation: { required: true } })]);
    form.markAllAsTouched();
    flush();
    fixture.detectChanges();
    const group = root().querySelector('[data-autoId="form-generic-json-payload"]')!;
    const alert = group.querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).withContext('message without editing first').toBeTruthy();
    expect(group.getAttribute('role')).toBe('group');
    expect(root().querySelector(`#${group.getAttribute('aria-labelledby')}`)?.textContent).toContain('Payload');
    expect(group.getAttribute('aria-describedby')).toBe(alert!.id);
    expect(group.getAttribute('aria-invalid')).toBe('true');
  }));

  it('shows the initial JSON value formatted and the time as is in view mode', fakeAsync(() => {
    render([time(), json()], { start: '08:15', payload: { a: 1 } }, true);
    const text = root().textContent?.replace(/\s+/g, ' ') ?? '';
    expect(text).toContain('08:15');
    expect(text).toContain('"a": 1');
    expect(root().querySelector('sd-code-editor textarea')).withContext('read-only editor').toBeNull();
  }));
});
