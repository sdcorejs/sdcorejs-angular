import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { provideSdFormGeneric } from '../../configurations/form-generic.provider';
import type { SdFormGenericConfig } from '../../models/form-generic-config.model';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { LibItemComponent } from './components';
import { DatetimeComponent } from './components/item/components/datetime/datetime.component';
import { TextfieldComponent } from './components/item/components/textfield/textfield.component';
import { UploadComponent } from './components/item/components/upload/upload.component';
import { SdFormRender } from './form-render.component';

type Json = Record<string, unknown>;

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
};
const text = (key: string, extra: Json = {}): Json => ({ id: `f-${key}`, key, type: 'textfield', label: key.toUpperCase(), ...extra });
const schemaOf = (elements: Json[], extra: Json = {}) => ({ pages: [{ id: 'p', elements }], ...extra }) as unknown as SdFormGenericSchema;
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('SdFormRender', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let container: HTMLDivElement;
  const root = () => fixture.nativeElement as HTMLElement;
  const level = () => root().querySelector<HTMLElement>('.sd-fg-grid')?.dataset['level'];
  /** Ô của lưới gom theo `data-row` (DOM phẳng, hàng lấy từ sdPackRows). */
  const rowKeys = () => {
    const rows = new Map<string, string[]>();
    for (const cell of Array.from(root().querySelectorAll<HTMLElement>('.sd-fg-grid > [data-element-id]'))) {
      const row = cell.dataset['row'] ?? '';
      rows.set(row, [...(rows.get(row) ?? []), cell.dataset['elementId'] ?? '']);
    }
    return [...rows.entries()].sort(([left], [right]) => Number(left) - Number(right)).map(([, keys]) => keys);
  };
  const top = (id: string) => Math.round(root().querySelector<HTMLElement>(`[data-element-id="${id}"]`)!.getBoundingClientRect().top);
  const items = () =>
    fixture.debugElement.queryAll(By.directive(LibItemComponent)).map(debug => debug.componentInstance as LibItemComponent);
  const itemFor = (key: string) => items().find(item => item.field().key === key);

  const setup = (config?: SdFormGenericConfig) => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({
      imports: [SdFormRender, NoopAnimationsModule],
      providers: config ? [provideSdFormGeneric(config)] : [],
    });
    fixture = TestBed.createComponent(SdFormRender);
    container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(root());
  };

  const render = async (schema: SdFormGenericSchema, inputs: Json = {}) => {
    fixture.componentRef.setInput('schema', schema);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    await fixture.whenStable();
    await frames();
    fixture.detectChanges();
  };

  const resize = async (width: number) => {
    container.style.width = `${width}px`;
    await frames();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => {
    fixture?.destroy();
    container?.remove();
  });

  describe('layout by form width', () => {
    const twoHalves = schemaOf([text('a', { layout: { span: { desktop: 6 } } }), text('b', { layout: { span: { desktop: 6 } } })]);

    it('keeps two desktop-6 fields side by side at 1100px and 800px and stacks them at 480px', async () => {
      setup();
      await render(twoHalves);
      await resize(1100);
      expect(level()).toBe('desktop');
      expect(rowKeys()).toEqual([['f-a', 'f-b']]);
      await resize(800);
      expect(level()).toBe('tablet');
      expect(rowKeys()).toEqual([['f-a', 'f-b']]);
      await resize(480);
      expect(level()).toBe('mobile');
      expect(rowKeys()).toEqual([['f-a'], ['f-b']]);
    });

    it('draws each row on one line of the grid and keeps the field components when a field changes row', async () => {
      setup();
      const error = spyOn(console, 'error').and.callThrough();
      await render(twoHalves);
      await resize(1100);
      const before = items();
      expect(top('f-a')).withContext('same row, same line').toBe(top('f-b'));
      await resize(480);
      expect(rowKeys()).toEqual([['f-a'], ['f-b']]);
      expect(top('f-b')).withContext('next row is below').toBeGreaterThan(top('f-a'));
      expect(items()).withContext('no field is destroyed and recreated').toEqual(before);
      expect(items().every((item, index) => item === before[index])).toBeTrue();
      expect(error).not.toHaveBeenCalled();
    });

    it('honours a partial breakpoint override from provideSdFormGeneric', async () => {
      setup({ breakpoints: { tablet: 700 } });
      await render(twoHalves);
      await resize(650);
      expect(level()).toBe('mobile');
      await resize(1100);
      expect(level()).toBe('desktop');
    });

    it('lets [breakpoint] force a level and returns to the measured level when cleared', async () => {
      setup();
      await render(twoHalves);
      await resize(1200);
      fixture.componentRef.setInput('breakpoint', 'mobile');
      fixture.detectChanges();
      expect(level()).toBe('mobile');
      expect(rowKeys()).toEqual([['f-a'], ['f-b']]);
      fixture.componentRef.setInput('breakpoint', null);
      fixture.detectChanges();
      expect(level()).toBe('desktop');
    });

    it('starts a new row for newRow and renders only the listed keys', async () => {
      setup();
      const schema = schemaOf([
        text('a', { layout: { span: { desktop: 4 } } }),
        text('b', { layout: { span: { desktop: 4 }, newRow: true } }),
        text('c', { layout: { span: { desktop: 4 } } }),
      ]);
      await render(schema);
      await resize(1100);
      expect(rowKeys()).toEqual([['f-a'], ['f-b', 'f-c']]);
      fixture.componentRef.setInput('keys', ['a', 'c']);
      fixture.detectChanges();
      expect(rowKeys()).toEqual([['f-a', 'f-c']]);
    });
  });

  describe('rules', () => {
    const schema = schemaOf(
      [
        text('agree', { type: 'checkbox' }),
        text('contact'),
        text('email', {
          rules: {
            visible: { field: 'agree', operator: 'EQUAL', data: true },
            required: { field: 'contact', operator: 'EQUAL', data: 'email' },
            disabled: { field: 'locked', operator: 'EQUAL', data: true },
          },
        }),
      ],
      { variables: [{ key: 'locked', label: 'Locked' }] }
    );

    it('shows, requires and disables a field from value and variables as they change', async () => {
      setup();
      await render(schema, { value: { agree: false } });
      expect(itemFor('email')).toBeUndefined();

      fixture.componentRef.setInput('value', { agree: true, contact: 'email' });
      fixture.componentRef.setInput('variables', { locked: true });
      fixture.detectChanges();
      expect(itemFor('email')?.state()).toEqual({ visible: true, disabled: true, required: true });

      fixture.componentRef.setInput('variables', { locked: false });
      fixture.componentRef.setInput('value', { agree: true, contact: 'phone' });
      fixture.detectChanges();
      expect(itemFor('email')?.state()).toEqual({ visible: true, disabled: false, required: false });
    });

    it('does not validate a hidden field', async () => {
      setup();
      await render(
        schemaOf([
          text('secret', { validation: { required: true }, rules: { hidden: { field: 'mode', operator: 'EQUAL', data: 'simple' } } }),
        ]),
        {
          value: { mode: 'simple' },
        }
      );
      expect(itemFor('secret')).toBeUndefined();
      expect((await fixture.componentInstance.validate()).valid).toBeTrue();
    });
  });

  describe('validate()', () => {
    it('returns error and warning lists from form validations and a registered validator', async () => {
      const validate = jasmine.createSpy('validate').and.resolveTo('Mã đã tồn tại');
      setup({ validators: [{ id: 'unique', label: 'Unique', validate }] });
      const schema = schemaOf([text('age', { type: 'number' }), text('code')], {
        validations: [
          { type: 'filter', filter: { field: 'age', operator: 'LESS_THAN', data: 18 }, message: 'Chưa đủ tuổi', alert: 'error' },
          { type: 'filter', filter: { field: 'code', operator: 'NULL' }, message: 'Nên có mã', alert: 'warning' },
          { type: 'function', validator: 'unique', alert: 'error' },
        ],
      });
      await render(schema, { value: { age: 10 } });
      const result = await fixture.componentInstance.validate();
      expect(result).toEqual({ valid: false, messages: { error: ['Chưa đủ tuổi', 'Mã đã tồn tại'], warning: ['Nên có mã'] } });
      expect(validate).toHaveBeenCalledOnceWith({ age: 10 });
    });

    it('is valid with empty message lists when nothing fails', async () => {
      setup();
      await render(schemaOf([text('name')]), { value: { name: 'Lan' } });
      expect(await fixture.componentInstance.validate()).toEqual({ valid: true, messages: { error: [], warning: [] } });
    });

    it('resolves when an async validation that was started without events finishes silently', async () => {
      setup();
      const form = new FormGroup<Record<string, AbstractControl>>({});
      let finish!: () => void;
      const done = new Promise<void>(resolve => (finish = resolve));
      form.addControl('pending', new FormControl('', { asyncValidators: () => done.then(() => ({ taken: true })) }));
      await render(schemaOf([text('name')]), { value: { name: 'Lan' }, form });
      // why: the same silent path the control connector and sd-input take (`emitEvent: false`).
      form.controls['pending'].updateValueAndValidity({ emitEvent: false });
      expect(form.pending).toBeTrue();
      const result = fixture.componentInstance.validate();
      setTimeout(finish, 30);
      expect((await result).valid).toBeFalse();
    });

    it('does not validate a viewed field — the user cannot fix it — whatever its type', async () => {
      setup();
      const required = { viewed: true, validation: { required: true, minLength: 3 } };
      await render(
        schemaOf([
          text('code', required),
          text('amount', { ...required, type: 'number' }),
          text('note', { ...required, type: 'textarea' }),
        ]),
        {
          value: {},
        }
      );
      expect((await fixture.componentInstance.validate()).valid).toBeTrue();
    });

    it('ignores a pattern that is not a valid regular expression instead of breaking the field', async () => {
      setup();
      const errors = spyOn(console, 'error');
      spyOn(console, 'warn');
      await render(schemaOf([text('code', { validation: { pattern: { value: '[A-Z' } } })]), { value: { code: 'abc' } });
      fixture.detectChanges();
      expect(errors).not.toHaveBeenCalled();
      expect(root().querySelector('sd-input')).not.toBeNull();
      expect((await fixture.componentInstance.validate()).valid).toBeTrue();
    });
  });

  describe('value ownership', () => {
    it('never mutates frozen inputs and emits a new object for every change', async () => {
      setup();
      const schema = deepFreeze(schemaOf([text('name', { defaultValue: 'Guest' }), text('note')]));
      const value = deepFreeze({ note: 'hello' });
      const variables = deepFreeze({ tenant: 't' });
      const emitted: Json[] = [];
      fixture.componentInstance.value.subscribe(next => emitted.push(next));
      await render(schema, { value, variables });

      expect(fixture.componentInstance.value()).toEqual({ note: 'hello', name: 'Guest' });
      const field = fixture.debugElement
        .queryAll(By.directive(TextfieldComponent))
        .map(debug => debug.componentInstance as TextfieldComponent)
        .find(item => item.field().key === 'note')!;
      field.setValue('changed');
      fixture.detectChanges();

      expect(fixture.componentInstance.value()).toEqual({ note: 'changed', name: 'Guest' });
      expect(value).toEqual({ note: 'hello' });
      expect(emitted.length).toBeGreaterThanOrEqual(2);
      expect(new Set(emitted).size).toBe(emitted.length);
      expect(emitted.every(next => next !== value)).toBeTrue();
    });

    it('does not apply defaults in view mode', async () => {
      setup();
      await render(schemaOf([text('name', { defaultValue: 'Guest' })]), { value: {}, viewed: true });
      expect(fixture.componentInstance.value()).toEqual({});
    });

    it('treats a NaN already in the value as unchanged, so applying defaults does not loop', async () => {
      setup();
      const emitted: Json[] = [];
      fixture.componentInstance.value.subscribe(next => emitted.push(next));
      await render(schemaOf([text('amount'), text('name', { defaultValue: 'Guest' })]), { value: { amount: NaN } });
      await frames();
      fixture.detectChanges();
      expect(fixture.componentInstance.value()['name']).toBe('Guest');
      expect(emitted.length).withContext('one write for the default, none for NaN').toBeLessThanOrEqual(2);
    });

    it('skips a field whose key is a reserved JavaScript name, with one dev warning', async () => {
      setup();
      const warn = spyOn(console, 'warn');
      await render(schemaOf([text('constructor'), text('name')]));
      expect(items().map(item => item.field().key)).toEqual(['name']);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('skips an element of an unknown type without failing', async () => {
      setup();
      const warn = spyOn(console, 'warn');
      await render(schemaOf([text('a'), { id: 's-1', type: 'heading', content: 'Title' }, text('b')]));
      expect(items().map(item => item.field().key)).toEqual(['a', 'b']);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('upload()', () => {
    it('uploads every pending upload field with params resolved from the value, and stores the result', async () => {
      setup();
      const schema = schemaOf([
        text('folder'),
        { id: 'f-files', key: 'files', type: 'upload', label: 'Files', params: [{ name: 'dir', value: { field: 'folder' } }] },
      ]);
      await render(schema, { value: { folder: 'contracts' } });
      const upload = fixture.debugElement.query(By.directive(UploadComponent)).componentInstance as UploadComponent;
      expect(upload.args()).toEqual({ dir: 'contracts' });
      const spy = spyOn(upload, 'upload').and.callFake(async () => upload.setValue(['file-1']));
      await fixture.componentInstance.upload();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.value()['files']).toEqual(['file-1']);
    });

    it('registers the upload control under its key, like every other field', async () => {
      setup();
      const form = new FormGroup<Record<string, AbstractControl>>({});
      await render(schemaOf([{ id: 'f-files', key: 'files', type: 'upload', label: 'Files', helperText: 'PDF only' }]), { form });
      expect(form.contains('files')).toBeTrue();
      const upload = fixture.debugElement.query(By.directive(SdUploadFile)).componentInstance as SdUploadFile;
      expect(upload.helperText()).toBe('PDF only');
    });
  });

  describe('date limits', () => {
    it('turns "today" into the whole of today for a date-time field and keeps TODAY for a date field', async () => {
      setup();
      await render(
        schemaOf([
          text('d', { type: 'datetime', subtype: 'date', validation: { min: 'today' } }),
          text('dt', { type: 'datetime', subtype: 'datetime', validation: { min: 'today', max: 'today' } }),
        ])
      );
      const [date, dateTime] = fixture.debugElement
        .queryAll(By.directive(DatetimeComponent))
        .map(debug => debug.componentInstance as DatetimeComponent);
      expect(date.min()).toBe('TODAY');
      const start = new Date(dateTime.min()!);
      const end = new Date(dateTime.max()!);
      expect(start.toDateString()).toBe(new Date().toDateString());
      expect([start.getHours(), start.getMinutes()]).toEqual([0, 0]);
      expect([end.getHours(), end.getMinutes(), end.getSeconds()]).toEqual([23, 59, 59]);
    });
  });

  describe('accessibility', () => {
    it('names the fields of a group as a group', async () => {
      setup();
      await render(schemaOf([{ id: 'g', type: 'group', label: 'Address', elements: [text('street')] }]));
      const body = root().querySelector<HTMLElement>('.c-group-body')!;
      expect(body.getAttribute('role')).toBe('group');
      expect(body.getAttribute('aria-label')).toBe('Address');
    });
  });
});
