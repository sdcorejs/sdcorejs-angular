import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

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

  // why: Chrome mở link ở tab mới khi xử lý `auxclick` của chuột giữa; chặn ở `mousedown`/`mouseup`
  // không huỷ được. Trước đây chỉ "chạy" khi thẻ <a> bị gỡ khỏi DOM ngay trong `mouseup` — với
  // `eventCoalescing`, zoneless hay `beforeClose` async thì tab vừa đóng vừa mở trong trình duyệt.
  it('cancels the middle-click auxclick so the browser does not open the tab url in a new tab', () => {
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const auxclick = new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true });

    anchor.dispatchEvent(auxclick);

    expect(auxclick.defaultPrevented).toBe(true);
  });

  it('keeps the auxclick of other buttons, so the context menu still works', () => {
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const auxclick = new MouseEvent('auxclick', { button: 2, bubbles: true, cancelable: true });

    anchor.dispatchEvent(auxclick);

    expect(auxclick.defaultPrevented).toBe(false);
  });

  it('closes the tab once for a full middle click (mousedown, mouseup, auxclick)', () => {
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    for (const type of ['mousedown', 'mouseup', 'auxclick']) {
      anchor.dispatchEvent(new MouseEvent(type, { button: 1, bubbles: true, cancelable: true }));
    }

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
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

  // why: tab không còn bọc sd-badge (đợt 3 · 3a), nên trong tab chỉ còn đúng một phần tử tương tác lồng: nút đóng.
  it('nests no interactive element other than the close button', () => {
    const anchor = fixture.nativeElement.querySelector('a') as HTMLElement;
    const nested = anchor.querySelectorAll('a, button, [role="button"], [tabindex]');

    expect(Array.from(nested)).toEqual([fixture.nativeElement.querySelector('button.tab-router__close')]);
  });
});

describe('SdTabRouterItemComponent tab info', () => {
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

  it('renders the icon as a decorative sd-icon and the tab name as the label', () => {
    const icon = fixture.nativeElement.querySelector('.tab-router__icon') as HTMLElement;
    const name = fixture.nativeElement.querySelector('.tab-router__name') as HTMLElement;

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.classList).toContain('c-primary');
    expect(name.textContent?.trim()).toBe(tabInfo.name);
  });

  it('updates the name when tabInfoChanges emits again', () => {
    tabInfoChanges.next({ ...tabInfo, name: 'Hợp đồng HD-2026-118' });
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.tab-router__name') as HTMLElement).textContent?.trim()).toBe('Hợp đồng HD-2026-118');
  });
});
