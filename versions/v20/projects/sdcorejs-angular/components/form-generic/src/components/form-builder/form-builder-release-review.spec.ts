import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdConfirmService, SdNotifyOption, SdNotifyService, SdToastData } from '@sdcorejs/angular/services';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { SdFormBuilder } from './form-builder.component';

class ReviewNotify {
  readonly toasts = signal<SdToastData[]>([]);
  success(message: string, option: SdNotifyOption = {}): void {
    this.toasts.set([{ id: 'review-delete', type: 'success', message, duration: 5000, ...option }]);
  }
  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }
}

describe('Form Builder release review regressions', () => {
  let fixture: ComponentFixture<SdFormBuilder>;
  let builder: SdFormBuilder;
  let notify: ReviewNotify;
  const schema = (): SdFormGenericSchema => ({
    pages: [
      { id: 'first', elements: [{ id: 'a', key: 'a', type: 'textfield', label: 'A' }] },
      { id: 'second', elements: [{ id: 'b', key: 'b', type: 'textfield', label: 'B' }] },
    ],
    variables: [{ key: 'shared', label: 'Shared' }],
    validations: [{ type: 'filter', filter: { field: 'b', operator: 'NULL' }, message: 'B is required', alert: 'error' }],
  });
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SdFormBuilder],
      providers: [
        provideNoopAnimations(),
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
        { provide: SdNotifyService, useClass: ReviewNotify },
      ],
    });
    fixture = TestBed.createComponent(SdFormBuilder);
    builder = fixture.componentInstance;
    notify = TestBed.inject(SdNotifyService) as unknown as ReviewNotify;
    const root = fixture.nativeElement as HTMLElement;
    root.style.cssText = 'display:block;width:1280px;height:760px';
    document.body.appendChild(root);
    fixture.componentRef.setInput('schema', schema());
    await settle();
  });
  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('offers fields from every page to global validation while retaining global variables and rules', async () => {
    for (const pageId of ['first', 'second']) {
      builder.store.selectPage(pageId);
      await settle();
      builder.openValidations();
      const dialog = builder.validationDialog()!;
      expect(dialog.elements().map(element => element.id)).toEqual(['a', 'b']);
      expect(dialog.variables()).toEqual(schema().variables!);
      expect(dialog.validations()).toEqual(schema().validations!);
      dialog.modal()?.close();
      await settle();
    }
    expect(builder.getSchema().validations).toEqual(schema().validations);
  });

  it('dismisses a delete Undo toast when the active page changes and never undoes a different page', async () => {
    await builder.remove('a');
    await settle();
    const toast = notify.toasts()[0];
    expect(toast.onAction).toBeDefined();
    builder.store.selectPage('second');
    await settle();
    expect(notify.toasts()).toEqual([]);
    const current = builder.getSchema();
    toast.onAction?.();
    await settle();
    expect(builder.getSchema()).toEqual(current);
    expect(builder.store.activePage().id).toBe('second');
    // Toolbar Undo still belongs to the original deletion and retains the user's active page.
    expect(builder.store.undo()).toBeTrue();
    expect(builder.getSchema().pages[0].elements.map(element => element.id)).toEqual(['a']);
    expect(builder.store.activePage().id).toBe('second');
  });

  for (const [index, property, first, second] of [
    [0, 'label', 'First edit', 'Second edit'],
    [1, 'icon', 'person', 'folder'],
  ] as const) {
    it(`seals page ${property} history on the inner Core input blur`, async () => {
      const input = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('fb-inspector .ins-empty sd-input input')[
        index
      ];
      expect(input).toBeDefined();
      input.value = first;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      input.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
      input.value = second;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      expect(builder.store.activePage()[property]).toBe(second);
      expect(builder.store.undo()).toBeTrue();
      expect(builder.store.activePage()[property]).toBe(first);
    });
  }
});
