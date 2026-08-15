import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdTabInfo, SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabRouterItemComponent } from './tab-router-item.component';

describe('SdTabRouterItemComponent close delegation', () => {
  let fixture: ComponentFixture<SdTabRouterItemComponent>;
  let component: SdTabRouterItemComponent;
  let tabRouterServiceSpy: { close: jasmine.Spy; events: BehaviorSubject<undefined>; builders: BehaviorSubject<never[]> };

  beforeEach(async () => {
    tabRouterServiceSpy = {
      close: jasmine.createSpy('close'),
      events: new BehaviorSubject(undefined),
      builders: new BehaviorSubject([]),
    };

    await TestBed.configureTestingModule({
      imports: [SdTabRouterItemComponent, NoopAnimationsModule],
      providers: [
        { provide: SdTabRouterService, useValue: tabRouterServiceSpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SdTabRouterItemComponent);
    component = fixture.componentInstance;

    component.tab = {
      key: 'test-key',
      component: class {},
      isActive: false,
      url: '/test',
      tabInfoChanges: new Subject(),
    } as SdTabRouterTab;

    fixture.detectChanges();
  });

  it('calls tabRouterService.close() with the current tab when close is clicked', () => {
    component.close(new MouseEvent('click'));

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
  });

  it('does not run tab.beforeClose because the outlet owns the guard', () => {
    const beforeCloseSpy = jasmine.createSpy('beforeClose').and.returnValue(false);
    component.tab.beforeClose = beforeCloseSpy;

    component.close(new MouseEvent('click'));

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
    expect(beforeCloseSpy).not.toHaveBeenCalled();
  });

  it('delegates middle-click close to the service without running beforeClose', () => {
    const beforeCloseSpy = jasmine.createSpy('beforeClose').and.returnValue(false);
    component.tab.beforeClose = beforeCloseSpy;

    component.onMouseup(new MouseEvent('mouseup', { button: 1 }));

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
    expect(beforeCloseSpy).not.toHaveBeenCalled();
  });

  // why: bản cũ bind `[href]="[tab.url]"` — một MẢNG vào thuộc tính DOM kiểu chuỗi, chỉ "chạy
  // được" nhờ mảng 1 phần tử tự stringify. `properties['href']` đọc thẳng giá trị đã bind (chưa
  // qua stringify) nên phân biệt được hai cách bind.
  it('binds the url string itself instead of a single-element array', () => {
    const anchorDe = fixture.debugElement.query(By.css('a'));
    const anchor = anchorDe.nativeElement as HTMLAnchorElement;

    expect(anchorDe.properties['href']).toBe('/test');
    expect(anchor.getAttribute('href')).toBe('/test');
  });

  it('keeps the href in sync when the tab url changes', () => {
    component.tab = { ...component.tab, url: '/next' };
    // the component is OnPush and `tab` is a plain @Input field, so its own view has to be
    // marked dirty (the real tab-router service does this through its `events` stream)
    fixture.debugElement.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    const anchorDe = fixture.debugElement.query(By.css('a'));
    expect(anchorDe.properties['href']).toBe('/next');
    expect((anchorDe.nativeElement as HTMLAnchorElement).getAttribute('href')).toBe('/next');
  });

  // ── A11y ────────────────────────────────────────────────────────────────
  // why: nút đóng từng mang aria-hidden="true" — vẫn tab tới được nhưng screen reader không đọc
  // được gì (nút chỉ có icon).

  it('does not hide the close button from the accessibility tree', () => {
    const close = fixture.nativeElement.querySelector('button.tab-router__close') as HTMLButtonElement;

    expect(close).not.toBeNull();
    expect(close.hasAttribute('aria-hidden')).toBe(false);
    expect(close.getAttribute('type')).toBe('button');
    expect(close.getAttribute('aria-label')).toBeTruthy();
  });

  it('closes the tab when the close button is activated by keyboard (native button click)', () => {
    const close = fixture.nativeElement.querySelector('button.tab-router__close') as HTMLButtonElement;

    close.click();

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
  });

  // why: badge không còn nhân bản (click)="onTabClick" — nó chỉ nuốt event khi có consumer, nên
  // click trên badge bọt lên <a> cha như bình thường và badge không thành nút lồng trong <a>.
  it('does not turn the badge into a nested interactive element inside the anchor', () => {
    const badgeRoot = fixture.nativeElement.querySelector('sd-badge > *') as HTMLElement;

    expect(badgeRoot.getAttribute('role')).toBeNull();
    expect(badgeRoot.getAttribute('tabindex')).toBeNull();
    expect(badgeRoot.hasAttribute('aria-hidden')).toBe(false);
  });
});

describe('SdTabRouterItemComponent badge bindings', () => {
  let fixture: ComponentFixture<SdTabRouterItemComponent>;
  let tabInfoChanges: Subject<SdTabInfo>;

  const tabInfo: SdTabInfo = {
    name: 'Danh sách hợp đồng',
    icon: 'description',
    color: 'primary',
  } as SdTabInfo;

  beforeEach(async () => {
    tabInfoChanges = new Subject<SdTabInfo>();

    await TestBed.configureTestingModule({
      imports: [SdTabRouterItemComponent, NoopAnimationsModule],
      providers: [
        {
          provide: SdTabRouterService,
          useValue: { close: jasmine.createSpy('close'), events: new BehaviorSubject(undefined), builders: new BehaviorSubject([]) },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SdTabRouterItemComponent);
    fixture.componentInstance.tab = {
      key: 'contracts',
      component: class {},
      isActive: false,
      url: '/contracts',
      tabInfoChanges,
    } as SdTabRouterTab;

    fixture.detectChanges();
    tabInfoChanges.next(tabInfo);
    fixture.detectChanges();
  });

  // why: template từng có `[title]="info.icon"` ngay trên `[title]="info.name"` — binding chết do
  // copy-paste, ghi đè ngay lập tức và bắt sd-badge nhận hai giá trị title mỗi lần CD.
  it('binds the tab name to the badge title and the icon only to the badge icon', () => {
    const badge = fixture.debugElement.query(By.directive(SdBadge)).componentInstance as SdBadge;

    expect(badge.title()).toBe(tabInfo.name);
    expect(badge.icon()).toBe(tabInfo.icon);

    fixture.detectChanges();

    expect(badge.title()).toBe(tabInfo.name);
  });

  it('renders the tab name, not the icon name, as the badge label', () => {
    const label = fixture.nativeElement.querySelector('.c-badge-title') as HTMLElement;

    expect(label.textContent?.trim()).toBe(tabInfo.name);
  });
});
