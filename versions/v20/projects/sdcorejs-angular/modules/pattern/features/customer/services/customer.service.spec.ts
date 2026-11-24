import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject, switchMap } from 'rxjs';
import { SD_PATTERN_CONFIGURATION } from '../../../configurations/pattern.configuration';
import { patternMockApiInterceptor } from '../../../core/mock-api/mock-api.interceptor';
import { PatternMockApiState } from '../../../core/mock-api/mock-api.state';
import { CustomerService } from './customer.service';

describe('CustomerService profile reads', () => {
  let customers: CustomerService;
  let requests: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomerService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SD_PATTERN_CONFIGURATION, useValue: { apiBaseUrl: '/mock' } },
      ],
    });
    customers = TestBed.inject(CustomerService);
    requests = TestBed.inject(HttpTestingController);
  });
  afterEach(() => requests.verify());

  it('starts each relation independently and unsubscribing on a customer change cancels the pending HTTP read', () => {
    for (const relation of ['orders', 'debts', 'documents', 'activities'] as const) {
      const ids = new Subject<string>();
      const subscription = ids.pipe(switchMap(id => customers[relation](id, 5))).subscribe();
      ids.next('12');
      const previous = requests.expectOne('/mock/customers/12/' + relation + '?limit=5');
      ids.next('39');
      expect(previous.cancelled).withContext(relation).toBeTrue();
      requests.expectOne('/mock/customers/39/' + relation + '?limit=5').flush({ items: [], total: 0 });
      subscription.unsubscribe();
    }
    const summary = customers.summary('12').subscribe();
    const previous = requests.expectOne('/mock/customers/12/summary');
    summary.unsubscribe();
    expect(previous.cancelled).toBeTrue();
  });

  it('serializes table paging and filters through the standard API format', async () => {
    const filters = [{ field: 'status', operator: 'EQUAL', data: 'OVERDUE' }] as const;
    const result = firstValueFrom(customers.debts('12', { filters: [...filters], pageSize: 10, pageNumber: 1 }));
    const request = requests.expectOne(req => req.url === '/mock/customers/12/debts');
    expect(request.request.params.get('filters')).toBe(JSON.stringify(filters));
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('pageNumber')).toBe('1');
    request.flush({ items: [], total: 2 });
    expect((await result).total).toBe(2);
  });
});

describe('customer profile mock read overrides', () => {
  afterEach(() => sessionStorage.removeItem('sd-pattern.mock-api'));

  it('retries a failed card independently from other customers, summary and relations', async () => {
    sessionStorage.setItem('sd-pattern.mock-api', JSON.stringify({ reads: { 'customers/12/orders': { mode: 'error-once' } } }));
    TestBed.configureTestingModule({
      providers: [
        PatternMockApiState,
        provideHttpClient(withInterceptors([patternMockApiInterceptor])),
        { provide: SD_PATTERN_CONFIGURATION, useValue: { apiBaseUrl: '/mock', storage: 'none', latencyMs: 0 } },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const [error, other, documents, summary] = await Promise.all([
      firstValueFrom(http.get('/mock/customers/12/orders')).catch((e: HttpErrorResponse) => e.status),
      firstValueFrom(http.get<{ total: number }>('/mock/customers/39/orders')),
      firstValueFrom(http.get<{ total: number }>('/mock/customers/12/documents')),
      firstValueFrom(http.get<{ orderCount: number }>('/mock/customers/12/summary')),
    ]);
    expect(error).toBe(500);
    expect(other.total).toBe(0);
    expect(documents.total).toBe(4);
    expect(summary.orderCount).toBe(48);
    const retry = await firstValueFrom(http.get<{ total: number }>('/mock/customers/12/orders'));
    expect(retry.total).toBe(48);
  });
});
