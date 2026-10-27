import { inject, Pipe, type PipeTransform } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import type { CustomerDto } from '../services/customer.model';

/**
 * Relation khách hàng theo ID: `@let customer = order.customerId | customerDetail | async;`.
 * CustomerService cache và chia sẻ request theo ID; nơi dùng pipe phải có CustomerService trong injector.
 */
@Pipe({ name: 'customerDetail', standalone: true })
export class CustomerDetailPipe implements PipeTransform {
  readonly #customerService = inject(CustomerService);

  transform(id: CustomerDto['id'] | null | undefined): Observable<CustomerDto | null> {
    if (id === null || id === undefined || id === '') return of(null);
    return this.#customerService.cachedDetail(id);
  }
}
