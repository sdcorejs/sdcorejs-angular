import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  it('closes the tab once for a full middle click (mousedown, mouseup, auxclick)', () => {
    const tab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLElement;

    for (const type of ['mousedown', 'mouseup', 'auxclick']) {
      tab.dispatchEvent(new MouseEvent(type, { button: 1, bubbles: true, cancelable: true }));
    }

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
  });

  // why: đợt 3 · 3c (QĐ 11) — với <a href>, CDK drag chặn mousedown (thẻ link kéo được theo kiểu native) nên bấm chuột
  // không focus được tab, và menu chuột phải của trình duyệt ("mở trong tab mới") chiếm chỗ menu của thanh tab.
  it('is a role="tab" element without href', () => {
    const tab = fixture.nativeElement.querySelector('.tab-router__item') as HTMLElement;

    expect(tab.tagName).not.toBe('A');
    expect(tab.getAttribute('role')).toBe('tab');
    expect(tab.hasAttribute('href')).toBe(false);
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('marks the open tab with aria-selected and points aria-controls at its pane', () => {
    const tab = () => fixture.nativeElement.querySelector('[role="tab"]') as HTMLElement;
    expect(tab().getAttribute('aria-selected')).toBe('false');
    expect(tab().getAttribute('aria-controls')).toBe('test-key');
    expect(tab().id).toBe('sd-tab-router-tab-test-key');

    component.tab = { ...component.tab, isActive: true };
    fixture.debugElement.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    expect(tab().getAttribute('aria-selected')).toBe('true');
  });

  // why: roving tabindex — cả thanh chỉ có một điểm dừng Tab, do nav chọn; nút đóng không bao giờ là điểm dừng (đóng
  // bằng phím Delete).
  it('is a tab stop only when the bar picks it, and the close button never is', () => {
    const tab = () => fixture.nativeElement.querySelector('[role="tab"]') as HTMLElement;
    expect(tab().getAttribute('tabindex')).toBe('-1');

    fixture.componentRef.setInput('focusable', true);
    fixture.detectChanges();
    expect(tab().getAttribute('tabindex')).toBe('0');
    expect((fixture.nativeElement.querySelector('button.tab-router__close') as HTMLElement).getAttribute('tabindex')).toBe('-1');
  });

  it('opens the tab with Enter and Space', () => {
    const navigate = TestBed.inject(Router).navigate as jasmine.Spy;
    const tab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLElement;

    tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    tab.dispatchEvent(space);

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith(['/test'], { queryParams: undefined, state: { switchTab: true } });
    expect(space.defaultPrevented).withContext('Space does not scroll the page').toBe(true);
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
    const tab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLElement;
    const nested = tab.querySelectorAll('a, button, [role="button"], [tabindex]');

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
