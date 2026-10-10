import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormField } from '@angular/material/form-field';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { provideSdFormGeneric } from '../../configurations/form-generic.provider';
import type { SdFormGenericConfig } from '../../models/form-generic-config.model';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
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
  // Read the renderer's actual logical query: Core bodies can be detached from the DOM while their controls stay mounted.
  const items = () => Array.from(fixture.componentInstance['items']());
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
    fixture.autoDetectChanges();
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

  describe('narrow field content flow', () => {
    it('reserves dynamic hint/error space only inside Form while preserving inherited Material defaults', async () => {
      const inherited = {
        appearance: 'fill' as const,
        floatLabel: 'always' as const,
        hideRequiredMarker: true,
        subscriptSizing: 'fixed' as const,
      };
      TestBed.configureTestingModule({ providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: inherited }] });
      setup();
      await render(schemaOf([text('phone', { helperText: 'Telephone guidance' })]));
      const local = fixture.debugElement.query(By.directive(MatFormField));
      expect((local.componentInstance as MatFormField).subscriptSizing).toBe('dynamic');
      expect(local.injector.get(MAT_FORM_FIELD_DEFAULT_OPTIONS)).toEqual({ ...inherited, subscriptSizing: 'dynamic' });
      expect(TestBed.inject(MAT_FORM_FIELD_DEFAULT_OPTIONS)).toBe(inherited);
      const outside = TestBed.createComponent(SdInput);
      try {
        outside.detectChanges();
        expect((outside.debugElement.query(By.directive(MatFormField)).componentInstance as MatFormField).subscriptSizing).toBe('fixed');
      } finally {
        outside.destroy();
      }
    });
    for (const width of [240, 310]) {
      for (const grouped of [false, true]) {
        it(`keeps multiline helper/error and radio labels within ${width}px ${grouped ? 'grouped' : 'legacy ungrouped'} fields`, async () => {
          setup();
          const fields = [
            text('phone', {
              helperText:
                'Keep the leading zero and country prefix when entering a telephone number. This guidance must remain fully readable.',
              layout: { span: { desktop: 6, tablet: 6, mobile: 6 } },
              validation: {
                pattern: {
                  value: '^valid$',
                  message: 'Please enter a valid telephone number including the leading zero and country prefix before continuing.',
                },
              },
            }),
            text('other', { layout: { span: { desktop: 6, tablet: 6, mobile: 6 } } }),
            {
              id: 'gender',
              key: 'gender',
              type: 'radio',
              label: 'Gender',
              direction: 'row',
              layout: { span: { desktop: 12, tablet: 12, mobile: 12 } },
              options: {
                source: 'static',
                items: [
                  { value: 'female', label: 'Female option with a longer label' },
                  { value: 'male', label: 'Male option with a longer label' },
                  { value: 'other', label: 'Other' },
                ],
              },
            },
          ];
          await render(schemaOf(grouped ? [{ id: 'group', type: 'group', label: 'Personal', elements: fields }] : fields));
          await resize(width);
          const phone = root().querySelector<HTMLElement>('[data-element-id="f-phone"]')!;
          const radio = root().querySelector<HTMLElement>('[data-element-id="gender"]')!;
          const assertFlow = (selector: string) => {
            const message = phone.querySelector<HTMLElement>(selector)!;
            expect(message).withContext('actual projected helper/error exists').not.toBeNull();
            expect(message.getBoundingClientRect().height).withContext('message wraps into multiple lines').toBeGreaterThan(20);
            expect(message.getBoundingClientRect().bottom)
              .withContext('message clears the following radio label')
              .toBeLessThanOrEqual(radio.querySelector('sd-label')!.getBoundingClientRect().top);
            const bounds = radio.getBoundingClientRect();
            for (const label of Array.from(radio.querySelectorAll<HTMLElement>('.mdc-label'))) {
              const rect = label.getBoundingClientRect();
              expect(rect.right)
                .withContext(label.textContent ?? 'radio label')
                .toBeLessThanOrEqual(bounds.right + 1);
              expect(rect.left).toBeGreaterThanOrEqual(bounds.left - 1);
            }
          };
          assertFlow('mat-hint');
          const rows = Array.from(root().querySelectorAll<HTMLElement>('[data-element-id]')).map(cell => ({
            id: cell.dataset['elementId'],
            row: cell.dataset['row'],
            column: cell.style.gridColumn,
          }));
          fixture.componentRef.setInput('value', { phone: 'invalid' });
          await render(fixture.componentInstance.schema());
          await fixture.componentInstance.validate();
          fixture.detectChanges();
          await frames();
          assertFlow('mat-error');
          expect(
            Array.from(root().querySelectorAll<HTMLElement>('[data-element-id]')).map(cell => ({
              id: cell.dataset['elementId'],
              row: cell.dataset['row'],
              column: cell.style.gridColumn,
            }))
          ).toEqual(rows);
        });
      }
    }
  });

  describe('tabs and steps (AC-101–107)', () => {
    const pages = (navigation?: Json): SdFormGenericSchema =>
      ({
        pages: [
          { id: 'first', label: 'First', elements: [text('a')] },
          { id: 'second', label: 'Second', elements: [text('b', { validation: { required: true } })] },
          { id: 'third', label: 'Third', elements: [text('c')] },
        ],
        ...(navigation ? { navigation } : {}),
      }) as unknown as SdFormGenericSchema;
    const tab = (id: string) => {
      const index = fixture.componentInstance.visiblePages().findIndex(page => page.id === id);
      return index < 0
        ? null
        : (root().querySelectorAll<HTMLElement>('.sd-fg-navigation .mat-mdc-tab,.sd-fg-navigation mat-step-header')[index] ?? null);
    };
    // Core keeps projected controls alive before their Material body is attached to the document.
    const panel = (id: string) => root().querySelector<HTMLElement>(`[data-page-id="${id}"]`);
    const exposed = (id: string) => {
      const element = panel(id);
      return !!element && element.isConnected && !element.hidden && !element.closest('[inert]');
    };

    it('does not assign an external invalid control to a keyed HTML field', async () => {
      setup();
      const external = new FormControl('', () => ({ external: true }));
      const form = new FormGroup({ external });
      const schema = {
        navigation: { type: 'steps', linear: true },
        pages: [
          { id: 'first', elements: [{ id: 'html', key: 'external', type: 'html', content: 'Information' }] },
          { id: 'last', elements: [] },
        ],
      } as unknown as SdFormGenericSchema;
      await render(schema, { form });
      await fixture.componentInstance.requestPage('last');
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).withContext('external errors do not gate page-owned fields').toBe('last');
      expect((await fixture.componentInstance.validate()).valid).toBeFalse();
      expect(fixture.componentInstance.activePageId()).withContext('external-only failure has no page destination').toBe('last');
      expect(form.controls.external).toBe(external);
    });

    for (const change of ['delete', 'hide'] as const) {
      it(`repairs the roving tab stop when an inactive focused page is ${change === 'hide' ? 'hidden' : 'deleted'}`, async () => {
        setup();
        await render(pages({ type: 'tabs' }));
        tab('first')!.focus();
        tab('first')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }));
        fixture.detectChanges();
        expect(document.activeElement).toBe(tab('third'));
        expect(fixture.componentInstance.activePageId()).toBe('first');
        const next = pages({ type: 'tabs' });
        if (change === 'delete') next.pages.pop();
        else next.pages[2].rules = { hidden: { field: 'hideThird', operator: 'EQUAL', data: true } } as never;
        fixture.componentRef.setInput('value', { hideThird: true });
        fixture.componentRef.setInput('schema', next);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(tab('third')).toBeNull();
        expect(tab('first')!.tabIndex).toBe(0);
        expect(tab('second')!.tabIndex).toBe(-1);
        await frames();
        expect(document.activeElement).toBe(tab('first'));
      });
    }

    it('repairs a removed inactive tab stop without stealing focus from an external input', async () => {
      setup();
      await render(pages({ type: 'tabs' }));
      tab('first')!.focus();
      tab('first')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }));
      fixture.detectChanges();
      const input = document.createElement('input');
      container.appendChild(input);
      input.focus();
      const next = pages({ type: 'tabs' });
      next.pages.pop();
      fixture.componentRef.setInput('schema', next);
      fixture.detectChanges();
      await fixture.whenStable();
      await frames();
      fixture.detectChanges();
      expect(tab('first')!.tabIndex).toBe(0);
      expect(document.activeElement).toBe(input);
    });

    it('gates a simultaneous schema and consumer page request after new predecessor controls mount', async () => {
      setup();
      const schema = {
        navigation: { type: 'steps', linear: true },
        pages: [
          { id: 'first', elements: [] },
          { id: 'last', elements: [] },
        ],
      } as SdFormGenericSchema;
      await render(schema);
      fixture.componentRef.setInput('schema', {
        ...schema,
        pages: [{ id: 'first', elements: [text('required', { validation: { required: true } })] }, schema.pages[1]],
      });
      fixture.componentRef.setInput('activePageId', 'last');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.formGroup().controls['required']?.invalid).toBeTrue();
      expect(fixture.componentInstance.activePageId()).toBe('first');
    });

    for (const rebind of ['key', 'form'] as const) {
      it(`gates a same-turn ${rebind} rebind and consumer forward request`, async () => {
        setup();
        const original = new FormGroup<Record<string, AbstractControl>>({});
        const schema = {
          navigation: { type: 'steps', linear: true },
          pages: [
            { id: 'first', elements: [text('a', { validation: { required: true } })] },
            { id: 'last', elements: [] },
          ],
        } as unknown as SdFormGenericSchema;
        await render(schema, { form: original });
        if (rebind === 'key')
          fixture.componentRef.setInput('schema', {
            ...schema,
            pages: [{ id: 'first', elements: [text('b', { id: 'f-a', validation: { required: true } })] }, schema.pages[1]],
          });
        else fixture.componentRef.setInput('form', new FormGroup<Record<string, AbstractControl>>({}));
        fixture.componentRef.setInput('activePageId', 'last');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(fixture.componentInstance.formGroup().controls[rebind === 'key' ? 'b' : 'a']?.invalid).toBeTrue();
        expect(fixture.componentInstance.effectivePageId()).toBe('first');
        expect(fixture.componentInstance.activePageId()).toBe('first');
      });
    }

    it('uses exact owned registration after consumer control replacement and preserves original form events', async () => {
      setup();
      const external = new FormControl('', () => ({ external: true }));
      const form = new FormGroup<Record<string, AbstractControl>>({ external });
      const schema = {
        navigation: { type: 'steps', linear: true },
        pages: [
          { id: 'first', elements: [text('a')] },
          { id: 'last', elements: [] },
        ],
      } as unknown as SdFormGenericSchema;
      await render(schema, { form, value: { a: 'valid' } });
      const field = fixture.debugElement.query(By.directive(TextfieldComponent)).componentInstance as TextfieldComponent;
      expect(field.form() instanceof FormGroup).toBeTrue();
      expect(field.form().controls).toBe(form.controls);
      expect(field.form().valueChanges).toBe(form.valueChanges);
      expect(field.form().statusChanges).toBe(form.statusChanges);
      const replacement = new FormControl('', () => ({ replaced: true }));
      form.setControl('a', replacement);
      await fixture.componentInstance.requestPage('last');
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('last');
      expect((await fixture.componentInstance.validate()).valid).toBeFalse();
      expect(fixture.componentInstance.activePageId()).toBe('last');
      fixture.destroy();
      expect(form.controls['a']).toBe(replacement);
      expect(form.controls['external']).toBe(external);
    });

    it('does not reclaim a displaced external control restored when a field becomes HTML', async () => {
      setup();
      spyOn(console, 'error'); // Existing primitive connector reports the deliberate name collision.
      const external = new FormControl('', () => ({ external: true }));
      const form = new FormGroup<Record<string, AbstractControl>>({ a: external });
      const schema = {
        navigation: { type: 'steps', linear: true },
        pages: [
          { id: 'first', elements: [text('a')] },
          { id: 'last', elements: [] },
        ],
      } as unknown as SdFormGenericSchema;
      await render(schema, { form, value: { a: 'valid' } });
      expect(form.controls['a']).not.toBe(external);
      fixture.componentRef.setInput('schema', {
        ...schema,
        pages: [{ id: 'first', elements: [{ id: 'f-a', key: 'a', type: 'html', content: 'Info' }] }, schema.pages[1]],
      });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(form.controls['a']).toBe(external);
      await fixture.componentInstance.requestPage('last');
      expect(fixture.componentInstance.activePageId()).toBe('last');
      expect((await fixture.componentInstance.validate()).valid).toBeFalse();
      expect(fixture.componentInstance.activePageId()).toBe('last');
    });

    it('rebinds page ownership when field keys and the consumer FormGroup change', async () => {
      setup();
      const external = new FormControl('', () => ({ external: true }));
      const original = new FormGroup<Record<string, AbstractControl>>({ external });
      const schema = {
        navigation: { type: 'steps', linear: true },
        pages: [
          { id: 'first', elements: [text('a')] },
          { id: 'last', elements: [] },
        ],
      } as unknown as SdFormGenericSchema;
      await render(schema, { form: original, value: { a: 'valid', b: 'valid' } });
      const nextExternal = new FormControl('', () => ({ external: true }));
      const next = new FormGroup<Record<string, AbstractControl>>({ external: nextExternal });
      fixture.componentRef.setInput('schema', {
        ...schema,
        pages: [{ id: 'first', elements: [text('b', { id: 'f-a' })] }, schema.pages[1]],
      });
      fixture.componentRef.setInput('form', next);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(original.controls['a']).toBeUndefined();
      expect(original.controls['external']).toBe(external);
      expect(next.controls['b']?.valid).toBeTrue();
      await fixture.componentInstance.requestPage('last');
      expect(fixture.componentInstance.activePageId()).toBe('last');
      fixture.destroy();
      expect(next.controls['b']).toBeUndefined();
      expect(next.controls['external']).toBe(nextExternal);
    });

    it('preserves first-page behavior without navigation', async () => {
      setup();
      await render(pages());
      expect(items().map(i => i.field().key)).toEqual(['a']);
      expect(root().querySelector('[role="tablist"]')).toBeNull();
      expect((await fixture.componentInstance.validate()).valid).toBeTrue();
    });

    it('eagerly mounts visible tab pages and retains dirty/touched controls while inactive', async () => {
      setup();
      await render(pages({ type: 'tabs' }));
      const control = (fixture.componentInstance.formGroup() as FormGroup).get('b');
      expect(control).withContext('unvisited second-page control').not.toBeNull();
      expect(exposed('second')).toBeFalse();
      expect(exposed('second')).toBeFalse();
      if (!control || !tab('second')) return;
      control.markAsDirty();
      control.markAsTouched();
      tab('second')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(exposed('second')).toBeTrue();
      expect((fixture.componentInstance.formGroup() as FormGroup).get('b')).toBe(control);
      expect(control.dirty && control.touched).toBeTrue();
    });

    it('validates an invalid unvisited page, selects it, and runs global validations exactly once', async () => {
      const validate = jasmine.createSpy('global').and.resolveTo('Suggestion');
      setup({ validators: [{ id: 'global', label: 'Global', validate }] });
      const schema = pages({ type: 'tabs' });
      schema.validations = [{ type: 'function', validator: 'global', alert: 'warning' }];
      await render(schema);
      const result = await fixture.componentInstance.validate();
      fixture.detectChanges();
      expect(result.valid).toBeFalse();
      expect(result.messages.warning).toEqual(['Suggestion']);
      expect(exposed('second')).toBeTrue();
      expect((fixture.componentInstance.formGroup() as FormGroup).get('b')?.touched).toBeTrue();
      expect(validate).toHaveBeenCalledTimes(1);
    });

    it('uses manual arrow/Home/End activation with roving focus', async () => {
      setup();
      await render(pages({ type: 'tabs' }));
      expect(tab('first')).not.toBeNull();
      if (!tab('first')) return;
      tab('first')!.focus();
      tab('first')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(tab('third'));
      expect(exposed('first')).toBeTrue();
      tab('third')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(exposed('third')).toBeTrue();
    });

    it('unregisters only rule-hidden page controls, retains values and external validation', async () => {
      setup();
      const schema = pages({ type: 'tabs' });
      schema.pages[1].rules = { hidden: { field: 'hide', operator: 'EQUAL', data: true } };
      const external = new FormControl('external');
      const form = new FormGroup({ external });
      await render(schema, { form, value: { b: 'retained' } });
      expect(form.get('b')).not.toBeNull();
      fixture.componentRef.setInput('value', { b: 'retained', hide: true });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(form.get('b')).toBeNull();
      expect(form.get('external')).toBe(external);
      expect(fixture.componentInstance.value()['b']).toBe('retained');
      expect(tab('second')).toBeNull();
    });

    it('defaults steps to nonlinear and gates all predecessors when linear is enabled', async () => {
      setup();
      await render(pages({ type: 'steps' }));
      expect(tab('third')).not.toBeNull();
      if (!tab('third')) return;
      tab('third')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(exposed('third')).toBeTrue();
      fixture.componentRef.setInput('schema', pages({ type: 'steps', linear: true }));
      fixture.componentRef.setInput('activePageId', 'first');
      fixture.detectChanges();
      await fixture.whenStable();
      tab('third')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(exposed('second')).toBeTrue();
      expect(exposed('third')).toBeFalse();
      tab('first')!.click();
      fixture.detectChanges();
      expect(exposed('first')).toBeTrue();
    });

    it('gates consumer active-page writes and restores the accepted model on rejection', async () => {
      setup();
      await render(pages({ type: 'steps', linear: true }));
      fixture.componentRef.setInput('activePageId', 'third');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('second');
      expect(exposed('third')).toBeFalse();
    });

    it('allows backward navigation to invalidate a pending forward transition and ignores late settlement', async () => {
      setup();
      await render(pages({ type: 'steps', linear: true }), { value: { b: 'valid' }, activePageId: 'second' });
      let finish!: () => void;
      const done = new Promise<void>(resolve => (finish = resolve));
      const control = fixture.componentInstance.formGroup().get('b')!;
      control.setAsyncValidators(() => done.then(() => null));
      control.updateValueAndValidity({ emitEvent: false });
      const transition = fixture.componentInstance.requestPage('third');
      expect(fixture.componentInstance.navigationPending()).toBeTrue();
      await fixture.componentInstance.requestPage('first');
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('first');
      expect(fixture.componentInstance.navigationPending()).toBeFalse();
      finish();
      await transition;
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('first');
    });

    it('does not let stale public validation override a later page navigation', async () => {
      let finish!: () => void;
      const done = new Promise<void>(resolve => (finish = resolve));
      setup({ validators: [{ id: 'wait', label: 'Wait', validate: () => done.then(() => '') }] });
      const schema = pages({ type: 'tabs' });
      schema.validations = [{ type: 'function', validator: 'wait', alert: 'error' }];
      await render(schema);
      const validation = fixture.componentInstance.validate();
      await fixture.componentInstance.requestPage('third');
      fixture.detectChanges();
      finish();
      await validation;
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('third');
    });

    it('rejects stale pending forward settlement after retained value or page rules change', async () => {
      setup();
      const schema = pages({ type: 'steps', linear: true });
      await render(schema, { value: { b: 'valid' } });
      let finish!: () => void;
      const done = new Promise<void>(resolve => (finish = resolve));
      const control = fixture.componentInstance.formGroup().get('b')!;
      control.setAsyncValidators(() => done.then(() => null));
      control.updateValueAndValidity({ emitEvent: false });
      const transition = fixture.componentInstance.requestPage('third');
      const repeated = fixture.componentInstance.requestPage('third');
      await repeated;
      fixture.componentRef.setInput('value', { b: 'changed' });
      fixture.detectChanges();
      finish();
      await transition;
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('first');
    });

    it('uploads each mounted visible page once and skips rule-hidden pages', async () => {
      setup();
      const schema = pages({ type: 'tabs' });
      schema.pages[2].rules = { hidden: { field: 'hide', operator: 'EQUAL', data: true } };
      await render(schema, { value: { hide: true } });
      const uploads = items().map(item => spyOn(item, 'upload').and.resolveTo());
      await fixture.componentInstance.upload();
      expect(items().map(item => item.field().key)).toEqual(['a', 'b']);
      uploads.forEach(upload => expect(upload).toHaveBeenCalledTimes(1));
    });

    it('falls to the nearest visible successor then predecessor', async () => {
      setup();
      const schema = pages({ type: 'tabs' });
      await render(schema, { activePageId: 'second' });
      const changed = { ...schema, pages: schema.pages.filter(page => page.id !== 'second') };
      fixture.componentRef.setInput('schema', changed);
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('third');
      fixture.componentRef.setInput('schema', { ...changed, pages: changed.pages.filter(page => page.id !== 'third') });
      fixture.detectChanges();
      expect(fixture.componentInstance.activePageId()).toBe('first');
    });

    it('reconciles invalid consumer IDs back to the first visible page and accepted model', async () => {
      setup();
      await render(pages({ type: 'tabs' }));
      fixture.componentRef.setInput('activePageId', 'missing');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.activePageId()).toBe('first');
      expect(exposed('first')).toBeTrue();
      fixture.componentRef.setInput('activePageId', null);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.activePageId()).toBe('first');
    });

    it('keeps external validation when every page is rule-hidden, with no invented focus destination', async () => {
      setup();
      const schema = pages({ type: 'steps', linear: true });
      schema.pages.forEach(page => (page.rules = { hidden: { field: 'hide', operator: 'EQUAL', data: true } }));
      const external = new FormControl('', { validators: () => ({ external: true }) });
      const form = new FormGroup({ external });
      await render(schema, { form, value: { hide: true, b: 'kept' } });
      expect(fixture.componentInstance.activePageId()).toBeNull();
      expect(items()).toEqual([]);
      expect(root().querySelector('[data-page-button]')).toBeNull();
      expect((await fixture.componentInstance.validate()).valid).toBeFalse();
      expect(external.touched).toBeTrue();
      expect(form.get('external')).toBe(external);
      expect(fixture.componentInstance.value()['b']).toBe('kept');
    });
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
