import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ProductService } from '../../../product/services/product.service';
import type { OrderLineDto } from '../../services/order.model';
import { LinesFormComponent } from './lines-form.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [LinesFormComponent],
  template: '<lines-form [form]="form" [seed]="seed()" />',
})
class LinesHost {
  readonly form = new FormGroup({});
  readonly seed = signal<readonly OrderLineDto[]>([{ productId: '1', quantity: 2, unitPrice: 100 }]);
}

const product = (id: string) => ({ id, code: `SP-00${id}`, name: `Sản phẩm ${id}`, unit: 'Cái', price: 100, status: 'active' });

describe('LinesFormComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LinesHost, NoopAnimationsModule],
      providers: [
        {
          provide: ProductService,
          useValue: { cachedDetail: (id: string) => of(product(id)), list: () => of({ items: [], total: 0 }) },
        },
      ],
    });
  });

  const render = async () => {
    const fixture = TestBed.createComponent(LinesHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };
  const lines = (form: FormGroup) => (form.get('lines') as FormArray).getRawValue() as Record<string, unknown>[];

  it('puts the lines of the seed into the form, one row each', async () => {
    const fixture = await render();
    expect(lines(fixture.componentInstance.form)).toEqual([jasmine.objectContaining({ productId: '1', quantity: 2, unitPrice: 100 })]);
    expect(fixture.nativeElement.querySelectorAll('[data-line]').length).toBe(1);
  });

  // why: the update page is reused when only `:id` changes; the rows must follow the new order.
  it('replaces the rows when another order comes in', async () => {
    const fixture = await render();
    const host = fixture.componentInstance;
    host.seed.set([
      { productId: '2', quantity: 5, unitPrice: 200 },
      { productId: '3', quantity: 1, unitPrice: 300 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.form.get('lines')).toBeInstanceOf(FormArray);
    expect(lines(host.form)).toEqual([
      jasmine.objectContaining({ productId: '2', quantity: 5, unitPrice: 200 }),
      jasmine.objectContaining({ productId: '3', quantity: 1, unitPrice: 300 }),
    ]);
    expect(fixture.nativeElement.querySelectorAll('[data-line]').length).toBe(2);
  });

  it('starts with one empty row when the seed has none', async () => {
    TestBed.overrideTemplate(LinesHost, '<lines-form [form]="form" [seed]="[]" />');
    const fixture = await render();
    expect(lines(fixture.componentInstance.form).length).toBe(1);
  });
});
