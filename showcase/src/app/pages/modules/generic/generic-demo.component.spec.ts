import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { GENERIC_DEMO_BASE, GenericDemoComponent } from './generic-demo.component';
import { GenericDemoMockAdapter } from './generic-demo.mock-adapter';

describe('GenericDemoComponent', () => {
  const demoRoute = routes.find(route => route.path === 'demo')!;

  it('renders both demo sections with links to the live generic screens', async () => {
    TestBed.configureTestingModule({ imports: [GenericDemoComponent], providers: [provideRouter([]), provideNoopAnimations()] });
    const fixture = TestBed.createComponent(GenericDemoComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section').length).toBe(2);
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    element.querySelector<HTMLElement>('[data-generic-link="product"] button')!.click();
    expect(navigate).toHaveBeenCalledWith(`${GENERIC_DEMO_BASE}/product`);
  });

  describe('live screens (AC-022)', () => {
    // why: these tests load the lazy generic pages, form-generic and the code editor; on a cold
    // .angular cache the first one regularly needs more than Jasmine's default 5 s.
    const LAZY_SCREEN_TIMEOUT = 20_000;
    let harness: RouterTestingHarness;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [provideNoopAnimations(), provideLocationMocks(), provideRouter([demoRoute])],
      });
      harness = await RouterTestingHarness.create();
    });

    it(
      'lists products from the in-memory adapter',
      async () => {
        await harness.navigateByUrl(`${GENERIC_DEMO_BASE}/product`);
        await harness.fixture.whenStable();
        harness.fixture.detectChanges();
        const text = (harness.fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('PRD-001');
      },
      LAZY_SCREEN_TIMEOUT
    );

    it(
      'opens create and detail forms',
      async () => {
        await harness.navigateByUrl(`${GENERIC_DEMO_BASE}/product/create`);
        await harness.fixture.whenStable();
        expect((harness.fixture.nativeElement as HTMLElement).querySelector('sd-form-render')).not.toBeNull();

        await harness.navigateByUrl(`${GENERIC_DEMO_BASE}/product/1/detail`);
        await harness.fixture.whenStable();
        harness.fixture.detectChanges();
        expect((harness.fixture.nativeElement as HTMLElement).querySelector('sd-generic-form-host h1')?.textContent).toContain(
          'Product PRD-001'
        );
      },
      LAZY_SCREEN_TIMEOUT
    );
  });

  it('keeps the mock adapter self-contained', async () => {
    const adapter = TestBed.runInInjectionContext(() => new GenericDemoMockAdapter());
    const created = await adapter.create('supplier', { code: 'SUP-09', name: 'New supplier' });
    expect((await adapter.search('supplier', { term: 'new', fields: ['name'], valueField: 'id' })).map(row => row['id'])).toEqual([
      created['id'],
    ]);
    expect(adapter.display({ schema: await adapter.schema('supplier'), action: 'create' })).toBe('side-drawer');
    expect(adapter.display({ schema: await adapter.schema('product'), action: 'create' })).toBe('page');
  });
});
