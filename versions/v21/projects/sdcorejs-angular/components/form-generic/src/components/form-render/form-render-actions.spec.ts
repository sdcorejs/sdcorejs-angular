import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideSdFormGeneric } from '../../configurations/form-generic.provider';
import type { SdFormGenericConfig } from '../../models/form-generic-config.model';
import type { SdFormGenericAction } from '../../models/form-generic-element.model';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { LibButtonElementComponent } from '../elements';
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
const button = (id: string, extra: Json = {}): Json => ({ id, type: 'button', label: id, action: 'submit', ...extra });
const schemaOf = (elements: Json[], extra: Json = {}) => ({ pages: [{ id: 'p', elements }], ...extra }) as unknown as SdFormGenericSchema;
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('SdFormRender actions', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let actions: SdFormGenericAction[];
  const root = () => fixture.nativeElement as HTMLElement;
  const buttons = () => fixture.debugElement.queryAll(By.directive(LibButtonElementComponent));
  const buttonFor = (id: string) => buttons().find(debug => (debug.componentInstance as LibButtonElementComponent).button().id === id);
  const press = async (id: string) => {
    (buttonFor(id)!.componentInstance as LibButtonElementComponent).pressed.emit();
    await settle();
  };
  // why: validate() first yields one macrotask so controls of a just-revealed page can register; whenStable()
  // does not wait for that timer, so settle also lets a timer turn pass before reading the result.
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  // why: formGroup() is FormGroup<any> | FormGroup<{}> — get() is not callable on that union.
  const control = (key: string) => (fixture.componentInstance.formGroup() as FormGroup).get(key);
  const errorBlock = () => root().querySelector<HTMLElement>('[data-sd-fg-form-errors]');
  /** Gõ như người dùng: qua control của field (context.patch), không qua [(value)] của consumer. */
  const type = async (key: string, value: unknown) => {
    const field = fixture.debugElement
      .queryAll(By.directive(TextfieldComponent))
      .map(debug => debug.componentInstance as TextfieldComponent)
      .find(component => component.field().key === key)!;
    field.setValue(value);
    await settle();
  };

  const setup = (config?: SdFormGenericConfig) => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({
      imports: [SdFormRender, NoopAnimationsModule],
      providers: config ? [provideSdFormGeneric(config)] : [],
    });
    fixture = TestBed.createComponent(SdFormRender);
    document.body.appendChild(root());
    actions = [];
    fixture.componentInstance.sdAction.subscribe(action => actions.push(action));
  };

  const render = async (schema: SdFormGenericSchema, inputs: Json = {}) => {
    fixture.componentRef.setInput('schema', schema);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    await fixture.whenStable();
    await frames();
    fixture.detectChanges();
  };

  afterEach(() => root().remove());

  describe('submit', () => {
    it('shows the field errors and emits nothing while the form is invalid, then emits once with the value', async () => {
      setup();
      await render(schemaOf([text('name', { validation: { required: true } }), button('b-send')]));
      await press('b-send');
      expect(actions).toEqual([]);
      // why: validate() marks every control touched, which is what makes the field show its error.
      expect(control('name')?.touched).toBeTrue();
      expect(control('name')?.invalid).toBeTrue();

      fixture.componentRef.setInput('value', { name: 'Lan' });
      await settle();
      await press('b-send');
      expect(actions).toEqual([{ action: 'submit', buttonId: 'b-send', value: { name: 'Lan' }, messages: { error: [], warning: [] } }]);
    });

    it('passes warnings of form validations along with a successful submit', async () => {
      setup();
      const schema = schemaOf([text('code'), button('b-send')], {
        validations: [{ type: 'filter', filter: { field: 'code', operator: 'NULL' }, message: 'Nên có mã', alert: 'warning' }],
      });
      await render(schema);
      await press('b-send');
      expect(actions.length).toBe(1);
      expect(actions[0].messages).toEqual({ error: [], warning: ['Nên có mã'] });
    });

    it('runs one validation at a time: repeated presses, other actions and a second submit() wait for it', async () => {
      let finish!: (message: string | null) => void;
      const validate = jasmine.createSpy('validate').and.callFake(() => new Promise<string | null>(resolve => (finish = resolve)));
      setup({ validators: [{ id: 'slow', label: 'Slow', validate }] });
      const schema = schemaOf(
        [
          text('name'),
          button('b-send'),
          button('b-draft', { action: 'custom', name: 'save-draft' }),
          button('b-reset', { action: 'reset' }),
        ],
        {
          validations: [{ type: 'function', validator: 'slow', alert: 'error' }],
        }
      );
      await render(schema, { value: { name: 'Lan' } });
      (buttonFor('b-send')!.componentInstance as LibButtonElementComponent).pressed.emit();
      (buttonFor('b-send')!.componentInstance as LibButtonElementComponent).pressed.emit();
      (buttonFor('b-draft')!.componentInstance as LibButtonElementComponent).pressed.emit();
      (buttonFor('b-reset')!.componentInstance as LibButtonElementComponent).pressed.emit();
      fixture.componentInstance.reset();
      const first = fixture.componentInstance.submit();
      const second = fixture.componentInstance.submit();
      expect(second).toBe(first);
      await new Promise(resolve => setTimeout(resolve));
      expect(validate).toHaveBeenCalledTimes(1);
      expect(actions).toEqual([]);
      finish(null);
      await first;
      await settle();
      expect(actions.map(action => action.action)).toEqual(['submit']);
      expect(actions[0].buttonId).toBe('b-send');
    });
  });

  describe('custom', () => {
    it('emits its name at once without validating, even when the form is invalid', async () => {
      setup();
      await render(
        schemaOf([text('name', { validation: { required: true } }), button('b-draft', { action: 'custom', name: 'save-draft' })]),
        {
          value: { other: 1 },
        }
      );
      await press('b-draft');
      expect(actions).toEqual([{ action: 'save-draft', buttonId: 'b-draft', value: { other: 1 }, messages: null }]);
      expect(control('name')?.touched).toBeFalse();
    });

    it('validates first when validate is true, like submit', async () => {
      setup();
      await render(
        schemaOf([
          text('name', { validation: { required: true } }),
          button('b-review', { action: 'custom', name: 'review', validate: true }),
        ])
      );
      await press('b-review');
      expect(actions).toEqual([]);
      fixture.componentRef.setInput('value', { name: 'Lan' });
      await settle();
      await press('b-review');
      expect(actions.map(action => [action.action, action.buttonId])).toEqual([['review', 'b-review']]);
      expect(actions[0].messages).toEqual({ error: [], warning: [] });
    });

    it('does not render a custom button whose name is submit or reset (it could pose as submit)', async () => {
      setup();
      const warn = spyOn(console, 'warn');
      await render(
        schemaOf([
          text('name'),
          button('b-fake', { action: 'custom', name: 'submit' }),
          button('b-fake2', { action: 'custom', name: 'reset' }),
        ])
      );
      expect(buttons().length).toBe(0);
      expect(warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset', () => {
    it('returns to the value the consumer loaded, with defaults, clears touched and dirty, and never changes that object', async () => {
      setup();
      const loaded = deepFreeze({ name: 'Lan' });
      const schema = schemaOf([text('name'), text('city', { defaultValue: 'HCM' }), button('b-reset', { action: 'reset' })]);
      await render(schema, { value: loaded });
      expect(fixture.componentInstance.value()).toEqual({ name: 'Lan', city: 'HCM' });
      control('name')?.markAsDirty();
      control('name')?.markAsTouched();
      await type('name', 'Mai');
      await type('city', 'HN');
      expect(fixture.componentInstance.value()).toEqual({ name: 'Mai', city: 'HN' });
      await press('b-reset');
      expect(fixture.componentInstance.value()).toEqual({ name: 'Lan', city: 'HCM' });
      expect(fixture.componentInstance.formGroup().dirty).toBeFalse();
      expect(fixture.componentInstance.formGroup().touched).toBeFalse();
      expect(loaded).toEqual({ name: 'Lan' });
      expect(actions).toEqual([{ action: 'reset', buttonId: 'b-reset', value: { name: 'Lan', city: 'HCM' }, messages: null }]);
    });

    it('ignores the consumer echoing back a copy of the value it received', async () => {
      setup();
      await render(schemaOf([text('name')]), { value: { name: 'Lan' } });
      // the user edits; a consumer that copies (valueChange) → { ...$event } sends the same content back
      await type('name', 'Mai');
      fixture.componentRef.setInput('value', { ...fixture.componentInstance.value() });
      await settle();
      fixture.componentInstance.reset();
      await settle();
      expect(fixture.componentInstance.value()).toEqual({ name: 'Lan' });
    });

    it('takes a new record loaded by the consumer as the new reset target', async () => {
      setup();
      await render(schemaOf([text('name')]), { value: { name: 'Lan' } });
      fixture.componentRef.setInput('value', { name: 'Hoa' });
      await settle();
      await type('name', 'Edited');
      fixture.componentInstance.reset();
      await settle();
      expect(fixture.componentInstance.value()).toEqual({ name: 'Hoa' });
    });

    it('gives a new form only its default values', async () => {
      setup();
      await render(schemaOf([text('name'), text('city', { defaultValue: 'HCM' })]));
      await type('name', 'Mai');
      fixture.componentInstance.reset();
      await settle();
      expect(fixture.componentInstance.value()).toEqual({ city: 'HCM' });
      expect(actions.map(action => [action.action, action.buttonId])).toEqual([['reset', null]]);
    });
  });

  describe('submit() and reset() from code', () => {
    it('behave like the buttons on a schema without any button, with buttonId null', async () => {
      setup();
      await render(schemaOf([text('name', { validation: { required: true } })]));
      expect(await fixture.componentInstance.submit()).toEqual({ valid: false, messages: { error: [], warning: [] }, value: {} });
      fixture.componentRef.setInput('value', { name: 'Lan' });
      await settle();
      expect(await fixture.componentInstance.submit()).toEqual({
        valid: true,
        messages: { error: [], warning: [] },
        value: { name: 'Lan' },
      });
      expect(actions).toEqual([{ action: 'submit', buttonId: null, value: { name: 'Lan' }, messages: { error: [], warning: [] } }]);
    });
  });

  describe('form-level error block', () => {
    it('lists the form-level errors of a failed submit, scrolls to them, and hides on a later success or on reset', async () => {
      setup();
      const scroll = spyOn(HTMLElement.prototype, 'scrollIntoView');
      const schema = schemaOf([text('a'), button('b-send')], {
        validations: [
          { type: 'filter', filter: { field: 'a', operator: 'EQUAL', data: 'x' }, message: 'A không được là x', alert: 'error' },
          { type: 'filter', filter: { field: 'a', operator: 'EQUAL', data: 'x' }, message: 'Chọn giá trị khác', alert: 'error' },
        ],
      });
      await render(schema, { value: { a: 'x' } });
      expect(errorBlock()).toBeNull();
      await press('b-send');
      expect(actions).toEqual([]);
      expect(errorBlock()?.querySelector('sd-inform .c-inform.c-error')).not.toBeNull();
      expect(errorBlock()?.textContent).toContain('A không được là x');
      expect(errorBlock()?.textContent).toContain('Chọn giá trị khác');
      expect(scroll).toHaveBeenCalledWith({ block: 'nearest' });
      // why: the block stands before the grid, so it is the first thing read after the failed submit.
      expect(errorBlock()!.compareDocumentPosition(root().querySelector('.sd-fg-grid')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      fixture.componentRef.setInput('value', { a: 'y' });
      await settle();
      await press('b-send');
      expect(errorBlock()).toBeNull();
      expect(actions.length).toBe(1);

      fixture.componentRef.setInput('value', { a: 'x' });
      await settle();
      await press('b-send');
      expect(errorBlock()).not.toBeNull();
      fixture.componentInstance.reset();
      await settle();
      expect(errorBlock()).toBeNull();
    });
  });

  describe('upload', () => {
    it('never uploads from the action pipeline: the action value has no upload result until upload() runs', async () => {
      setup();
      const schema = schemaOf([{ id: 'f-files', key: 'files', type: 'upload', label: 'Files' }, button('b-send')]);
      await render(schema, { value: { note: 'n' } });
      const upload = fixture.debugElement.query(By.directive(UploadComponent)).componentInstance as UploadComponent;
      const spy = spyOn(upload, 'upload').and.callFake(async () => upload.setValue(['file-1']));
      await press('b-send');
      expect(spy).not.toHaveBeenCalled();
      expect(actions.length).toBe(1);
      expect(actions[0].value).toEqual({ note: 'n' });
      await fixture.componentInstance.upload();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.value()).toEqual({ note: 'n', files: ['file-1'] });
    });
  });
});
