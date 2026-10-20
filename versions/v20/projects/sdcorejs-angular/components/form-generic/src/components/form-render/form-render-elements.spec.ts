import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { LibButtonElementComponent, LibStaticElementComponent } from '../elements';
import { LibItemComponent } from './components';
import { SdFormRender } from './form-render.component';

type Json = Record<string, unknown>;

const text = (key: string, extra: Json = {}): Json => ({ id: `f-${key}`, key, type: 'textfield', label: key.toUpperCase(), ...extra });
const schemaOf = (elements: Json[], extra: Json = {}) => ({ pages: [{ id: 'p', elements }], ...extra }) as unknown as SdFormGenericSchema;
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('SdFormRender static elements and buttons', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let container: HTMLDivElement;
  const root = () => fixture.nativeElement as HTMLElement;
  const statics = () =>
    fixture.debugElement
      .queryAll(By.directive(LibStaticElementComponent))
      .map(debug => debug.componentInstance as LibStaticElementComponent);
  const buttons = () =>
    fixture.debugElement
      .queryAll(By.directive(LibButtonElementComponent))
      .map(debug => debug.componentInstance as LibButtonElementComponent);
  const fieldKeys = () =>
    fixture.debugElement.queryAll(By.directive(LibItemComponent)).map(debug => (debug.componentInstance as LibItemComponent).field().key);
  const ids = () => [...statics().map(item => item.element().id), ...buttons().map(item => item.button().id)].sort();
  /** Ô của lưới gom theo `data-row` (DOM phẳng). */
  const rowIds = () => {
    const rows = new Map<string, string[]>();
    for (const cell of Array.from(root().querySelectorAll<HTMLElement>('.sd-fg-grid > [data-element-id]'))) {
      const row = cell.dataset['row'] ?? '';
      rows.set(row, [...(rows.get(row) ?? []), cell.dataset['elementId'] ?? '']);
    }
    return [...rows.entries()].sort(([left], [right]) => Number(left) - Number(right)).map(([, keys]) => keys);
  };

  const setup = () => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [SdFormRender, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdFormRender);
    container = document.createElement('div');
    container.style.width = '1100px';
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

  afterEach(() => container.remove());

  it('renders static elements and buttons on the page and inside a group, as text only', async () => {
    setup();
    await render(
      schemaOf([
        { id: 's-title', type: 'heading', text: 'Hồ sơ <b>khách</b>', level: 2 },
        text('name'),
        {
          id: 'g',
          type: 'group',
          label: 'G',
          elements: [
            { id: 's-note', type: 'notice', text: 'Kiểm tra lại', color: 'warning' },
            text('email'),
            { id: 'b-send', type: 'button', label: 'Gửi', action: 'submit' },
          ],
        },
      ])
    );
    expect(ids()).toEqual(['b-send', 's-note', 's-title']);
    expect(fieldKeys()).toEqual(['name', 'email']);
    expect(root().querySelector('h2')?.textContent?.trim()).toBe('Hồ sơ <b>khách</b>');
    expect(root().querySelector('h2 b')).toBeNull();
    expect(root().querySelector('[data-element-id="g"] [data-element-id="b-send"] sd-button')).not.toBeNull();
  });

  it('places static elements and buttons in the grid by their layout, like fields', async () => {
    setup();
    await render(
      schemaOf([
        { id: 's-title', type: 'heading', text: 'T' },
        text('a', { layout: { span: { desktop: 6 } } }),
        { id: 's-hint', type: 'paragraph', text: 'P', layout: { span: { desktop: 6 } } },
        { id: 'b-1', type: 'button', label: '1', action: 'submit', layout: { span: { desktop: 3 } } },
        { id: 'b-2', type: 'button', label: '2', action: 'reset', layout: { span: { desktop: 3 } } },
        { id: 's-line', type: 'divider', layout: { newRow: true, span: { desktop: 3 } } },
      ]),
      { breakpoint: 'desktop' }
    );
    expect(rowIds()).toEqual([['s-title'], ['f-a', 's-hint'], ['b-1', 'b-2'], ['s-line']]);
  });

  it('shows and hides static elements by their rules and disables a button by its rules, live', async () => {
    setup();
    const schema = schemaOf([
      text('plan'),
      { id: 's-premium', type: 'notice', text: 'Premium', rules: { visible: { field: 'plan', operator: 'EQUAL', data: 'premium' } } },
      { id: 's-basic', type: 'paragraph', text: 'Basic', rules: { hidden: { field: 'plan', operator: 'EQUAL', data: 'premium' } } },
      {
        id: 'b-send',
        type: 'button',
        label: 'Gửi',
        action: 'submit',
        rules: { disabled: { field: 'locked', operator: 'EQUAL', data: true } },
      },
    ]);
    await render(schema, { value: { plan: 'basic' }, variables: { locked: true } });
    expect(ids()).toEqual(['b-send', 's-basic']);
    const sdButton = () => fixture.debugElement.query(By.directive(SdButton)).componentInstance as SdButton;
    expect(sdButton().disabled()).toBeTrue();
    fixture.componentRef.setInput('value', { plan: 'premium' });
    fixture.componentRef.setInput('variables', { locked: false });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(ids()).toEqual(['b-send', 's-premium']);
    expect(sdButton().disabled()).toBeFalse();
  });

  it('in view mode keeps static elements, hides buttons unless showWhenViewed, and still applies disabled rules', async () => {
    setup();
    await render(
      schemaOf([
        text('name'),
        { id: 's-title', type: 'heading', text: 'T' },
        { id: 'b-send', type: 'button', label: 'Gửi', action: 'submit' },
        { id: 'b-print', type: 'button', label: 'In', action: 'custom', name: 'print', showWhenViewed: true, disabled: true },
      ]),
      { viewed: true }
    );
    expect(ids()).toEqual(['b-print', 's-title']);
    expect((fixture.debugElement.query(By.directive(SdButton)).componentInstance as SdButton).disabled()).toBeTrue();
  });

  it('hides static elements and buttons when [keys] limits the rendered fields', async () => {
    setup();
    await render(
      schemaOf([
        { id: 's-title', type: 'heading', text: 'T' },
        text('name'),
        text('email'),
        { id: 'b-print', type: 'button', label: 'In', action: 'custom', name: 'print', showWhenViewed: true },
      ]),
      { keys: ['name'] }
    );
    expect(fieldKeys()).toEqual(['name']);
    expect(ids()).toEqual([]);
  });

  it('keeps static elements and buttons out of the value and of validate()', async () => {
    setup();
    const elements = [
      text('name', { validation: { required: true } }),
      { id: 's-title', type: 'heading', text: 'T' },
      { id: 'b-send', type: 'button', label: 'Gửi', action: 'submit' },
    ];
    await render(schemaOf(elements), { value: { name: 'Lan' } });
    expect(fixture.componentInstance.value()).toEqual({ name: 'Lan' });
    expect(Object.keys(fixture.componentInstance.formGroup().controls)).toEqual(['name']);
    expect(await fixture.componentInstance.validate()).toEqual({ valid: true, messages: { error: [], warning: [] } });
  });

  it('skips an element that breaks the grammar, with one dev warning each, and renders an invalid heading level as 3', async () => {
    setup();
    const warn = spyOn(console, 'warn');
    await render(
      schemaOf([
        { id: 's-empty', type: 'heading', text: '  ' },
        { id: 'b-nameless', type: 'button', label: 'Go', action: 'custom' },
        { id: 'b-unlabelled', type: 'button', action: 'submit' },
        { id: 's-level', type: 'heading', text: 'Level 9', level: 9 },
      ])
    );
    expect(ids()).toEqual(['s-level']);
    expect(root().querySelector('h3')?.textContent?.trim()).toBe('Level 9');
    expect(warn).toHaveBeenCalledTimes(3);
    fixture.componentRef.setInput('value', { x: 1 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('shows a link with an unsafe href as text and drops an image with an unsafe src, warning once per element', async () => {
    setup();
    const warn = spyOn(console, 'warn');
    await render(
      schemaOf([
        { id: 's-link', type: 'link', text: 'Bấm vào đây', href: 'javascript:alert(1)' },
        { id: 's-image', type: 'image', src: 'data:text/html,<b>x</b>', alt: 'X' },
        { id: 's-empty', type: 'link', text: 'Chưa có link', href: '' },
      ])
    );
    expect(root().querySelector('a')).toBeNull();
    expect(root().querySelector('img')).toBeNull();
    expect(root().textContent).toContain('Bấm vào đây');
    expect(root().textContent).toContain('Chưa có link');
    // why: an empty URL is "not set yet" — no warning; the two unsafe ones warn once each.
    expect(warn).toHaveBeenCalledTimes(2);
    fixture.componentRef.setInput('value', { x: 1 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
