import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NEVER, finalize, of, throwError } from 'rxjs';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { CustomerService } from '../../services/customer.service';
import { CustomerRelationComponent } from './customer-relation.component';

describe('CustomerRelationComponent', () => {
  it('cancels the previous record, keeps error details private and retries the current record', async () => {
    let started!: () => void;
    const firstRequest = new Promise<void>(resolve => {
      started = resolve;
    });
    const cancelled = jasmine.createSpy('cancelled');
    let recovered = false;
    const orders = jasmine.createSpy('orders').and.callFake((id: string) => {
      if (id === 'previous') {
        started();
        return NEVER.pipe(finalize(cancelled));
      }
      return recovered ? of({ items: [], total: 0 }) : throwError(() => new Error('SECRET'));
    });
    TestBed.configureTestingModule({
      imports: [CustomerRelationComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CustomerService, useValue: { orders } },
        { provide: SdPermissionService, useValue: { hasPermission: () => true } },
      ],
    });
    const fixture = TestBed.createComponent(CustomerRelationComponent);
    fixture.componentRef.setInput('kind', 'orders');
    fixture.componentRef.setInput('customerId', 'previous');
    fixture.detectChanges();
    await firstRequest;
    fixture.componentRef.setInput('customerId', 'current');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain('Không tải được');
    expect(element.textContent).not.toContain('SECRET');
    recovered = true;
    (element.querySelector('sd-data-state button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(orders.calls.allArgs().map(args => args[0])).toEqual(['previous', 'current', 'current']);
    expect(element.textContent).toContain('Khách hàng chưa có đơn hàng.');
  });
});
