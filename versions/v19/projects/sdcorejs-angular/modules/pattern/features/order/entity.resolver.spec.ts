import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { updatableEntityResolver } from './entity.resolver';
import { OrderService } from './services/order.service';
import type { OrderDto } from './services/order.model';

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class ListStub {}

@Component({ standalone: true, template: 'detail' })
class DetailStub {}

@Component({ standalone: true, template: 'update' })
class UpdateStub {}

const order = (id: string, status: OrderDto['status'], approval: OrderDto['approval']) =>
  ({ id, code: `ĐH-${id}`, status, approval }) as OrderDto;

describe('updatableEntityResolver', () => {
  let info: jasmine.Spy;

  beforeEach(() => {
    info = jasmine.createSpy('info');
    const orders: Record<string, OrderDto> = {
      '2400': order('2400', 'pending', 'draft'),
      '2399': order('2399', 'shipping', 'approved'),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'order',
            component: ListStub,
            children: [
              { path: ':id/detail', component: DetailStub },
              { path: ':id/update', component: UpdateStub, resolve: { entity: updatableEntityResolver } },
            ],
          },
        ]),
        { provide: OrderService, useValue: { detail: (id: string) => of(orders[id]) } },
        { provide: SdNotifyService, useValue: { info } },
      ],
    });
  });

  it('opens the form of an order that can still change', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/order/2400/update');
    expect(TestBed.inject(Router).url).toBe('/order/2400/update');
    expect(info).not.toHaveBeenCalled();
  });

  it('opens the detail instead of the form of an order that can no longer change', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/order/2399/update');
    expect(TestBed.inject(Router).url).toBe('/order/2399/detail');
    expect(info).toHaveBeenCalledOnceWith('Đơn ĐH-2399 không còn sửa được.');
  });
});
