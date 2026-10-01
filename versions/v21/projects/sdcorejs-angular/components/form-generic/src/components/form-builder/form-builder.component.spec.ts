import { ApplicationRef, Component, signal, viewChildren } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdConfirmService, SdNotifyOption, SdNotifyService, SdToastData } from '@sdcorejs/angular/services';
import { sdValidateSchema } from '../../models/form-generic-schema';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { FormGenericService } from '../../services/form-generic.service';
import { SdFormRender } from '../form-render/form-render.component';
import { ConfigureValidationComponent } from './components/configure-validation/configure-validation.component';
import { SdFormBuilder } from './form-builder.component';
import { InspectorComponent } from './inspector/inspector.component';
import { PreviewComponent } from './preview/preview.component';

type AnyItem = Record<string, any>;

/**
 * Notify giả, cùng API builder dùng (success / remove / toasts) nhưng không có timer tự đóng —
 * toast thật giữ zone bận 5 s và làm mọi `whenStable()` sau một lần xoá phải chờ theo.
 */
class FakeNotify {
  readonly toasts = signal<SdToastData[]>([]);
  success(message: string, option: SdNotifyOption = {}): void {
    this.toasts.update(list => [
      { id: `t${list.length + 1}-${Date.now()}`, type: 'success', message, duration: option.duration ?? 3000, ...option },
      ...list,
    ]);
  }
  remove(id: string): void {
    this.toasts.update(list => list.filter(toast => toast.id !== id));
  }
  clearAll(): void {
    this.toasts.set([]);
  }
}

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
};

/** Schema có đủ thứ dễ rơi rớt khi load → get: thuộc tính lạ, preset, group, rule Filter, biến. */
const seed = (): SdFormGenericSchema =>
  ({
    pages: [
      {
        id: 'page',
        elements: [
          {
            id: 'g1',
            type: 'group',
            label: 'Personal',
            icon: 'person',
            color: 'primary',
            collapsible: false,
            consumerFlag: 'kept',
            elements: [
              {
                id: 'a',
                key: 'email',
                type: 'textfield',
                subtype: 'email',
                label: 'Email',
                placeholder: 'name@example.com',
                layout: { span: { desktop: 6 } },
                validation: { required: true },
                consumerData: { nested: [1, 2, { deep: true }] },
              },
              {
                id: 'b',
                key: 'budget',
                type: 'number',
                subtype: 'currency',
                label: 'Budget',
                layout: { span: { desktop: 6 } },
                validation: { min: 0 },
                currency: 'USD',
                precision: 0,
              },
            ],
          },
          {
            id: 'c',
            key: 'note',
            type: 'textarea',
            label: 'Note',
            rules: { visible: { field: 'email', operator: 'NOT_NULL' } },
          },
        ],
      },
    ],
    variables: [{ key: 'userId', label: 'User' }],
  }) as unknown as SdFormGenericSchema;

@Component({
  standalone: true,
  imports: [SdFormBuilder],
  template: `
    <div class="host" style="width: 1280px; height: 760px; display: flex; flex-direction: column">
      <sd-form-builder style="flex: 1; min-height: 0" [(schema)]="form" (schemaChange)="onChange($event)"></sd-form-builder>
    </div>
    @if (second()) {
      <div style="width: 1280px; height: 760px; display: flex; flex-direction: column">
        <sd-form-builder style="flex: 1; min-height: 0" [schema]="secondForm()"></sd-form-builder>
      </div>
    }
  `,
})
class HostComponent {
  readonly form = signal<SdFormGenericSchema | undefined>(undefined);
  readonly second = signal(false);
  readonly secondForm = signal<SdFormGenericSchema | undefined>(undefined);
  readonly emitted: SdFormGenericSchema[] = [];
  readonly builders = viewChildren(SdFormBuilder);
  onChange(value: SdFormGenericSchema | undefined): void {
    if (value) this.emitted.push(value);
  }
}

describe('SdFormBuilder (integration)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let confirm: jasmine.Spy;

  const builder = (index = 0): SdFormBuilder => host.builders()[index];
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const render = async (): Promise<void> => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const elementsOf = (schema: SdFormGenericSchema): AnyItem[] => schema.pages[0].elements as unknown as AnyItem[];
  const find = (schema: SdFormGenericSchema, id: string): AnyItem | undefined => {
    const walk = (list: AnyItem[] = []): AnyItem | undefined => {
      for (const item of list) {
        if (item['id'] === id) return item;
        const child = walk(item['elements']);
        if (child) return child;
      }
      return undefined;
    };
    return walk(elementsOf(schema));
  };
  const ids = (list: AnyItem[] = []) => list.map(item => item['id']);
  const current = () => builder().getSchema();
  const toolbarButton = (value: string) => root().querySelector<HTMLButtonElement>(`sd-form-builder .fb-toolbar [data-value="${value}"]`)!;

  const pointer = (type: string, target: EventTarget, x: number, y: number) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 7,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: x,
        clientY: y,
      })
    );
  const center = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
  };

  beforeEach(async () => {
    confirm = jasmine.createSpy('confirm').and.returnValue(Promise.resolve());
    TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [
        { provide: SdConfirmService, useValue: { confirm } },
        { provide: SdNotifyService, useClass: FakeNotify },
      ],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    document.body.appendChild(root());
    host.form.set(deepFreeze(seed()));
    await render();
  });

  afterEach(() => {
    fixture.destroy();
    root().remove();
  });

  it('loads a schema and returns it unchanged — unknown properties, presets, groups and rules survive load → get', () => {
    expect(current()).toEqual(seed());
    expect(host.emitted.length).withContext('loading is not a user change').toBe(0);
  });

  it('emits a valid schema after a user change: pages, no schemaVersion, no break element, ids and unique keys (AC-001)', async () => {
    for (const preset of ['text', 'email', 'group', 'integer']) {
      root().querySelector<HTMLButtonElement>(`fb-palette [data-palette-id="${preset}"]`)!.click();
      await render();
    }
    expect(host.emitted.length).toBe(4);
    const schema = host.emitted[host.emitted.length - 1];
    expect(sdValidateSchema(schema)).toEqual([]);
    expect('schemaVersion' in schema).toBeFalse();
    const all: AnyItem[] = [];
    const walk = (list: AnyItem[] = []) => list.forEach(item => (all.push(item), walk(item['elements'])));
    walk(elementsOf(schema));
    expect(all.some(item => item['type'] === 'break')).toBeFalse();
    expect(all.every(item => typeof item['id'] === 'string' && item['id'])).toBeTrue();
    const keys = all.filter(item => item['type'] !== 'group').map(item => item['key']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('never mutates the (deep-frozen) consumer input and emits independent snapshots', async () => {
    const input = host.form()!;
    root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="text"]')!.click();
    await render();

    expect(host.emitted.length).toBe(1);
    const snapshot = host.emitted[0];
    expect(snapshot).not.toBe(input);
    expect(elementsOf(snapshot).length).toBe(3);
    const added = elementsOf(snapshot)[2];
    expect(added['type']).toBe('textfield');
    expect(added['subtype']).toBe('text');
    expect(added['layout']).toEqual({ span: { desktop: 12 } });
    // Snapshot không chia sẻ tham chiếu với input hay với state của builder.
    expect(elementsOf(snapshot)[0]).not.toBe(elementsOf(input)[0]);
    expect(input).toEqual(seed());
    elementsOf(snapshot)[0]['label'] = 'changed by consumer';
    expect(elementsOf(current())[0]).toEqual(jasmine.objectContaining({ label: 'Personal' }));
    // getSchema() cũng là bản clone độc lập.
    elementsOf(current())[0]['label'] = 'changed again';
    expect(elementsOf(current())[0]['label']).toBe('Personal');
  });

  it('keeps history when [(schema)] echoes the emitted schema back, reloads on a schema with other content (AC-013)', async () => {
    root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="email"]')!.click();
    await render();
    const store = builder().store;
    const selected = store.selectedId();
    expect(store.canUndo()).toBeTrue();
    expect(selected).toBeTruthy();
    expect(host.form()).withContext('two-way binding carries the emitted schema back').toBe(host.emitted[0]);

    // Một bản clone cùng nội dung (vd consumer lưu rồi truyền lại): không reset.
    host.form.set(JSON.parse(JSON.stringify(host.emitted[0])));
    await render();
    expect(store.canUndo()).withContext('echo keeps history').toBeTrue();
    expect(store.selectedId()).toBe(selected);
    expect(host.emitted.length).toBe(1);

    // Schema khác nội dung = nạp form khác: lịch sử và selection reset, không phát schemaChange.
    host.form.set({ pages: [{ id: 'other', elements: [] }] });
    await render();
    expect(store.canUndo()).toBeFalse();
    expect(store.selectedId()).toBeNull();
    expect(elementsOf(current())).toEqual([]);
    expect(host.emitted.length).toBe(1);
  });

  it('undoes and redoes with the toolbar and with Ctrl+Z / Ctrl+Y, but leaves typing shortcuts to inputs', async () => {
    root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="integer"]')!.click();
    await render();
    expect(elementsOf(current()).length).toBe(3);

    const hostElement = root().querySelector('sd-form-builder')!;
    hostElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }));
    await render();
    expect(current()).toEqual(seed());

    hostElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true, cancelable: true }));
    await render();
    expect(elementsOf(current()).length).toBe(3);

    // Ctrl+Z trong ô tìm kiếm là undo gõ chữ của trình duyệt — builder không can thiệp.
    const search = root().querySelector<HTMLInputElement>('fb-palette input')!;
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }));
    await render();
    expect(elementsOf(current()).length).toBe(3);

    const [undo, redo] = Array.from(
      root().querySelectorAll<HTMLButtonElement>(
        'sd-form-builder .fb-toolbar sd-button[prefixicon="undo"] button, sd-form-builder .fb-toolbar sd-button[prefixicon="redo"] button'
      )
    );
    undo.click();
    await render();
    expect(current()).toEqual(seed());
    expect(undo.disabled).toBeTrue();
    redo.click();
    await render();
    expect(elementsOf(current()).length).toBe(3);
    // 1 thêm + undo + redo (phím) + undo + redo (nút) = 5 lần phát.
    expect(host.emitted.length).toBe(5);
  });

  it('keeps two builders on one page independent', async () => {
    host.second.set(true);
    host.secondForm.set(seed());
    await render();
    expect(host.builders().length).toBe(2);

    root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="url"]')!.click();
    await render();

    expect(elementsOf(builder(0).getSchema()).length).toBe(3);
    expect(builder(1).getSchema()).toEqual(seed());
    expect(builder(1).store.canUndo()).toBeFalse();
    expect(builder(0).store).not.toBe(builder(1).store);
  });

  it('offers Desktop | Tablet | Mobile, previews with the real sd-form-render forced to the chosen level, and shows read-only JSON in Schema mode', async () => {
    expect(['desktop', 'tablet', 'mobile'].every(value => !!toolbarButton(value))).toBeTrue();
    toolbarButton('tablet').click();
    await render();
    expect(root().querySelector('fb-canvas .fb-page')!.classList).toContain('fb-page--tablet');

    toolbarButton('preview').click();
    await render();
    const renderer = fixture.debugElement.query(By.directive(SdFormRender));
    expect(renderer).withContext('real renderer').not.toBeNull();
    expect((renderer.componentInstance as SdFormRender).breakpoint()).toBe('tablet');
    expect(root().querySelector('fb-preview .pv__frame')!.classList).toContain('pv__frame--tablet');
    expect(root().querySelector('fb-preview .sd-fg-grid')!.getAttribute('data-level')).toBe('tablet');
    expect(builder().store.canUndo()).toBeFalse();

    toolbarButton('schema').click();
    await render();
    expect(root().querySelector('sd-form-builder sd-code-editor')).not.toBeNull();
    expect(root().querySelector('sd-form-builder [data-value="mobile"]')).withContext('viewport toggle hidden in Schema').toBeNull();
    expect(JSON.parse(builder().schemaText())).toEqual(seed());

    toolbarButton('design').click();
    await render();
    expect(root().querySelector('fb-canvas')).not.toBeNull();
  });

  it('lays out canvas rows exactly like the preview at every level, including a field that starts a new row (AC-014)', async () => {
    host.form.set({
      pages: [
        {
          id: 'page',
          elements: [
            { id: 'a', key: 'a', type: 'textfield', label: 'A', layout: { span: { desktop: 6, tablet: 4, mobile: 6 } } },
            { id: 'b', key: 'b', type: 'textfield', label: 'B', layout: { span: { desktop: 6, mobile: 6 } } },
            { id: 'c', key: 'c', type: 'textfield', label: 'C', layout: { span: { desktop: 2 } } },
            { id: 'd', key: 'd', type: 'textfield', label: 'D', layout: { span: { desktop: 4 } } },
          ],
        },
      ],
    });
    await render();

    // Bật "Bắt đầu hàng mới" của D ở tab Bố cục.
    builder().store.select('d');
    builder().store.inspectorTab.set('layout');
    await render();
    const newRow = Array.from(root().querySelectorAll<HTMLElement>('fb-inspector fb-toggle-row')).find(
      row => row.querySelector('.toggle-row__label')!.textContent!.trim() === builder().store.t('core.component.form-builder.new-row')
    )!;
    expect(newRow).withContext('new-row switch in the Layout tab').toBeDefined();
    newRow.querySelector<HTMLElement>('button[role="switch"]')!.click();
    await render();
    expect(find(current(), 'd')!['layout']).toEqual({ span: { desktop: 4 }, newRow: true });
    expect(root().querySelector('[data-fb-item="d"] .fb-newrow')).withContext('canvas marks newRow').not.toBeNull();

    const canvasRows = () =>
      Array.from(root().querySelectorAll('[data-fb-container="root"] > [data-fb-row]')).map(row =>
        Array.from(row.querySelectorAll(':scope > [data-fb-item]')).map(cell => cell.getAttribute('data-fb-item'))
      );
    // The renderer's DOM is flat: each cell carries the row sdPackRows gave it.
    const previewRows = () => {
      const rows = new Map<string, (string | null)[]>();
      for (const cell of Array.from(root().querySelectorAll<HTMLElement>('fb-preview .sd-fg-grid > [data-element-id]'))) {
        const row = cell.dataset['row'] ?? '';
        rows.set(row, [...(rows.get(row) ?? []), cell.getAttribute('data-element-id')]);
      }
      return [...rows.entries()].sort(([left], [right]) => Number(left) - Number(right)).map(([, cells]) => cells);
    };
    const expected: Record<string, string[][]> = {
      desktop: [['a', 'b'], ['c'], ['d']],
      tablet: [['a', 'b', 'c'], ['d']],
      mobile: [['a', 'b'], ['c'], ['d']],
    };
    const error = spyOn(console, 'error').and.callThrough();
    for (const level of ['desktop', 'tablet', 'mobile']) {
      toolbarButton('design').click();
      toolbarButton(level).click();
      await render();
      expect(canvasRows()).withContext(`canvas ${level}`).toEqual(expected[level]);
      toolbarButton('preview').click();
      await render();
      expect(previewRows()).withContext(`preview ${level}`).toEqual(expected[level]);
    }
    // Switching the level while Preview stays open re-packs the live renderer in place.
    for (const level of ['desktop', 'tablet', 'mobile']) {
      toolbarButton(level).click();
      await render();
      expect(previewRows()).withContext(`live preview ${level}`).toEqual(expected[level]);
    }
    expect(error).withContext('fields that change row keep their control (no FormGroup name clash)').not.toHaveBeenCalled();
  });

  it('resizes on Tablet only span.tablet, shows the inheritance label, and clears back to "Theo Desktop" (AC-012)', async () => {
    toolbarButton('tablet').click();
    await render();
    const cell = root().querySelector<HTMLElement>('[data-fb-item="a"]')!;
    const handle = cell.querySelector<HTMLElement>('.fb-resize')!;
    const row = cell.parentElement!;
    const column = row.clientWidth / 12;
    const start = center(handle);

    pointer('pointerdown', handle, start.x, start.y);
    pointer('pointermove', document, start.x - column * 1.1, start.y);
    pointer('pointermove', document, start.x - column * 2, start.y);
    await render();
    expect(builder().store.resize()).toEqual(jasmine.objectContaining({ id: 'a', span: 4, mode: 'tablet' }));
    pointer('pointerup', document, start.x - column * 2, start.y);
    await render();

    expect(find(current(), 'a')!['layout']).toEqual({ span: { desktop: 6, tablet: 4 } });
    expect(find(current(), 'b')!['layout'])
      .withContext('siblings never shrink silently')
      .toEqual({ span: { desktop: 6 } });
    expect(host.emitted.length).toBe(1);

    builder().store.select('a');
    builder().store.inspectorTab.set('layout');
    await render();
    const inspector: InspectorComponent = fixture.debugElement.query(By.directive(InspectorComponent)).componentInstance;
    expect(inspector.spanSource()).toBe('own');
    expect(inspector.inheritedLabel()).toBe('');

    root().querySelector<HTMLButtonElement>('fb-inspector sd-button[prefixicon="restart_alt"] button')!.click();
    await render();
    expect(find(current(), 'a')!['layout']).toEqual({ span: { desktop: 6 } });
    const followDesktop = builder().store.t('core.component.form-builder.span.follow-desktop');
    expect(inspector.inheritedLabel()).toBe(followDesktop);
    expect(root().querySelector('[data-fb-item="a"] .fb-span-badge')!.textContent).toContain(followDesktop);
    expect(host.emitted.length).toBe(2);
  });

  it('on Mobile labels a field without span.mobile as "Mặc định" in the inspector and on the canvas badge (AC-019)', async () => {
    toolbarButton('mobile').click();
    await render();
    builder().store.select('a');
    builder().store.inspectorTab.set('layout');
    await render();

    const inspector: InspectorComponent = fixture.debugElement.query(By.directive(InspectorComponent)).componentInstance;
    const fallback = builder().store.t('core.component.form-builder.span.default');
    expect(inspector.spanSource()).toBe('default');
    expect(inspector.inheritedLabel()).toBe(fallback);
    expect(root().querySelector('[data-fb-item="a"] .fb-span-badge')!.textContent).toContain(`12/12 · ${fallback}`);
    expect(host.emitted.length).withContext('switching the level never emits').toBe(0);
  });

  it('keeps an element of an unknown type as-is and shows it as unsupported', async () => {
    const future = {
      pages: [
        {
          id: 'page',
          elements: [
            { id: 'h', type: 'heading', label: 'Title', text: 'Hello', layout: { span: { desktop: 6 } } },
            { id: 'x', key: 'x', type: 'textfield', label: 'X' },
          ],
        },
      ],
    } as unknown as SdFormGenericSchema;
    host.form.set(future);
    await render();
    const cell = root().querySelector<HTMLElement>('[data-fb-item="h"]')!;
    expect(cell.classList).toContain('is-unknown');
    expect(cell.querySelector('.fb-resize')).withContext('no resize for unknown content').toBeNull();
    builder().store.select('h');
    await render();
    expect(root().querySelector('fb-inspector .ins-tabs')).withContext('no editable tabs').toBeNull();

    // Sửa phần tử khác vẫn giữ nguyên phần tử lạ khi phát lại.
    builder().store.update('x', item => ({ ...item, label: 'X2' }) as never);
    await render();
    expect(find(host.emitted[0], 'h')).toEqual({
      id: 'h',
      type: 'heading',
      label: 'Title',
      text: 'Hello',
      layout: { span: { desktop: 6 } },
    });
  });

  it('asks before deleting a group that still has fields, and keeps it when the user declines', async () => {
    confirm.and.returnValue(Promise.reject(new Error('cancel')));
    await builder().remove('g1');
    await render();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(find(current(), 'g1')).toBeDefined();

    confirm.and.returnValue(Promise.resolve());
    await builder().remove('g1');
    await render();
    expect(find(current(), 'g1')).toBeUndefined();
    expect(find(current(), 'a')).withContext('children go with the group').toBeUndefined();
  });

  it('drags a palette preset into a group with real pointer events and commits exactly once on release', async () => {
    const palette = root().querySelector<HTMLElement>('fb-palette [data-palette-id="integer"]')!;
    const body = root().querySelector<HTMLElement>('[data-fb-group-body="g1"]')!;
    const start = center(palette);
    const bodyRect = body.getBoundingClientRect();
    const target = { x: bodyRect.left + bodyRect.width / 2, y: bodyRect.bottom - 6 };

    pointer('pointerdown', palette, start.x, start.y);
    pointer('pointermove', document, start.x + 10, start.y + 4);
    pointer('pointermove', document, target.x, target.y);
    await render();

    expect(builder().store.drag()?.intent).toEqual({ kind: 'row', parentId: 'g1', beforeRowKey: null });
    expect(root().querySelector('.fb-indicator')).withContext('indicator follows the planned intent').not.toBeNull();
    expect(host.emitted.length).withContext('no schema change while dragging').toBe(0);
    expect(current()).toEqual(seed());

    pointer('pointerup', document, target.x, target.y);
    await render();

    expect(host.emitted.length).toBe(1);
    const group = find(current(), 'g1')!;
    expect(group['elements'].length).toBe(3);
    expect(group['elements'][2]).toEqual(jasmine.objectContaining({ type: 'number', subtype: 'integer' }));
    expect(builder().store.drag()).toBeNull();
    expect(document.querySelector('.sd-form-builder-ghost')).toBeNull();
  });

  it('moves a field out of its group to the root and cancels a drag with Escape', async () => {
    const card = root().querySelector<HTMLElement>('[data-fb-item="b"] [data-fb-card]')!;
    const note = root().querySelector<HTMLElement>('[data-fb-item="c"]')!;
    const start = center(card);
    const noteRect = note.getBoundingClientRect();

    // Escape giữa chừng: không đổi gì, không còn ghost.
    pointer('pointerdown', card, start.x, start.y);
    pointer('pointermove', document, start.x + 12, start.y + 12);
    pointer('pointermove', document, noteRect.left + 20, noteRect.top + 4);
    await render();
    expect(builder().store.drag()).not.toBeNull();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    pointer('pointerup', document, noteRect.left + 20, noteRect.top + 4);
    await render();
    expect(builder().store.drag()).toBeNull();
    expect(host.emitted.length).toBe(0);
    expect(document.querySelector('.sd-form-builder-ghost')).toBeNull();

    // Kéo thật: lên mép trên của hàng "Note" ở trang → hàng mới trước Note.
    pointer('pointerdown', card, start.x, start.y);
    pointer('pointermove', document, start.x + 12, start.y + 12);
    pointer('pointermove', document, noteRect.left + 20, noteRect.top + 4);
    pointer('pointerup', document, noteRect.left + 20, noteRect.top + 4);
    await render();

    const schema = current();
    expect(ids(elementsOf(schema))).toEqual(['g1', 'b', 'c']);
    expect(ids(find(schema, 'g1')!['elements'])).toEqual(['a']);
    expect(find(schema, 'b')).toEqual(find(seed(), 'b') as AnyItem);
    expect(host.emitted.length).toBe(1);
  });

  it('does not add a field when a palette drag is cancelled with Escape and released on the same item', async () => {
    const palette = root().querySelector<HTMLElement>('fb-palette [data-palette-id="email"]')!;
    const start = center(palette);
    const canvas = root().querySelector<HTMLElement>('.fb-canvas')!.getBoundingClientRect();

    pointer('pointerdown', palette, start.x, start.y);
    pointer('pointermove', document, start.x + 10, start.y + 6);
    pointer('pointermove', document, canvas.left + 80, canvas.top + 80);
    pointer('pointermove', document, start.x, start.y);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    pointer('pointerup', palette, start.x, start.y);
    // Trình duyệt phát click sau pointerup trên cùng phần tử.
    palette.click();
    await render();

    expect(host.emitted.length).toBe(0);
    expect(current()).toEqual(seed());
    // Lần bấm sau đó vẫn thêm field như bình thường.
    await new Promise(resolve => setTimeout(resolve));
    palette.click();
    await render();
    expect(host.emitted.length).toBe(1);
  });

  it('resizes on the 12-column grid with a single commit on release (no mutation while dragging)', async () => {
    const cell = root().querySelector<HTMLElement>('[data-fb-item="a"]')!;
    const handle = cell.querySelector<HTMLElement>('.fb-resize')!;
    const row = cell.parentElement!;
    const column = row.clientWidth / 12;
    const start = center(handle);

    pointer('pointerdown', handle, start.x, start.y);
    pointer('pointermove', document, start.x - column * 1.1, start.y);
    pointer('pointermove', document, start.x - column * 2, start.y);
    await render();
    expect(builder().store.resize()).toEqual(jasmine.objectContaining({ id: 'a', span: 4, mode: 'desktop' }));
    expect(find(current(), 'a')!['layout']).toEqual({ span: { desktop: 6 } });

    pointer('pointerup', document, start.x - column * 2, start.y);
    await render();
    expect(find(current(), 'a')!['layout']).toEqual({ span: { desktop: 4 } });
    expect(find(current(), 'b')!['layout'])
      .withContext('siblings never shrink silently')
      .toEqual({ span: { desktop: 6 } });
    expect(host.emitted.length).toBe(1);
  });

  describe('inspector feedback round', () => {
    const inspector = (): InspectorComponent => fixture.debugElement.query(By.directive(InspectorComponent)).componentInstance;
    const select = async (id: string, tab: 'general' | 'data' | 'rules' | 'layout') => {
      builder().store.select(id);
      builder().store.inspectorTab.set(tab);
      await render();
    };
    const notify = () => TestBed.inject(SdNotifyService);

    it('names a new field <preset>_<hash> instead of a counter', async () => {
      root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="email"]')!.click();
      await render();
      root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="email"]')!.click();
      await render();
      const added = elementsOf(current())
        .slice(-2)
        .map(item => item['key']);
      expect(added[0]).toMatch(/^email_[a-z0-9]{6}$/);
      expect(added[1]).toMatch(/^email_[a-z0-9]{6}$/);
      expect(added[0]).not.toBe(added[1]);
    });

    it('offers a 5 s undo toast after a delete; Undo restores exactly that delete', async () => {
      await builder().remove('c');
      await render();
      expect(find(current(), 'c')).toBeUndefined();
      const [toast] = notify().toasts();
      expect(toast).withContext('toast shown').toBeDefined();
      expect(toast.type).toBe('success');
      expect(toast.duration).toBe(5000);
      expect(toast.actionLabel).toBeTruthy();

      toast.onAction!();
      await render();
      expect(current()).toEqual(seed());
      expect(builder().store.selectedId()).withContext('restored item is selected again').toBe('c');
      expect(notify().toasts().length).withContext('toast closes after undo').toBe(0);
    });

    it('drops the undo toast as soon as another change happens, so a late click cannot undo the wrong step', async () => {
      await builder().remove('c');
      await render();
      const [toast] = notify().toasts();
      root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="text"]')!.click();
      await render();
      expect(notify().toasts().length).toBe(0);
      toast.onAction!();
      await render();
      expect(find(current(), 'c')).withContext('stale undo is ignored').toBeUndefined();
      expect(elementsOf(current()).length).toBe(2);
    });

    it('renames a key only after Yes, with a message that explains the consequences, then confirms with sd-inform', async () => {
      await select('a', 'data');
      const panel = inspector();
      expect(root().querySelector('fb-inspector .ins-key mat-hint')).withContext('no permanent hint').toBeNull();

      confirm.and.returnValue(Promise.reject('CANCEL'));
      panel.keyDraft.set('contactEmail');
      await panel.applyKey();
      await render();
      expect(find(current(), 'a')!['key']).withContext('No keeps the key').toBe('email');

      confirm.calls.reset();
      confirm.and.returnValue(Promise.resolve());
      await panel.applyKey();
      await render();
      expect(confirm).toHaveBeenCalledTimes(1);
      const [message, options] = confirm.calls.mostRecent().args;
      expect(message).toContain('<code>email</code>');
      expect(message).toContain('<code>contactEmail</code>');
      expect(message.match(/<p>/g)?.length).withContext('rename + references + saved data lines').toBe(3);
      expect(options.yesTitle).toBeTruthy();
      expect(options.noTitle).toBeTruthy();

      const schema = current();
      expect(find(schema, 'a')!['key']).toBe('contactEmail');
      expect(find(schema, 'c')!['rules']['visible']['field']).withContext('the Filter rule follows the rename').toBe('contactEmail');
      const inform = root().querySelector('fb-inspector sd-inform');
      expect(inform).withContext('success shown with sd-inform').not.toBeNull();
      expect(inform!.textContent).toContain('contactEmail');
    });

    it('uses compact controls: hideInlineError everywhere, small settings-row switches', async () => {
      await select('b', 'rules');
      const controls = Array.from(root().querySelectorAll('fb-inspector .ins-body mat-form-field'));
      expect(controls.length).toBeGreaterThan(0);
      expect(controls.every(control => control.classList.contains('hide-inline-error'))).toBeTrue();
      const rows = Array.from(root().querySelectorAll<HTMLElement>('fb-inspector fb-toggle-row'));
      expect(rows.length).toBeGreaterThan(0);
      expect(root().querySelectorAll('fb-inspector sd-switch').length).withContext('every switch sits in a row').toBe(rows.length);
      for (const row of rows) {
        const text = row.querySelector<HTMLElement>('.toggle-row__label')!;
        const toggle = row.querySelector<HTMLElement>('sd-switch')!;
        expect(toggle.getAttribute('data-size')).toBe('sm');
        expect(text.getBoundingClientRect().left).withContext('label left').toBeLessThan(toggle.getBoundingClientRect().left);
        expect(Math.round(toggle.getBoundingClientRect().right))
          .withContext('switch on the right edge')
          .toBe(Math.round(row.getBoundingClientRect().right));
        const button = toggle.querySelector<HTMLElement>('button[role="switch"]')!;
        const name = document.getElementById(button.getAttribute('aria-labelledby')!)?.textContent?.trim();
        expect(name).withContext('the switch keeps its accessible name').toBe(text.textContent!.trim());
      }
    });

    it('puts State before Conditions and explains Read only in an info tooltip instead of the label', async () => {
      for (const id of ['c', 'g1']) {
        await select(id, 'rules');
        const titles = Array.from(root().querySelectorAll('fb-inspector .ins-section__title')).map(title => title.textContent!.trim());
        const state = builder().store.t('core.component.form-builder.state');
        const conditions = builder().store.t('core.component.form-builder.conditions');
        expect(titles.indexOf(state)).withContext(id).toBeGreaterThanOrEqual(0);
        expect(titles.indexOf(state)).withContext(id).toBeLessThan(titles.indexOf(conditions));
      }

      await select('c', 'rules');
      const rows = Array.from(root().querySelectorAll<HTMLElement>('fb-inspector fb-toggle-row'));
      const readOnly = rows.find(row => row.querySelector('.toggle-row__hint'))!;
      expect(readOnly).withContext('Read only row has an info icon').toBeDefined();
      expect(readOnly.querySelector('.toggle-row__label')!.textContent!.trim()).toBe(
        builder().store.t('core.component.form-builder.read-only-mode')
      );
      expect(readOnly.querySelector('.toggle-row__label')!.textContent).not.toContain('(');
      const hint = readOnly.querySelector<HTMLButtonElement>('.toggle-row__hint')!;
      expect(hint.tagName).withContext('keyboard reachable').toBe('BUTTON');
      expect(hint.getAttribute('aria-label')).toBe(builder().store.t('core.component.form-builder.read-only-mode.hint'));
      expect(rows.filter(row => row.querySelector('.toggle-row__hint')).length)
        .withContext('only rows with a hint get the icon')
        .toBe(1);
    });

    it('applies the group accent colour on the canvas and offers a wider icon set', async () => {
      await select('g1', 'general');
      const icon = () => root().querySelector<HTMLElement>('[data-fb-item="g1"] .fb-group__icon')!;
      expect(icon().getAttribute('data-color')).toBe('primary');

      root().querySelector<HTMLButtonElement>('fb-inspector .ins-colors__swatch[data-color="success"]')!.click();
      await render();
      expect(find(current(), 'g1')!['color']).toBe('success');
      expect(icon().getAttribute('data-color')).withContext('canvas follows the accent').toBe('success');

      const icons = root().querySelectorAll('fb-inspector .ins-icons__btn');
      expect(icons.length).toBeGreaterThanOrEqual(30);
      (icons[icons.length - 1] as HTMLButtonElement).click();
      await render();
      expect(find(current(), 'g1')!['icon']).toBe('verified_user');
    });

    it('toggles from the visible label text as well as from the switch', async () => {
      await select('c', 'general');
      const row = root().querySelector<HTMLElement>('fb-inspector fb-toggle-row')!;
      row.querySelector<HTMLElement>('.toggle-row__label')!.click();
      await render();
      expect(find(current(), 'c')!['validation']).toEqual({ required: true });
      row.querySelector<HTMLElement>('button[role="switch"]')!.click();
      await render();
      expect(find(current(), 'c')!['validation']).withContext('turning required off leaves no empty validation').toBeUndefined();
    });

    it('shows conditions as a grey read-only view with an edit button', async () => {
      await select('c', 'rules');
      const boxes = Array.from(root().querySelectorAll<HTMLElement>('fb-inspector attribute-expression fb-value-box'));
      expect(boxes.length).toBeGreaterThanOrEqual(2);
      const visible = boxes[0];
      expect(visible.querySelector('.expr__tok--field')?.textContent).toBe('Email');
      expect(visible.querySelector('.expr__tok--op')?.textContent).toBeTruthy();
      expect(visible.querySelector('.vb__edit')).withContext('editable → edit button').not.toBeNull();
      expect(boxes[1].querySelector('.vb')!.classList).toContain('is-empty');
    });

    it('switches select options between a static list and a portal catalog', async () => {
      root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="select"]')!.click();
      await render();
      const id = builder().store.selectedId()!;
      await select(id, 'data');
      const panel = inspector();
      expect(panel.optionSource()).toBe('__static__');
      expect(root().querySelector('fb-inspector fb-options-editor')).not.toBeNull();

      panel.setOptionSource('provinces');
      await render();
      expect(find(current(), id)!['options']).toEqual({ source: 'catalog', catalog: 'provinces' });
      expect(root().querySelector('fb-inspector fb-options-editor')).toBeNull();
      expect(root().querySelector('fb-inspector build-queries')).withContext('catalog params editor').not.toBeNull();
      expect(root().querySelector('fb-inspector build-variables')).withContext('catalog fill editor').not.toBeNull();

      panel.setCatalogParams([{ name: 'regionId', value: { field: 'email' } }]);
      panel.setCatalogFill([{ field: 'note', from: 'name' }]);
      await render();
      expect(find(current(), id)!['options']).toEqual({
        source: 'catalog',
        catalog: 'provinces',
        params: [{ name: 'regionId', value: { field: 'email' } }],
        fill: [{ field: 'note', from: 'name' }],
      });

      panel.setOptionSource('__static__');
      await render();
      expect(find(current(), id)!['options']).toEqual({ source: 'static', items: [] });
    });

    it('stores field rules as Filter and drops an empty condition group', async () => {
      await select('b', 'rules');
      const panel = inspector();
      panel.setRule('disabled', { field: 'userId', operator: 'EQUAL', data: 'x' });
      await render();
      expect(find(current(), 'b')!['rules']).toEqual({ disabled: { field: 'userId', operator: 'EQUAL', data: 'x' } });
      panel.setRule('disabled', { operator: 'AND', data: [] });
      await render();
      expect(find(current(), 'b')!['rules']).toBeUndefined();
    });

    it('lays out the position controls without horizontal scroll and moves a field between containers', async () => {
      await select('c', 'layout');
      const body = root().querySelector<HTMLElement>('fb-inspector .ins-body')!;
      const edge = body.getBoundingClientRect().right;
      const wide = Array.from(body.querySelectorAll<HTMLElement>('*'))
        .filter(element => element.getBoundingClientRect().right > edge + 1)
        .map(element => `${element.tagName.toLowerCase()}.${element.className} ${Math.round(element.getBoundingClientRect().width)}`)
        .slice(0, 6);
      expect(body.scrollWidth).withContext(wide.join(' | ')).toBeLessThanOrEqual(body.clientWidth);
      inspector().moveToContainer('g1');
      await render();
      expect(ids(find(current(), 'g1')!['elements'])).toContain('c');
      inspector().moveToContainer('__none__');
      await render();
      expect(ids(elementsOf(current()))).toContain('c');

      const foot = root().querySelector<HTMLElement>('fb-inspector .ins-foot')!;
      const button = foot.querySelector<HTMLElement>('sd-button button')!;
      const footRect = foot.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      expect(buttonRect.width).toBeGreaterThan(footRect.width - 24);
      expect(Math.abs(buttonRect.left + buttonRect.width / 2 - (footRect.left + footRect.width / 2))).toBeLessThan(2);
    });
  });

  describe('edge cases found in review', () => {
    const inspector = (): InspectorComponent => fixture.debugElement.query(By.directive(InspectorComponent)).componentInstance;
    const select = async (id: string, tab: 'general' | 'data' | 'rules' | 'layout') => {
      builder().store.select(id);
      builder().store.inspectorTab.set(tab);
      await render();
    };
    const press = (target: Element, key: string, init: KeyboardEventInit = {}) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));

    it('loads a previously emitted snapshot again after another form was loaded in between', async () => {
      root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="text"]')!.click();
      await render();
      const formA = host.emitted[0];
      host.form.set({ pages: [{ id: 'other', elements: [] }] });
      await render();
      expect(elementsOf(current())).toEqual([]);
      host.form.set(formA);
      await render();
      expect(ids(elementsOf(current()))).toEqual(ids(elementsOf(formA)));
    });

    it('scrolls to a field added from the palette only once it is rendered', async () => {
      const scrolled = spyOn(HTMLElement.prototype, 'scrollIntoView');
      root().querySelector<HTMLButtonElement>('fb-palette [data-palette-id="text"]')!.click();
      // why: in the app, microtasks run BEFORE change detection renders the new card.
      await Promise.resolve();
      await render();
      const id = builder().store.selectedId();
      expect(scrolled.calls.all().some(call => (call.object as HTMLElement).getAttribute('data-fb-item') === id)).toBeTrue();
    });

    it('does not duplicate or re-row an element of an unknown type (move and delete only)', async () => {
      host.form.set({
        pages: [
          {
            id: 'page',
            elements: [
              { id: 'h', key: 'rating', type: 'rating', label: 'Rating' },
              { id: 'x', key: 'x', type: 'textfield', label: 'X' },
            ],
          },
        ],
      } as unknown as SdFormGenericSchema);
      await render();
      const toolCount = async (id: string) => {
        builder().store.select(id);
        await render();
        return root().querySelectorAll(`[data-fb-item="${id}"] .fb-tools > button.fb-tool`).length;
      };
      expect(await toolCount('x'))
        .withContext('grip, duplicate, delete')
        .toBe(3);
      expect(await toolCount('h'))
        .withContext('grip, delete')
        .toBe(2);
      press(root().querySelector('[data-fb-item="h"] [data-fb-card]')!, 'd', { ctrlKey: true });
      await render();
      expect(builder().store.duplicate('h')).toBeNull();
      expect(ids(elementsOf(current()))).toEqual(['h', 'x']);
      expect(host.emitted.length).toBe(0);
    });

    it('coalesces typing into a number property into one undo step', async () => {
      await select('b', 'rules');
      const min = fixture.debugElement.queryAll(By.css('fb-inspector sd-input-number'))[0];
      for (const value of [1, 10, 100]) {
        min.triggerEventHandler('modelChange', value);
        await render();
      }
      expect(find(current(), 'b')!['validation']).toEqual({ min: 100 });
      builder().store.undo();
      await render();
      expect(find(current(), 'b')!['validation']).toEqual({ min: 0 });
    });

    it('links the inspector tabs with their panel and moves the toolbar radios with Up/Down/Home/End', async () => {
      await select('a', 'data');
      const panel = root().querySelector<HTMLElement>('fb-inspector [role="tabpanel"]')!;
      const active = root().querySelector<HTMLElement>('fb-inspector [role="tab"][aria-selected="true"]')!;
      expect(panel.getAttribute('aria-labelledby')).toBe(active.id);
      root()
        .querySelectorAll('fb-inspector [role="tab"]')
        .forEach(tab => expect(tab.getAttribute('aria-controls')).toBe(panel.id));

      press(toolbarButton('design'), 'End');
      await render();
      expect(builder().store.mode()).toBe('schema');
      press(toolbarButton('schema'), 'ArrowUp');
      await render();
      expect(builder().store.mode()).toBe('preview');
      press(toolbarButton('preview'), 'Home');
      await render();
      expect(builder().store.mode()).toBe('design');
    });

    it('keeps an html definition this portal does not register selectable, so it can be cleared', async () => {
      host.form.set({
        pages: [{ id: 'page', elements: [{ id: 'h1', type: 'html', definition: 'elsewhere' }] }],
      } as unknown as SdFormGenericSchema);
      await render();
      await select('h1', 'data');
      expect(inspector().htmlDefinitionChoices()).toContain(jasmine.objectContaining({ value: 'elsewhere' }));
      expect(root().querySelector('fb-inspector sd-select')).not.toBeNull();
      inspector().applyHtmlDefinition(null);
      await render();
      expect(find(current(), 'h1')).toEqual({ id: 'h1', type: 'html', content: '' });
    });

    it('escapes a label inside the delete confirmation, which is rendered as HTML', async () => {
      builder().store.update('g1', item => ({ ...item, label: '<img src=x>' }) as never);
      await render();
      await builder().remove('g1');
      const message = confirm.calls.mostRecent().args[0] as string;
      expect(message).toContain('&lt;img src=x&gt;');
      expect(message).not.toContain('<img');
    });

    it('flags an invalid pattern in the inspector', async () => {
      await select('a', 'rules');
      inspector().setPattern('value', '[A-Z');
      await render();
      expect(inspector().patternError()).toBeTruthy();
      inspector().setPattern('value', '[A-Z]+');
      await render();
      expect(inspector().patternError()).toBeUndefined();
    });

    it('keeps the validation dialog open while a condition has no message', async () => {
      builder().openValidations();
      await render();
      const dialog = fixture.debugElement.query(By.directive(ConfigureValidationComponent))
        .componentInstance as ConfigureValidationComponent;
      const filter = { field: 'email', operator: 'NULL' } as const;
      dialog.add('filter');
      dialog.patch(0, { filter });
      dialog.save();
      await render();
      expect(current().validations).withContext('not saved without a message').toBeUndefined();
      dialog.patch(0, { message: 'Email is required' });
      dialog.save();
      await render();
      expect(current().validations).toEqual([{ type: 'filter', alert: 'error', message: 'Email is required', filter }]);
    });

    it('selects the parent group after deleting its selected field, and announces a palette drop as added', async () => {
      builder().store.select('a');
      builder().store.remove('a');
      expect(builder().store.selectedId()).toBe('g1');
      const drop = builder().store.drop(
        { kind: 'row', parentId: null, beforeRowKey: null },
        { kind: 'new', item: { id: 'n1', key: 'n1', type: 'textfield', label: 'New' } as never },
        'New'
      );
      expect(drop.ok).toBeTrue();
      await new Promise(resolve => setTimeout(resolve));
      expect(builder().store.announcement()).toBe(builder().store.t('core.component.form-builder.announce.added', { label: 'New' }));
    });

    it('renames a variable with its references and asks before saving without a variable that is still used', async () => {
      builder().store.update('b', item => ({ ...item, rules: { disabled: { field: 'userId', operator: 'NULL' } } }) as never);
      await render();
      builder().openVariables();
      await render();
      builder().updateVariable(0, 'key', 'accountId');
      await builder().saveVariables();
      await render();
      expect(current().variables).toEqual([{ key: 'accountId', label: 'User' }]);
      expect(find(current(), 'b')!['rules']).toEqual({ disabled: { field: 'accountId', operator: 'NULL' } });
      expect(confirm).not.toHaveBeenCalled();

      builder().openVariables();
      await render();
      builder().removeVariable(0);
      confirm.and.returnValue(Promise.reject('CANCEL'));
      await builder().saveVariables();
      await render();
      expect(current().variables)
        .withContext('No keeps the variable')
        .toEqual([{ key: 'accountId', label: 'User' }]);
      confirm.and.returnValue(Promise.resolve());
      await builder().saveVariables();
      await render();
      expect(current().variables).toBeUndefined();
      expect(confirm).toHaveBeenCalledTimes(2);
    });

    it('applies a template whose key differs through the rename confirmation, in one undo step', async () => {
      const template = {
        id: 't-mail',
        label: 'Mail',
        field: { id: 'tpl', type: 'textfield', key: 'contactEmail', label: 'Contact email' },
      };
      spyOnProperty(FormGenericService.prototype, 'templates', 'get').and.returnValue([template] as never);
      await select('a', 'data');
      await inspector().applyTemplate('t-mail');
      await render();
      expect(find(current(), 'a')).toEqual(jasmine.objectContaining({ key: 'contactEmail', label: 'Contact email' }));
      expect(find(current(), 'c')!['rules']).toEqual({ visible: { field: 'contactEmail', operator: 'NOT_NULL' } });
      builder().store.undo();
      await render();
      expect(current()).toEqual(seed());

      confirm.and.returnValue(Promise.reject('CANCEL'));
      await inspector().applyTemplate('t-mail');
      await render();
      expect(find(current(), 'a'))
        .withContext('No keeps the key')
        .toEqual(jasmine.objectContaining({ key: 'email', label: 'Contact email' }));
    });

    it('clears settings an editor stops showing: default on a catalog, pattern on a password, default shape on multiple, an ISO date limit', async () => {
      host.form.set({
        pages: [
          {
            id: 'page',
            elements: [
              {
                id: 's',
                key: 's',
                type: 'select',
                label: 'S',
                options: { source: 'static', items: [{ value: 'x', label: 'X' }] },
                defaultValue: 'x',
              },
              { id: 't', key: 't', type: 'textfield', label: 'T', validation: { pattern: { value: '[A-Z]+' } } },
              { id: 'd', key: 'd', type: 'datetime', label: 'D', validation: { min: '2024-01-01' } },
            ],
          },
        ],
      } as unknown as SdFormGenericSchema);
      await render();
      await select('s', 'data');
      inspector().setMultiple(true);
      await render();
      expect(find(current(), 's')!['defaultValue']).toEqual(['x']);
      inspector().setMultiple(false);
      await render();
      expect(find(current(), 's')!['defaultValue']).toBe('x');
      inspector().setOptionSource('cities');
      await render();
      expect('defaultValue' in find(current(), 's')!).toBeFalse();

      await select('t', 'general');
      inspector().setTextSubtype('password');
      await render();
      expect(find(current(), 't')!['validation']).toBeUndefined();

      await select('d', 'rules');
      expect(
        inspector()
          .minDateChoices()
          .map(choice => choice.value)
      ).toContain('2024-01-01');
      expect(inspector().dateLimitValue(find(current(), 'd')!['validation']['min'])).toBe('2024-01-01');
      inspector().setValidationChoice('min', '__none__');
      await render();
      expect(find(current(), 'd')!['validation']).toBeUndefined();
    });

    it('moves focus to the neighbouring card after a delete from the keyboard', async () => {
      const card = root().querySelector<HTMLElement>('[data-fb-item="c"] [data-fb-card]')!;
      card.focus();
      press(card, 'Delete');
      await render();
      expect(find(current(), 'c')).toBeUndefined();
      expect(document.activeElement).toBe(root().querySelector('[data-fb-item="g1"] [data-fb-card]'));
    });

    it('exposes the compact panels to assistive tech: expanded state, focus inside, Esc back to the toggle', async () => {
      root().querySelector<HTMLElement>('.host')!.style.width = '700px';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await render();
      expect(builder().compact()).toBeTrue();
      const toggle = root().querySelector<HTMLButtonElement>('.fb-panel-toggle[aria-controls$="-right"]')!;
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      toggle.click();
      await render();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
      expect(panel.contains(document.activeElement)).withContext('focus moved into the panel').toBeTrue();
      press(document.activeElement!, 'Escape');
      await render();
      expect(builder().rightOpen()).toBeFalse();
      expect(document.activeElement).toBe(toggle);
    });

    describe('compact panels', () => {
      const goCompact = async () => {
        root().querySelector<HTMLElement>('.host')!.style.width = '700px';
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await render();
        expect(builder().compact()).toBeTrue();
      };
      const toggle = (side: 'left' | 'right') => root().querySelector<HTMLButtonElement>(`.fb-panel-toggle[aria-controls$="-${side}"]`)!;

      it('leaves Escape to an open popup inside the panel, and to a search that still has text', async () => {
        await goCompact();
        await select('a', 'general');
        toggle('right').click();
        await render();
        const trigger = root().querySelector<HTMLElement>('fb-inspector sd-select mat-select')!;
        trigger.setAttribute('aria-expanded', 'true'); // what MatSelect sets while its dropdown is open
        press(trigger, 'Escape');
        await render();
        expect(builder().rightOpen()).withContext('the dropdown takes the Escape').toBeTrue();

        toggle('left').click();
        await render();
        const search = root().querySelector<HTMLInputElement>('fb-palette input[type="search"], fb-palette input')!;
        search.value = 'mail';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        await render();
        press(search, 'Escape');
        await render();
        expect(search.value).toBe('');
        expect(builder().leftOpen()).withContext('first Escape only clears the search').toBeTrue();
        press(search, 'Escape');
        await render();
        expect(builder().leftOpen()).toBeFalse();
      });

      it('keeps the left tab and focuses the selected inspector tab when a panel opens', async () => {
        await goCompact();
        builder().store.leftTab.set('structure');
        toggle('left').click();
        await render();
        expect(builder().store.leftTab()).toBe('structure');
        expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement?.getAttribute('role')).toBe('tab');

        await select('a', 'rules');
        toggle('right').click();
        await render();
        const active = root().querySelector('fb-inspector [role="tab"][aria-selected="true"]');
        expect(document.activeElement).toBe(active);
      });

      it('closes the panel before moving focus to the canvas after a delete from the inspector', async () => {
        await goCompact();
        await select('c', 'general');
        toggle('right').click();
        await render();
        inspector().remove();
        await render();
        expect(find(current(), 'c')).toBeUndefined();
        expect(builder().rightOpen()).toBeFalse();
        expect(document.activeElement).toBe(root().querySelector('[data-fb-item="g1"] [data-fb-card]'));
      });
    });

    it('does not duplicate a group that holds an element of an unknown type', async () => {
      host.form.set({
        pages: [{ id: 'page', elements: [{ id: 'g', type: 'group', label: 'G', elements: [{ id: 'h', key: 'rating', type: 'rating' }] }] }],
      } as unknown as SdFormGenericSchema);
      await render();
      expect(builder().store.duplicate('g')).toBeNull();
      expect(host.emitted.length).toBe(0);
    });

    it('labels an ISO date limit with its own day, whatever the time zone', async () => {
      host.form.set({
        pages: [{ id: 'page', elements: [{ id: 'd', key: 'd', type: 'datetime', label: 'D', validation: { max: '2024-01-01' } }] }],
      } as unknown as SdFormGenericSchema);
      await render();
      await select('d', 'rules');
      expect(
        inspector()
          .maxDateChoices()
          .find(choice => choice.value === '2024-01-01')?.display
      ).toBe('01/01/2024');
    });

    it('reports invalid fields next to form messages in Preview and drops a result once the test data changes', async () => {
      builder().store.setValidations([
        { type: 'filter', filter: { field: 'note', operator: 'NULL' }, message: 'Note missing', alert: 'error' },
      ]);
      await render();
      toolbarButton('preview').click();
      await render();
      const preview = fixture.debugElement.query(By.directive(PreviewComponent)).componentInstance as PreviewComponent;
      await preview.validate();
      await render();
      expect(preview.result()).toEqual({ invalidFields: true, errors: ['Note missing'], warnings: [] });
      const live = root().querySelector('fb-preview [role="status"]')!;
      expect(live.textContent).toContain('Note missing');
      preview.value.set({ email: 'lan@example.com' });
      await render();
      expect(preview.result()).toBeNull();
      expect(root().querySelector('fb-preview [role="status"]')).withContext('the live region stays').toBe(live);
    });

    it('refuses a reserved JavaScript name as a key', async () => {
      await select('a', 'data');
      inspector().keyDraft.set('constructor');
      expect(inspector().keyError()).toBe(builder().store.t('core.component.form-builder.key.reserved'));
    });

    it('refuses a rename onto a key used on another page, and does not commit variables or validations that did not change', async () => {
      host.form.set({
        pages: [
          { id: 'p1', elements: [{ id: 'a', key: 'a', type: 'textfield', label: 'A' }] },
          { id: 'p2', elements: [{ id: 'b', key: 'taken', type: 'textfield', label: 'B' }] },
        ],
        variables: [{ key: 'v', label: 'V' }],
      } as unknown as SdFormGenericSchema);
      await render();
      const store = builder().store;
      expect(store.renameKey('a', 'taken')).toBe(-1);
      expect(store.canUndo()).toBeFalse();
      expect(store.setVariables([{ key: 'v', label: 'V' }])).toBeFalse();
      expect(store.setValidations([])).toBeFalse();
      expect(host.emitted.length).toBe(0);
    });
  });
});
