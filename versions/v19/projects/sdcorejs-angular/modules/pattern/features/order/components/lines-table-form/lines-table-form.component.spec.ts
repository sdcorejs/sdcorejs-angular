import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { ProductService } from '../../../product/services/product.service';
import type { OrderLineDto } from '../../services/order.model';
import { LinesTableFormComponent } from './lines-table-form.component';

@Component({
  standalone: true,
  imports: [LinesTableFormComponent],
  template: '<lines-table-form [form]="form" [seed]="seed()" [errors]="errors()" />',
})
class LinesHost {
  readonly form: FormGroup = new FormGroup({});
  // As on the order pages: dirty while the value differs from the one the form opened with.
  readonly unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'order-lines', dirty: 'value' });
  readonly seed = signal<readonly OrderLineDto[]>([
    { productId: '1', quantity: 2, unitPrice: 100 },
    { productId: '2', quantity: 1, unitPrice: 300 },
  ]);
  readonly errors = signal<Record<string, string>>({});

  constructor() {
    inject(DestroyRef).onDestroy(() => this.unsaved.destroy());
  }
}

const product = (id: string) => ({ id, code: `SP-00${id}`, name: `Sản phẩm ${id}`, unit: 'Cái', price: 100, status: 'active' });

describe('LinesTableFormComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LinesHost, NoopAnimationsModule],
      providers: [
        {
          provide: ProductService,
          useValue: { cachedDetail: (id: string) => of(product(id)), list: () => of({ items: [], total: 0 }) },
        },
        // why: the Karma frame is narrower than the mobile breakpoint; the desktop table is what this spec checks.
        { provide: SdViewportService, useValue: { isMobile: signal(false) } },
      ],
    });
  });

  // sd-table reads its rows after a short delay and renders them; only then do the lines join the form.
  const settle = async (fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) => {
    for (let i = 0; i < 10; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };
  const render = async () => {
    const fixture = TestBed.createComponent(LinesHost);
    await settle(fixture);
    return fixture;
  };
  const lines = (form: FormGroup) => (form.get('lines') as FormArray).getRawValue() as Record<string, unknown>[];
  const rows = (host: HTMLElement) => host.querySelectorAll('sd-table tr.c-row');
  const text = (host: HTMLElement, autoId: string) => host.querySelector(`[data-autoid="${autoId}"]`)?.textContent?.trim();

  it('renders one sd-table row per line of the seed, with the line total and the order total', async () => {
    const fixture = await render();
    const host: HTMLElement = fixture.nativeElement;
    expect(lines(fixture.componentInstance.form)).toEqual([
      jasmine.objectContaining({ productId: '1', quantity: 2, unitPrice: 100 }),
      jasmine.objectContaining({ productId: '2', quantity: 1, unitPrice: 300 }),
    ]);
    expect(rows(host).length).toBe(2);
    expect(text(host, 'order-line-0-amount')).toBe('200');
    expect(text(host, 'order-total')).toBe('500');
    expect(host.querySelector('.lines-table__summary')?.textContent).toContain('2 dòng hàng');
  });

  // why: the table reloads after a row is added; the field views of the other rows must stay, with what was typed.
  it('adds an empty row and keeps the values typed in the other rows', async () => {
    const fixture = await render();
    const host: HTMLElement = fixture.nativeElement;
    const form = fixture.componentInstance.form;
    (form.get('lines') as FormArray).at(0).get('quantity')?.setValue(7);
    await settle(fixture);

    host
      .querySelector<HTMLButtonElement>(
        '[data-autoid="components-button-order-line-add"] button, [data-autoid="components-button-order-line-add"]'
      )
      ?.click();
    await settle(fixture);

    expect(rows(host).length).toBe(3);
    expect(lines(form)).toEqual([
      jasmine.objectContaining({ productId: '1', quantity: 7, unitPrice: 100 }),
      jasmine.objectContaining({ productId: '2', quantity: 1, unitPrice: 300 }),
      jasmine.objectContaining({ quantity: 1, unitPrice: 0 }),
    ]);
    expect(text(host, 'order-total')).toBe('1,000');
  });

  // why: sd-table renders its rows after its first read, so the fields of the lines join the form late.
  it('opens without unsaved changes and reports an edited line', async () => {
    const fixture = await render();
    const host = fixture.componentInstance;
    expect(host.unsaved.dirty()).toBeFalse();

    (host.form.get('lines') as FormArray).at(1).get('quantity')?.setValue(4);
    await settle(fixture);
    expect(host.unsaved.dirty()).toBeTrue();
  });

  it('starts with one empty row when the seed has none', async () => {
    TestBed.overrideTemplate(LinesHost, '<lines-table-form [form]="form" [seed]="[]" />');
    const fixture = await render();
    expect(lines(fixture.componentInstance.form).length).toBe(1);
    expect(rows(fixture.nativeElement).length).toBe(1);
  });
});
