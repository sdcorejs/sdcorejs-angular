import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../../app.routes';
import { TAB_ROUTER_DEMO_BASE, TabRouterLiveComponent } from './tab-router-live.component';

describe('TabRouterLiveComponent', () => {
  const liveRoute = routes.find(route => route.path === 'demo/tab-router')!;
  let harness: RouterTestingHarness;

  // why: outlet dựng tab bất đồng bộ (resolve injector, có thể nạp chunk lazy) sau NavigationEnd — whenStable không
  // chờ hết, nên đợi tới khi điều kiện đúng.
  const waitFor = async (condition: () => boolean) => {
    for (let i = 0; i < 150 && !condition(); i++) {
      await harness.fixture.whenStable();
      harness.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    harness.detectChanges();
  };
  const element = () => harness.routeNativeElement as HTMLElement;
  const tabNames = () => Array.from(element().querySelectorAll('.tab-router__name')).map(name => name.textContent!.trim());
  const navHidden = () => element().querySelector('.tab-router__nav')!.classList.contains('tab-router__nav--hidden');

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations(), provideLocationMocks(), provideRouter([liveRoute])],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`${TAB_ROUTER_DEMO_BASE}/overview`, TabRouterLiveComponent);
    await waitFor(() => tabNames().length === 1);
  });

  it('opens the first screen as the only tab and hides the bar', () => {
    expect(tabNames()).toEqual(['Tổng quan']);
    expect(navHidden()).toBeTrue();
  });

  it('opens five screens as five tabs with their decorated names and shows the bar', async () => {
    element().querySelector<HTMLElement>('[data-tab-live="five"] button')!.click();
    await waitFor(() => tabNames().length === 5);
    expect(tabNames()).toEqual([
      'Tổng quan',
      'Đơn hàng #DH-10234',
      'Danh sách khách hàng',
      'Hợp đồng HD-2026-118',
      'Báo cáo doanh thu quý 3 năm 2026 theo từng chi nhánh',
    ]);
    expect(navHidden()).toBeFalse();
  });

  it('goes back to one tab on reset', async () => {
    element().querySelector<HTMLElement>('[data-tab-live="five"] button')!.click();
    element().querySelector<HTMLElement>('[data-tab-live="reset"] button')!.click();
    await waitFor(() => tabNames().length === 5);
    await waitFor(() => tabNames().length === 1);
    expect(tabNames()).toEqual(['Tổng quan']);
    expect(navHidden()).toBeTrue();
  });
});
