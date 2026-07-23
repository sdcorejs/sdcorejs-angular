import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { SdBreadcrumb, SdBreadcrumbItem } from './breadcrumb.component';

class RouterStub {
  readonly events = new Subject<unknown>();
  routerState = { snapshot: { root: routeSnapshot() } };
  readonly navigate = jasmine.createSpy('navigate').and.resolveTo(true);
  readonly navigateByUrl = jasmine.createSpy('navigateByUrl').and.resolveTo(true);
}

function routeSnapshot(
  data: Record<string, unknown> = {},
  url: string[] = [],
  firstChild: ActivatedRouteSnapshot | null = null
): ActivatedRouteSnapshot {
  return {
    data,
    url: url.map(path => ({ path })),
    outlet: PRIMARY_OUTLET,
    firstChild,
  } as unknown as ActivatedRouteSnapshot;
}

describe('SdBreadcrumb static items', () => {
  let fixture: ComponentFixture<SdBreadcrumb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdBreadcrumb] }).compileComponents();
    fixture = TestBed.createComponent(SdBreadcrumb);
  });

  it('renders semantic navigation, icons, disabled items and the current page', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Home', icon: 'home', url: '/' },
      { label: 'Orders', disabled: true, clickable: true },
      { label: 'Detail' },
    ] satisfies SdBreadcrumbItem[]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(element.querySelectorAll('.sd-breadcrumb__icon')).toHaveSize(1);
    expect(element.querySelector('.sd-breadcrumb__item--disabled button')).toBeNull();
    expect(element.querySelector('[aria-current="page"]')?.textContent).toContain('Detail');
  });

  it('resolves observable labels reactively and unsubscribes when destroyed', () => {
    const label = new BehaviorSubject('Loading label');
    fixture.componentRef.setInput('items', [{ label }, { label: of('Current') }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading label');

    label.next('Resolved label');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resolved label');

    fixture.destroy();
    expect(label.observed).toBeFalse();
  });

  it('collapses long trails while preserving the root and current context', () => {
    fixture.componentRef.setInput(
      'items',
      ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map(label => ({ label }))
    );
    fixture.componentRef.setInput('maxItems', 4);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('One');
    expect(text).not.toContain('Two');
    expect(text).toContain('Five');
    expect(text).toContain('Six');
    expect(fixture.nativeElement.querySelector('[aria-hidden="true"].sd-breadcrumb__ellipsis')).not.toBeNull();
  });

  it('emits activation from a native button for actionable non-route items', () => {
    const activated: SdBreadcrumbItem[] = [];
    fixture.componentRef.setInput('items', [{ label: 'Home', clickable: true }, { label: 'Current' }]);
    fixture.componentInstance.sdItemActivate.subscribe(item => activated.push(item));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.tabIndex).toBe(0);
    button.click();
    expect(activated.map(item => item.label)).toEqual(['Home']);
  });
});

@Component({
  standalone: true,
  imports: [SdBreadcrumb],
  template: `
    <sd-breadcrumb [items]="items">
      <ng-template let-item
        ><strong class="custom-crumb">{{ item.label }}</strong></ng-template
      >
    </sd-breadcrumb>
  `,
})
class BreadcrumbTemplateHost {
  readonly items: SdBreadcrumbItem[] = [{ label: 'Custom' }];
}

describe('SdBreadcrumb custom template', () => {
  it('renders the projected item template with item context', async () => {
    await TestBed.configureTestingModule({ imports: [BreadcrumbTemplateHost] }).compileComponents();
    const fixture = TestBed.createComponent(BreadcrumbTemplateHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.custom-crumb')?.textContent).toContain('Custom');
  });
});

describe('SdBreadcrumb router generation', () => {
  let router: RouterStub;
  let fixture: ComponentFixture<SdBreadcrumb>;

  beforeEach(async () => {
    router = new RouterStub();
    await TestBed.configureTestingModule({
      imports: [SdBreadcrumb],
      providers: [{ provide: Router, useValue: router }],
    }).compileComponents();
    fixture = TestBed.createComponent(SdBreadcrumb);
  });

  it('builds route items and resolves async route labels after navigation', () => {
    const child = routeSnapshot({ breadcrumb: () => Promise.resolve('Order 42') }, ['42']);
    const parent = routeSnapshot({ breadcrumb: { label: 'Orders', icon: 'receipt' } }, ['orders'], child);
    router.routerState.snapshot.root = routeSnapshot({}, [], parent);

    fixture.detectChanges();
    router.events.next(new NavigationEnd(1, '/orders/42', '/orders/42'));
    fixture.detectChanges();

    return fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Orders');
      expect(fixture.nativeElement.textContent).toContain('Order 42');
      const links = fixture.nativeElement.querySelectorAll('a');
      expect(links[0]?.getAttribute('href')).toBe('/orders');
    });
  });

  it('cleans up its navigation subscription on destroy', () => {
    fixture.detectChanges();
    expect(router.events.observers.length).toBe(1);

    fixture.destroy();

    expect(router.events.observers.length).toBe(0);
  });

  it('does not restart manual async labels when router navigation completes', () => {
    let subscriptions = 0;
    const label = new Observable<string>(subscriber => {
      subscriptions += 1;
      subscriber.next('Manual label');
    });
    fixture.componentRef.setInput('items', [{ label }, { label: 'Current' }]);
    fixture.detectChanges();
    expect(subscriptions).toBe(1);

    router.events.next(new NavigationEnd(1, '/elsewhere', '/elsewhere'));
    fixture.detectChanges();

    expect(subscriptions).toBe(1);
  });

  it('renders router-command items as keyboard-accessible native buttons', () => {
    fixture.componentRef.setInput('items', [{ label: 'Orders', url: ['/orders'] }, { label: 'Current' }]);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.tabIndex).toBe(0);

    button.click();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/orders']);
  });

  it('isolates synchronous label resolver errors from the remaining trail', () => {
    fixture.componentRef.setInput('items', [
      {
        label: () => {
          throw new Error('label failed');
        },
      },
      { label: 'Current' },
    ]);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain('Current');
  });
});
