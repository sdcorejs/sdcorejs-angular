import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SdLayoutMenu, SdLayoutRootMenu } from '../../../services';
import { SdLayoutMenuTreeComponent } from './menu-tree.component';

const dashboard: SdLayoutRootMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutRootMenu = { id: 'reports', title: 'Báo cáo bán hàng', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SdLayoutMenuTreeComponent', () => {
  let fixture: ComponentFixture<SdLayoutMenuTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdLayoutMenuTreeComponent] }).compileComponents();
    fixture = TestBed.createComponent(SdLayoutMenuTreeComponent);
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('activePath', '/reports');
    fixture.detectChanges();
  });

  it('renders hierarchical route items with active-route semantics', () => {
    const routeItems = fixture.nativeElement.querySelectorAll('[data-menu-route]');
    expect(routeItems.length).toBe(2);
    expect(fixture.nativeElement.querySelector('[data-menu-key="id:reports"]').getAttribute('aria-current')).toBe('page');
  });

  it('filters its contextual leaves without case or accent sensitivity', () => {
    fixture.componentRef.setInput('query', 'BAO CAO');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Báo cáo bán hàng');
    expect(fixture.nativeElement.textContent).not.toContain('Tổng quan');
  });

  it('emits pin changes and reflects shared pinned state', () => {
    const emitted: SdLayoutMenu[] = [];
    fixture.componentInstance.togglePinned.subscribe(menu => emitted.push(menu));
    fixture.nativeElement.querySelector('[data-pin-key="id:reports"]').click();

    expect(emitted).toEqual([reports]);
    fixture.componentRef.setInput('pinnedKeys', ['id:reports']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-pin-key="id:reports"]').getAttribute('aria-pressed')).toBe('true');
  });

  it('reveals an unpinned desktop action only after the V1-compatible hover delay', fakeAsync(() => {
    const route = fixture.nativeElement.querySelector('[data-menu-key="id:reports"]').parentElement as HTMLElement;
    const pin = route.querySelector('[data-pin-key="id:reports"]') as HTMLButtonElement;

    expect(getComputedStyle(pin).opacity).toBe('0');
    fixture.componentInstance.onPinHoverStart('id:reports');
    tick(299);
    fixture.detectChanges();
    expect(getComputedStyle(pin).opacity).toBe('0');

    tick(1);
    fixture.detectChanges();
    expect(pin.classList).toContain('sd-layout-menu-tree__pin--visible');

    fixture.componentInstance.onPinHoverEnd('id:reports');
    fixture.detectChanges();
    expect(pin.classList).not.toContain('sd-layout-menu-tree__pin--visible');
  }));

  it('keeps mobile pin actions visible and uses the compatible push_pin glyph', () => {
    fixture.componentRef.setInput('pinVisibility', 'always');
    fixture.detectChanges();

    const pin = fixture.nativeElement.querySelector('[data-pin-key="id:reports"]') as HTMLButtonElement;
    expect(getComputedStyle(pin).opacity).toBe('1');
    expect(pin.querySelector('mat-icon')?.textContent?.trim()).toBe('push_pin');
  });

  it('emits the selected route menu', () => {
    const emitted: SdLayoutRootMenu[] = [];
    fixture.componentInstance.navigate.subscribe(menu => emitted.push(menu));

    fixture.nativeElement.querySelector('[data-menu-key="id:dashboard"]').click();

    expect(emitted).toEqual([dashboard]);
  });
});
