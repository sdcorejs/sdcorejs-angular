import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LucideCheck, LucideChevronsUpDown, LucideRefreshCw, LucideSearch, LucideX } from '@lucide/angular';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon, provideSdIcon } from '@sdcorejs/angular/modules/icon';
import { SdLayoutContext, SdLayoutContextConfiguration } from '../../../configurations';
import { SdLayoutContextService } from '../../../services/context';
import { SdLayoutContextSwitcher } from './context-switcher.component';

const translations: Record<string, string> = {
  'core.module.layout.context.default-label': 'Context',
  'core.module.layout.context.trigger': 'Change {label}',
  'core.module.layout.context.search-placeholder': 'Search {label}',
  'core.module.layout.context.choose-title': 'Choose {label}',
  'core.module.layout.context.switching': 'Switching…',
  'core.module.layout.context.switch-failed': 'Could not switch. Please try again.',
  'core.module.layout.context.changed-elsewhere': 'Context changed in another tab',
  'core.common.close': 'Close',
  'core.common.reload': 'Reload page',
};

const i18nStub = {
  t: (key: string, params?: Record<string, unknown>) =>
    (translations[key] ?? key).replace(/\{(\w+)\}/g, (match, name: string) => (params && name in params ? String(params[name]) : match)),
};

interface ContextServiceStub {
  current: WritableSignal<SdLayoutContext | null>;
  items: WritableSignal<readonly SdLayoutContext[]>;
  switchingId: WritableSignal<string | null>;
  switchFailed: WritableSignal<boolean>;
  changedElsewhere: WritableSignal<boolean>;
  syncItems: jasmine.Spy;
  setCurrentContext: jasmine.Spy;
  reload: jasmine.Spy;
}

function createServiceStub(): ContextServiceStub {
  const stub: ContextServiceStub = {
    current: signal<SdLayoutContext | null>(null),
    items: signal<readonly SdLayoutContext[]>([]),
    switchingId: signal<string | null>(null),
    switchFailed: signal(false),
    changedElsewhere: signal(false),
    syncItems: jasmine.createSpy('syncItems'),
    setCurrentContext: jasmine.createSpy('setCurrentContext'),
    reload: jasmine.createSpy('reload'),
  };
  // why: mô phỏng service thật — lưu items đã nhận và chọn items[0] khi chưa có context.
  stub.syncItems.and.callFake((items: readonly SdLayoutContext[] | null | undefined) => {
    const list = items ?? [];
    stub.items.set(list);
    if (!stub.current() && list.length) stub.current.set(list[0]);
  });
  // why: service thật bật `switchingId` và giữ nguyên trong lúc chờ reload.
  stub.setCurrentContext.and.callFake((id: string) => stub.switchingId.set(id));
  return stub;
}

const AVATAR_URL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const projects: SdLayoutContext[] = [
  { id: 'enterprise', title: 'Enterprise Platform', subtitle: 'Owner · 7 members', avatar: AVATAR_URL },
  { id: 'banking', title: 'Mobile Banking', subtitle: 'PO · 12 members' },
  { id: 'partner', title: 'Partner Portal', subtitle: 'BA · 5 members' },
];

/** Applies the `@media (pointer: coarse)` rules that match `element` as inline styles (same helper as sidebar V4). */
function simulateCoarsePointer(element: HTMLElement): void {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule) || !rule.conditionText.includes('pointer: coarse')) continue;
      for (const inner of Array.from(rule.cssRules)) {
        if (!(inner instanceof CSSStyleRule) || !element.matches(inner.selectorText)) continue;
        for (const property of Array.from(inner.style)) element.style.setProperty(property, inner.style.getPropertyValue(property));
      }
    }
  }
}

const makeItems = (count: number): SdLayoutContext[] =>
  Array.from({ length: count }, (_, index) => ({ id: `ctx-${index + 1}`, title: `Context ${index + 1}`, subtitle: `Team ${index + 1}` }));

describe('SdLayoutContextSwitcher', () => {
  let fixture: ComponentFixture<SdLayoutContextSwitcher>;
  let service: ContextServiceStub;

  beforeEach(async () => {
    service = createServiceStub();
    await TestBed.configureTestingModule({
      imports: [SdLayoutContextSwitcher],
      providers: [
        provideNoopAnimations(),
        { provide: SdLayoutContextService, useValue: service },
        { provide: I18nService, useValue: i18nStub },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SdLayoutContextSwitcher);
  });

  const anchors: HTMLElement[] = [];
  afterEach(() => anchors.splice(0).forEach(anchor => anchor.remove()));

  /** A fixed element standing in for the sidebar header or rail the mounting sidebar passes as `anchor`. */
  function createAnchor(style: Partial<Record<'left' | 'top' | 'width' | 'height', string>>): HTMLElement {
    const anchor = document.createElement('div');
    Object.assign(anchor.style, { position: 'fixed', ...style });
    document.body.appendChild(anchor);
    anchors.push(anchor);
    return anchor;
  }

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const trigger = (): HTMLButtonElement | null => host().querySelector<HTMLButtonElement>('[data-context-trigger]');
  const popover = (): HTMLElement | null => overlay().querySelector<HTMLElement>('[data-context-popover]');
  const sheet = (): HTMLElement | null => overlay().querySelector<HTMLElement>('[data-context-sheet]');
  const rows = (): HTMLButtonElement[] => [...overlay().querySelectorAll<HTMLButtonElement>('[data-context-row]')];
  const rowTitles = (): string[] => rows().map(row => row.querySelector('[data-context-row-title]')?.textContent?.trim() ?? '');
  const search = (): HTMLInputElement | null => overlay().querySelector<HTMLInputElement>('[data-context-search] input');
  const iconNames = (root: Element): string[] => [...root.querySelectorAll('sd-icon')].map(icon => icon.textContent?.trim() ?? '');

  function render(
    configuration: SdLayoutContextConfiguration | null | undefined,
    appearance: 'header' | 'rail' | 'sheet' = 'header'
  ): void {
    fixture.componentRef.setInput('configuration', configuration);
    fixture.componentRef.setInput('appearance', appearance);
    fixture.detectChanges();
  }

  async function open(): Promise<void> {
    trigger()!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function type(value: string): void {
    const input = search()!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  describe('rendering (AC-014, AC-018, INV-001, INV-013)', () => {
    it('renders nothing and never syncs without a configuration', () => {
      render(undefined);

      expect(host().children.length).toBe(0);
      expect(service.syncItems).not.toHaveBeenCalled();
    });

    it('forwards the configured items to syncItems on init and whenever the configuration changes', () => {
      render({ items: projects });
      expect(service.syncItems).toHaveBeenCalledOnceWith(projects);

      const next = [projects[1], projects[2]];
      render({ items: next });

      expect(service.syncItems).toHaveBeenCalledTimes(2);
      expect(service.syncItems.calls.mostRecent().args).toEqual([next]);
    });

    it('renders nothing when the items are empty', () => {
      render({ items: [] });

      expect(service.syncItems).toHaveBeenCalledOnceWith([]);
      expect(host().children.length).toBe(0);
    });

    it('shows a single context as plain text without a chevron that cannot open', () => {
      render({ items: [projects[1]] });

      const text = host().querySelector<HTMLElement>('[data-context-static]')!;
      expect(text.textContent?.trim()).toBe('Mobile Banking');
      expect(host().querySelector('button')).toBeNull();
      expect(host().querySelector('sd-icon')).toBeNull();

      text.click();
      fixture.componentInstance.open();
      fixture.detectChanges();
      expect(fixture.componentInstance.isOpen()).toBeFalse();
      expect(popover()).toBeNull();
    });

    it('shows the avatar of a single context on the rail without a button', () => {
      render({ items: [projects[1]] }, 'rail');

      const avatar = host().querySelector<HTMLElement>('[data-context-static]')!;
      expect(avatar.getAttribute('title')).toBe('Mobile Banking');
      expect(avatar.textContent?.trim()).toBe('M');
      expect(host().querySelector('button')).toBeNull();
    });
  });

  describe('header trigger and popover (AC-014)', () => {
    it('renders the current title with the dialog trigger attributes', async () => {
      render({ label: 'Project', items: projects });

      const button = trigger()!;
      expect(button.getAttribute('type')).toBe('button');
      expect(button.textContent).toContain('Enterprise Platform');
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      // WCAG 2.5.3: the accessible name starts with the visible title.
      expect(button.getAttribute('aria-label')).toBe('Enterprise Platform, Change Project');
      expect(iconNames(button)).toEqual(['unfold_more']);

      await open();

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(button.classList).toContain('sd-layout-context-switcher__trigger--open');
      expect(iconNames(button)).toEqual(['unfold_less']);
      expect(popover()!.getAttribute('role')).toBe('dialog');
      expect(popover()!.getAttribute('aria-label')).toBe('Choose Project');
    });

    it('labels the list with the configured label and the number of items', async () => {
      render({ label: 'Project', items: projects });
      await open();

      expect(popover()!.querySelector('[data-context-label]')?.textContent?.trim()).toBe('Project · 3');
      expect(rowTitles()).toEqual(['Enterprise Platform', 'Mobile Banking', 'Partner Portal']);
    });

    it('falls back to the translated default label', async () => {
      render({ items: projects });

      expect(trigger()!.getAttribute('aria-label')).toBe('Enterprise Platform, Change Context');
      await open();
      expect(popover()!.querySelector('[data-context-label]')?.textContent?.trim()).toBe('Context · 3');
    });

    it('moves focus to the active row, or to the search when it is shown', async () => {
      service.current.set(projects[1]);
      render({ items: projects });
      await open();
      expect(document.activeElement).toBe(rows()[1]);

      fixture.componentInstance.close();
      fixture.detectChanges();
      fixture.componentRef.setInput('configuration', { items: projects, searchable: true });
      fixture.detectChanges();
      await open();
      expect(document.activeElement).toBe(search());
    });

    it('sizes the header popover from the host variable with a fallback width', async () => {
      render({ items: projects });
      await open();
      expect(getComputedStyle(popover()!).width).toBe('256px');

      fixture.componentInstance.close(false);
      fixture.detectChanges();
      host().style.setProperty('--sd-layout-context-switcher-popover-width', '300px');
      await open();
      expect(getComputedStyle(popover()!).width).toBe('300px');
    });

    it('places the popover below the anchor, 12px inside both of its edges', async () => {
      const anchor = createAnchor({ left: '20px', top: '30px', width: '280px', height: '64px' });
      fixture.componentRef.setInput('anchor', anchor);
      render({ items: projects });
      await open();

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover()!.getBoundingClientRect();
      expect(popoverRect.left).toBeGreaterThanOrEqual(anchorRect.left);
      expect(popoverRect.right).toBeLessThanOrEqual(anchorRect.right);
      expect(popoverRect.left).toBeCloseTo(anchorRect.left + 12, 0);
      expect(popoverRect.width).toBeCloseTo(anchorRect.width - 24, 0);
      expect(popoverRect.top).toBeCloseTo(anchorRect.bottom, 0);
    });

    it('lets the host variable override the anchor width', async () => {
      const anchor = createAnchor({ left: '20px', top: '30px', width: '280px', height: '64px' });
      fixture.componentRef.setInput('anchor', anchor);
      host().style.setProperty('--sd-layout-context-switcher-popover-width', '200px');
      render({ items: projects });
      await open();

      const popoverRect = popover()!.getBoundingClientRect();
      expect(popoverRect.width).toBeCloseTo(200, 0);
      expect(popoverRect.left).toBeCloseTo(anchor.getBoundingClientRect().left + 12, 0);
    });
  });

  describe('search (AC-014, INV-013)', () => {
    it('hides the search with 7 items', async () => {
      render({ items: makeItems(7) });
      await open();

      expect(search()).toBeNull();
    });

    it('shows the search with 8 items', async () => {
      render({ label: 'Project', items: makeItems(8) });
      await open();

      expect(search()!.type).toBe('search');
      expect(search()!.placeholder).toBe('Search Project');
      expect(search()!.getAttribute('aria-label')).toBe('Search Project');
    });

    it('forces the search on with searchable true and 2 items', async () => {
      render({ items: makeItems(2), searchable: true });
      await open();

      expect(search()).not.toBeNull();
    });

    it('forces the search off with searchable false and 9 items', async () => {
      render({ items: makeItems(9), searchable: false });
      await open();

      expect(search()).toBeNull();
    });

    it('filters title and subtitle without accents while the label keeps the total', async () => {
      const items: SdLayoutContext[] = [
        ...makeItems(6),
        { id: 'hn', title: 'Hà Nội', subtitle: 'Miền Bắc' },
        { id: 'dn', title: 'Đà Nẵng', subtitle: 'Miền Trung' },
      ];
      render({ label: 'Branch', items });
      await open();

      type('ha noi');
      expect(rowTitles()).toEqual(['Hà Nội']);
      expect(popover()!.querySelector('[data-context-label]')?.textContent?.trim()).toBe('Branch · 8');

      type('mien trung');
      expect(rowTitles()).toEqual(['Đà Nẵng']);
    });
  });

  describe('rows (AC-014, INV-013)', () => {
    it('marks the row of the current context with a check and aria-current', async () => {
      service.current.set(projects[1]);
      render({ items: projects });
      await open();

      const [enterprise, banking, partner] = rows();
      expect(banking.getAttribute('aria-current')).toBe('true');
      expect(iconNames(banking)).toEqual(['check']);
      expect(banking.classList).toContain('sd-layout-context-switcher__row--active');
      for (const row of [enterprise, partner]) {
        expect(row.hasAttribute('aria-current')).toBeFalse();
        expect(iconNames(row)).toEqual([]);
      }
      expect(rows().every(row => row.getAttribute('type') === 'button')).toBeTrue();
    });

    it('renders the avatar image or the initial, and the initial when the image fails', async () => {
      render({ items: projects });
      await open();

      const [enterprise, banking] = rows();
      const image = enterprise.querySelector<HTMLImageElement>('[data-context-avatar] img')!;
      expect(image.getAttribute('src')).toBe(AVATAR_URL);
      expect(banking.querySelector('[data-context-avatar]')?.textContent?.trim()).toBe('M');
      expect(banking.querySelector('[data-context-avatar] img')).toBeNull();

      image.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(enterprise.querySelector('[data-context-avatar] img')).toBeNull();
      expect(enterprise.querySelector('[data-context-avatar]')?.textContent?.trim()).toBe('E');
    });
  });

  describe('switching (AC-015, D-026)', () => {
    it('switches once and locks the other rows while switching', async () => {
      render({ items: projects });
      await open();

      rows()[2].click();
      fixture.detectChanges();

      expect(service.setCurrentContext).toHaveBeenCalledOnceWith('partner');
      const [enterprise, banking, partner] = rows();
      expect(partner.getAttribute('aria-busy')).toBe('true');
      expect(iconNames(partner)).toEqual(['refresh']);
      expect(partner.querySelector('sd-icon')!.classList).toContain('sd-layout-context-switcher__spinner');
      expect(partner.querySelector('[data-context-row-subtitle]')?.textContent?.trim()).toBe('Switching…');
      expect(enterprise.disabled).toBeTrue();
      expect(banking.disabled).toBeTrue();
      expect(partner.disabled).toBeFalse();

      partner.click();
      banking.click();
      fixture.detectChanges();
      expect(service.setCurrentContext).toHaveBeenCalledTimes(1);
      expect(popover()).not.toBeNull();
    });

    it('only closes the popover when the active row is selected', async () => {
      render({ items: projects });
      await open();

      rows()[0].click();
      fixture.detectChanges();

      expect(service.setCurrentContext).not.toHaveBeenCalled();
      expect(popover()).toBeNull();
      expect(trigger()!.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger());
    });

    it('shows the inline error and re-enables the rows when the switch failed', async () => {
      render({ items: projects });
      await open();

      rows()[1].click();
      fixture.detectChanges();
      expect(rows()[1].getAttribute('aria-busy')).toBe('true');
      expect(rows().filter(row => row.disabled).length).toBe(2);
      expect(popover()!.querySelector('[data-context-error]')).toBeNull();

      // The service could not confirm the write: it clears switchingId and raises switchFailed (D-026).
      service.switchingId.set(null);
      service.switchFailed.set(true);
      fixture.detectChanges();

      const error = popover()!.querySelector<HTMLElement>('[data-context-error]')!;
      expect(error.textContent?.trim()).toBe('Could not switch. Please try again.');
      expect(error.getAttribute('role')).toBe('alert');
      expect(rows().every(row => !row.disabled)).toBeTrue();
      expect(rows().some(row => row.hasAttribute('aria-busy'))).toBeFalse();
    });
  });

  describe('changed in another tab (R-009)', () => {
    it('shows the notice below the header trigger and reloads only on click', () => {
      render({ items: projects });
      expect(host().querySelector('[data-context-notice]')).toBeNull();

      service.changedElsewhere.set(true);
      fixture.detectChanges();

      const notice = host().querySelector<HTMLElement>('[data-context-notice]')!;
      expect(notice.textContent).toContain('Context changed in another tab');
      expect(service.reload).not.toHaveBeenCalled();

      notice.querySelector<HTMLButtonElement>('[data-context-reload]')!.click();
      expect(service.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('closing (AC-014)', () => {
    it('closes on Escape and returns focus to the trigger', async () => {
      render({ items: projects });
      await open();

      popover()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(popover()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('closes on a backdrop click', async () => {
      render({ items: projects });
      await open();

      overlay().querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      fixture.detectChanges();

      expect(popover()).toBeNull();
      expect(trigger()!.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('rail (AC-018)', () => {
    it('renders the avatar trigger and opens a 232px popover', async () => {
      // why: cả suite để lại DOM trên body nên host trôi xuống gần đáy viewport và CDK đẩy popover lên —
      // cố định rail ở đầu trang để phép đo căn đỉnh không phụ thuộc thứ tự spec.
      createAnchor({ left: '0px', top: '0px', width: '72px', height: '100vh' }).appendChild(host());
      render({ label: 'Project', items: projects }, 'rail');

      const button = trigger()!;
      expect(button.classList).toContain('sd-layout-context-switcher__trigger--rail');
      expect(button.getAttribute('title')).toBe('Enterprise Platform');
      expect(button.getAttribute('aria-label')).toBe('Enterprise Platform, Change Project');
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.querySelector('[data-context-avatar] img')?.getAttribute('src')).toBe(AVATAR_URL);

      await open();

      expect(popover()!.classList).toContain('sd-layout-context-switcher__popover--rail');
      expect(getComputedStyle(popover()!).width).toBe('232px');
      const triggerRect = button.getBoundingClientRect();
      const popoverRect = popover()!.getBoundingClientRect();
      expect(popoverRect.left).toBeGreaterThanOrEqual(triggerRect.right);
      expect(popoverRect.top).toBeCloseTo(triggerRect.top, 0);
    });

    it('opens 8px from the right edge of the anchor, top-aligned with the trigger', async () => {
      const anchor = createAnchor({ left: '0px', top: '0px', width: '72px', height: '100vh' });
      anchor.appendChild(host());
      fixture.componentRef.setInput('anchor', anchor);
      render({ items: projects }, 'rail');
      await open();

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover()!.getBoundingClientRect();
      expect(popoverRect.left).toBeGreaterThanOrEqual(anchorRect.right);
      expect(popoverRect.left).toBeCloseTo(anchorRect.right + 8, 0);
      expect(popoverRect.top).toBeCloseTo(trigger()!.getBoundingClientRect().top, 0);
    });

    it('gives the 28px rail avatar a 44px hit area under a coarse pointer without moving the rail layout', () => {
      render({ items: projects }, 'rail');
      const button = trigger()!;
      const avatar = button.querySelector<HTMLElement>('[data-context-avatar]')!;
      const hostBefore = host().getBoundingClientRect();
      const avatarBefore = avatar.getBoundingClientRect();
      expect(button.getBoundingClientRect().height).toBe(28);

      simulateCoarsePointer(button);

      const buttonRect = button.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();
      const hostRect = host().getBoundingClientRect();
      expect(buttonRect.width).toBe(44);
      expect(buttonRect.height).toBe(44);
      expect(avatarRect.width).toBe(28);
      expect(avatarRect.height).toBe(28);
      expect(avatarRect.left).toBeCloseTo(avatarBefore.left, 1);
      expect(avatarRect.top).toBeCloseTo(avatarBefore.top, 1);
      expect(hostRect.height).toBe(hostBefore.height);
    });

    it('keeps the 44px hit area and the inset focus ring when the host shrinks to fit a centered rail column', () => {
      // V2/V4 rails center their items in a column, so the switcher host is only as wide as its content.
      const column = createAnchor({ left: '0px', top: '0px', width: '72px', height: '200px' });
      Object.assign(column.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px' });
      // why: Karma không nạp theme — thiếu token thì cả shorthand `outline` thành không hợp lệ và ring biến mất.
      column.style.setProperty('--sd-focus-ring-color', 'rgb(0, 92, 187)');
      column.appendChild(host());
      render({ items: projects }, 'rail');
      const button = trigger()!;
      const avatar = button.querySelector<HTMLElement>('[data-context-avatar]')!;
      const avatarBefore = avatar.getBoundingClientRect();
      expect(host().getBoundingClientRect().width).toBe(28);

      button.focus();
      expect(button.matches(':focus-visible')).toBeTrue();
      simulateCoarsePointer(button);

      const buttonRect = button.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();
      expect(buttonRect.width).toBe(44);
      expect(buttonRect.height).toBe(44);
      expect(avatarRect.width).toBe(28);
      expect(avatarRect.height).toBe(28);
      expect(avatarRect.left).toBeCloseTo(avatarBefore.left, 1);
      expect(avatarRect.top).toBeCloseTo(avatarBefore.top, 1);
      expect(host().getBoundingClientRect().width).toBe(28);
      const style = getComputedStyle(button);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineColor).toBe('rgb(0, 92, 187)');
      expect(style.outlineOffset).toBe('-6px');
    });

    it('draws the notice dot ring from the hook an ancestor sets', () => {
      const wrapper = createAnchor({ left: '0px', top: '0px', width: '72px' });
      wrapper.appendChild(host());
      render({ items: projects }, 'rail');
      service.changedElsewhere.set(true);
      fixture.detectChanges();
      const dot = trigger()!.querySelector<HTMLElement>('[data-context-dot]')!;
      expect(getComputedStyle(dot).boxShadow).not.toContain('rgb(1, 2, 3)');

      wrapper.style.setProperty('--sd-layout-context-switcher-dot-ring-color', 'rgb(1, 2, 3)');

      expect(getComputedStyle(dot).boxShadow).toContain('rgb(1, 2, 3)');
      expect(getComputedStyle(dot).boxShadow).toContain('0px 0px 0px 2px');
    });

    it('shows the initial of the current context when it has no avatar', () => {
      service.current.set(projects[1]);
      render({ items: projects }, 'rail');

      expect(trigger()!.querySelector('[data-context-avatar]')?.textContent?.trim()).toBe('M');
    });

    it('marks the avatar with a dot and shows the notice at the top of the popover', async () => {
      render({ items: projects }, 'rail');
      service.changedElsewhere.set(true);
      fixture.detectChanges();

      expect(trigger()!.querySelector('[data-context-dot]')).not.toBeNull();
      expect(host().querySelector('[data-context-notice]')).toBeNull();

      await open();
      const notice = popover()!.querySelector<HTMLElement>('[data-context-notice]')!;
      expect(popover()!.firstElementChild).toBe(notice);
      notice.querySelector<HTMLButtonElement>('[data-context-reload]')!.click();
      expect(service.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('sheet (AC-018, D-027)', () => {
    it('opens a bottom sheet dialog with a title, a close button and 56px rows', async () => {
      render({ label: 'Project', items: projects }, 'sheet');

      const button = trigger()!;
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.textContent).toContain('Enterprise Platform');
      expect(button.getAttribute('aria-label')).toBe('Enterprise Platform, Change Project');

      await open();

      const dialog = sheet()!;
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      const titleId = dialog.getAttribute('aria-labelledby')!;
      expect(overlay().querySelector(`#${titleId}`)?.textContent?.trim()).toBe('Choose Project');
      const close = dialog.querySelector<HTMLButtonElement>('[data-context-close]')!;
      expect(close.getAttribute('aria-label')).toBe('Close');
      expect(rows().length).toBe(3);
      expect(rows().every(row => row.classList.contains('sd-layout-context-switcher__row--sheet'))).toBeTrue();
      expect(button.getAttribute('aria-expanded')).toBe('true');

      close.click();
      fixture.detectChanges();

      expect(sheet()).toBeNull();
      expect(document.activeElement).toBe(button);
    });

    it('closes only the sheet on Escape and returns focus to the trigger', async () => {
      const documentKeydown = jasmine.createSpy('documentKeydown');
      document.addEventListener('keydown', documentKeydown);
      try {
        render({ items: projects }, 'sheet');
        await open();

        sheet()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();

        expect(sheet()).toBeNull();
        expect(documentKeydown).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(trigger());
      } finally {
        document.removeEventListener('keydown', documentKeydown);
      }
    });

    it('shows the changed-elsewhere notice below the sheet trigger', () => {
      service.changedElsewhere.set(true);
      render({ items: projects }, 'sheet');

      expect(host().querySelector('[data-context-notice]')?.textContent).toContain('Context changed in another tab');
    });
  });
});

describe('SdLayoutContextSwitcher with the Lucide renderer', () => {
  it('only renders icons that resolve under Lucide: unfold_more stays while open, refresh spins while switching', async () => {
    TestBed.configureTestingModule({
      imports: [SdLayoutContextSwitcher],
      providers: [
        provideNoopAnimations(),
        // why: Lucide ném lỗi với icon chưa đăng ký — chỉ đăng ký đúng các alias mà switcher được phép dùng.
        provideSdIcon({
          defaultFontSet: 'lucide',
          lucideIcons: [LucideChevronsUpDown, LucideRefreshCw, LucideCheck, LucideSearch, LucideX],
        }),
        { provide: SdLayoutContextService, useValue: createServiceStub() },
        { provide: I18nService, useValue: i18nStub },
      ],
    });
    const fixture = TestBed.createComponent(SdLayoutContextSwitcher);
    fixture.componentRef.setInput('configuration', { items: projects, searchable: true });
    fixture.detectChanges();

    const triggerElement = fixture.debugElement.query(By.css('[data-context-trigger]'));
    (triggerElement.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((triggerElement.query(By.directive(SdIcon)).componentInstance as SdIcon).name()).toBe('unfold_more');
    expect(triggerElement.nativeElement.querySelector('sd-icon svg')).not.toBeNull();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const rows = (): HTMLButtonElement[] => [...overlay.querySelectorAll<HTMLButtonElement>('[data-context-row]')];
    expect(overlay.querySelector('[data-context-search] sd-icon svg')).not.toBeNull();
    expect(rows()[0].querySelector('sd-icon svg')).not.toBeNull();

    rows()[1].click();
    fixture.detectChanges();

    const spinner = rows()[1].querySelector('sd-icon')!;
    expect(spinner.classList).toContain('sd-layout-context-switcher__spinner');
    expect(spinner.querySelector('svg')).not.toBeNull();
  });
});
