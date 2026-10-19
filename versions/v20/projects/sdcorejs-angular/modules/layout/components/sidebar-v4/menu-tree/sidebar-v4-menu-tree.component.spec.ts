import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutRootMenu } from '../../../services';
import { SdSidebarV4MenuTree, buildSidebarV4SearchResults } from './sidebar-v4-menu-tree.component';

const overview: SdLayoutRootMenu = {
  id: 'overview',
  title: 'Overview',
  path: '/overview',
  icon: 'space_dashboard',
  permission: true,
  section: 'Workspace',
};
const stories: SdLayoutRootMenu = {
  id: 'stories',
  title: 'User Stories',
  path: '/stories',
  icon: 'article',
  permission: true,
  section: 'Requirements',
  badge: { value: 19 },
};
const runs: SdLayoutRootMenu = {
  id: 'runs',
  title: 'Agent Runs',
  path: '/runs',
  icon: 'memory',
  permission: true,
  section: 'Execution',
  status: { label: '1 running', tone: 'success', live: true },
};
// badge thắng status theo thứ tự comingSoon → badge → status (D-015)
const approvals: SdLayoutRootMenu = {
  id: 'approvals',
  title: 'Approvals',
  path: '/approvals',
  icon: 'approval',
  permission: true,
  section: 'Execution',
  badge: { value: 3, tone: 'warning' },
  status: { label: 'Busy', tone: 'warning' },
};
const incidents: SdLayoutRootMenu = {
  id: 'incidents',
  title: 'Incidents',
  path: '/incidents',
  icon: 'report',
  permission: true,
  section: 'Execution',
  badge: { value: 2, tone: 'error' },
};
const github: SdLayoutRootMenu = {
  id: 'github',
  title: 'GitHub',
  path: '/integrations/github',
  permission: true,
  status: { label: 'Connected', tone: 'success' },
};
// comingSoon thắng badge
const atlassian: SdLayoutRootMenu = {
  id: 'atlassian',
  title: 'Atlassian',
  path: '/integrations/atlassian',
  permission: true,
  comingSoon: true,
  badge: { value: 5, tone: 'warning' },
};
const integrations: SdLayoutChildrenMenu = {
  id: 'integrations',
  title: 'Integrations',
  icon: 'hub',
  section: 'Project',
  children: [github, atlassian],
};
const members: SdLayoutRootMenu = { id: 'members', title: 'Members & Roles', path: '/settings/members', permission: true };
const models: SdLayoutRootMenu = { id: 'models', title: 'AI Providers & Models', path: '/settings/models', permission: true };
const runners: SdLayoutRootMenu = { id: 'runners', title: 'Cloud Runners', path: '/settings/advanced/runners', permission: true };
const advanced: SdLayoutChildrenMenu = { id: 'advanced', title: 'Advanced', children: [runners] };
const settings: SdLayoutChildrenMenu = {
  id: 'settings',
  title: 'Project Settings',
  icon: 'settings',
  section: 'Project',
  children: [members, models, advanced],
};
const help: SdLayoutRootMenu = { id: 'help', title: 'Trợ giúp', path: '/help', icon: 'help', permission: true };
const menus: SdLayoutMenu[] = [overview, stories, runs, approvals, incidents, integrations, settings, help];

const TOKENS: Record<string, string> = {
  '--sd-primary': 'rgb(0, 92, 187)',
  '--sd-primary-light': 'rgb(219, 232, 245)',
  '--sd-warning': 'rgb(166, 99, 0)',
  '--sd-error': 'rgb(186, 26, 26)',
  '--sd-success': 'rgb(46, 125, 50)',
  '--sd-text-secondary': 'rgb(68, 71, 79)',
  '--sd-disabled-text': 'rgb(116, 117, 120)',
};

/**
 * Applies, as inline styles, the declarations of the component's `@media (pointer: coarse)` rules that match `element`, in
 * source order — a stand-in for a touch device, which Karma cannot emulate. Inline values resolve `var()` in the element's
 * real context, so a size variable missing there (e.g. inside the CDK overlay) shows up as an unresolved declaration.
 */
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

describe('SdSidebarV4MenuTree', () => {
  let fixture: ComponentFixture<SdSidebarV4MenuTree>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdSidebarV4MenuTree] }).compileComponents();
    // why: setLanguage ghi localStorage nên spec chạy trước có thể để lại ngôn ngữ khác; chốt 'en' trước khi dựng fixture.
    TestBed.inject(I18nService).setLanguage('en', { reload: false });
  });

  afterEach(() => {
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    for (const name of [...Object.keys(TOKENS), '--sd-sidebar-v4-attention']) document.documentElement.style.removeProperty(name);
  });

  function create(inputs: Record<string, unknown> = {}): void {
    fixture = TestBed.createComponent(SdSidebarV4MenuTree);
    fixture.componentRef.setInput('menus', menus);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  function applyTokens(extra: Record<string, string> = {}): void {
    for (const [name, value] of Object.entries({ ...TOKENS, ...extra })) document.documentElement.style.setProperty(name, value);
  }

  const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null => host.querySelector<T>(selector);
  const qa = (selector: string): HTMLElement[] => Array.from(host.querySelectorAll<HTMLElement>(selector));
  const text = (element: Element | null | undefined): string => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const overlayRoot = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();

  describe('hierarchy', () => {
    it('renders menu icons on top-level rows only (AC-001)', () => {
      create({ activePath: '/settings/members' });

      expect(q('[data-menu-key="id:overview"] [data-menu-icon]')).not.toBeNull();
      expect(q('[data-menu-group="id:settings"] [data-menu-icon]')).not.toBeNull();
      const children = qa('[data-v4-row="child"]');
      expect(children.length).toBeGreaterThan(0);
      expect(children.every(row => !row.querySelector('[data-menu-icon]'))).toBeTrue();
      expect(q('[data-menu-group="id:advanced"] [data-menu-icon]')).toBeNull();
    });

    it('supports an image icon on a root row', () => {
      create({ menus: [{ ...overview, iconUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' }] });

      const image = q<HTMLImageElement>('[data-menu-key="id:overview"] img[data-menu-icon]');
      expect(image).not.toBeNull();
      expect(image?.getAttribute('alt')).toBe('');
    });

    it('marks the active child with aria-current, the active class, the marker and the branch rail (AC-001)', () => {
      create({ activePath: '/settings/members' });

      const active = q('[data-menu-key="id:members"]');
      expect(active?.getAttribute('aria-current')).toBe('page');
      expect(active?.classList).toContain('sd-sidebar-v4-menu-tree__row--active');
      expect(qa('[aria-current="page"]').length).toBe(1);
      expect(q('[data-v4-item="id:models"] [data-v4-marker]')).toBeNull();

      const item = q('[data-v4-item="id:members"]') as HTMLElement;
      expect(getComputedStyle(item).paddingLeft).toBe('32px');
      const marker = getComputedStyle(item.querySelector('[data-v4-marker]') as HTMLElement);
      expect([marker.left, marker.width, marker.top, marker.bottom]).toEqual(['20px', '3px', '7px', '7px']);
      const rail = getComputedStyle(item.querySelector('[data-menu-branch]') as HTMLElement);
      expect([rail.left, rail.width]).toEqual(['21px', '1px']);

      // cấp 2 lùi thêm 16px và có thêm một branch rail
      const nested = q('[data-v4-item="id:runners"]') as HTMLElement;
      expect(getComputedStyle(nested).paddingLeft).toBe('48px');
      expect(Array.from(nested.querySelectorAll<HTMLElement>('[data-menu-branch]')).map(line => getComputedStyle(line).left)).toEqual([
        '21px',
        '37px',
      ]);
    });

    it('uses aria-current and the filled glyph for an active root row (D-012)', () => {
      applyTokens();
      create({ activePath: '/overview' });

      const active = q('[data-menu-key="id:overview"]') as HTMLElement;
      expect(active.getAttribute('aria-current')).toBe('page');
      expect(active.classList).toContain('sd-sidebar-v4-menu-tree__row--active');
      expect(getComputedStyle(active).backgroundColor).toBe(TOKENS['--sd-primary-light']);
      expect(getComputedStyle(active).color).toBe(TOKENS['--sd-primary']);
      const filled = active.querySelector('[data-menu-icon] mat-icon');
      expect(filled?.classList).toContain('material-icons');
      expect(filled?.classList).not.toContain('material-icons-outlined');
      expect(q('[data-menu-key="id:stories"] [data-menu-icon] mat-icon')?.classList).toContain('material-icons-outlined');
    });

    it('shows the dot on a closed group that holds the active route and toggles collapsedGroupKeys (AC-001)', () => {
      create({ activePath: '/settings/members' });
      const group = q<HTMLButtonElement>('[data-menu-group="id:settings"]') as HTMLButtonElement;
      const chevron = (): string => text(group.querySelector('[data-v4-chevron]'));

      expect(group.tagName).toBe('BUTTON');
      expect(group.type).toBe('button');
      expect(group.getAttribute('aria-expanded')).toBe('true');
      expect(group.querySelector('[data-v4-active-dot]')).toBeNull();
      expect(chevron()).toBe('expand_less');

      group.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.collapsedGroupKeys()).toEqual(['id:settings']);
      expect(group.getAttribute('aria-expanded')).toBe('false');
      expect(group.querySelector('[data-v4-active-dot]')).not.toBeNull();
      expect(chevron()).toBe('expand_more');
      expect(q('[data-menu-key="id:members"]')).toBeNull();

      fixture.componentRef.setInput('collapsedGroupKeys', ['id:settings', 'id:integrations']);
      fixture.detectChanges();
      expect(q('[data-menu-group="id:integrations"] [data-v4-active-dot]')).toBeNull();

      group.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.collapsedGroupKeys()).toEqual(['id:integrations']);
      expect(q('[data-menu-key="id:members"]')).not.toBeNull();
    });

    it('emits navigate for root and child rows but not for groups', () => {
      create();
      const emitted: SdLayoutRootMenu[] = [];
      fixture.componentInstance.navigate.subscribe(menu => emitted.push(menu));

      q('[data-menu-key="id:overview"]')?.click();
      q('[data-menu-key="id:members"]')?.click();
      q('[data-menu-group="id:settings"]')?.click();

      expect(emitted).toEqual([overview, members]);
    });

    it('groups rows under one heading per section and separates a trailing unsectioned group (AC-007)', () => {
      create();

      expect(qa('[data-v4-section-label]').map(label => text(label))).toEqual(['Workspace', 'Requirements', 'Execution', 'Project']);
      const blocks = qa('[data-v4-section]');
      expect(blocks.length).toBe(5);
      expect(blocks[0].getAttribute('role')).toBe('group');
      expect(blocks[0].getAttribute('aria-labelledby')).toBe(blocks[0].querySelector('[data-v4-section-label]')?.id ?? 'missing');
      expect(blocks[0].classList).not.toContain('sd-sidebar-v4-menu-tree__section--separated');
      const unsectioned = blocks[4];
      expect(unsectioned.querySelector('[data-v4-section-label]')).toBeNull();
      expect(unsectioned.querySelector('[data-menu-key="id:help"]')).not.toBeNull();
      expect(unsectioned.classList).toContain('sd-sidebar-v4-menu-tree__section--separated');
      expect(parseFloat(getComputedStyle(unsectioned).marginTop)).toBeGreaterThan(0);

      const label = getComputedStyle(qa('[data-v4-section-label]')[0]);
      expect([label.fontSize, label.lineHeight, label.fontWeight, label.letterSpacing]).toEqual(['11px', '16px', '500', '0.3px']);
      expect([label.paddingTop, label.paddingRight, label.paddingBottom, label.paddingLeft]).toEqual(['14px', '12px', '4px', '12px']);
    });

    it('orders sections by first appearance and keeps a leading unsectioned group unseparated (AC-007)', () => {
      create({ menus: [help, overview, stories, { ...runs, section: 'Workspace' }] });

      expect(qa('[data-v4-section-label]').map(label => text(label))).toEqual(['Workspace', 'Requirements']);
      const blocks = qa('[data-v4-section]');
      expect(blocks.length).toBe(3);
      expect(blocks[0].querySelector('[data-v4-section-label]')).toBeNull();
      expect(blocks[0].classList).not.toContain('sd-sidebar-v4-menu-tree__section--separated');
      expect(Array.from(blocks[1].querySelectorAll('[data-menu-key]')).map(row => row.getAttribute('data-menu-key'))).toEqual([
        'id:overview',
        'id:runs',
      ]);
    });

    it('renders one trailing element per row with D-015 precedence (AC-006)', () => {
      applyTokens();
      create();
      const trailing = (key: string): HTMLElement | null => q(`[data-v4-item="${key}"] [data-v4-trailing]`);

      const count = trailing('id:stories') as HTMLElement;
      expect(count.getAttribute('data-v4-trailing')).toBe('count');
      expect(text(count)).toBe('19');
      expect(getComputedStyle(count).fontSize).toBe('12px');

      const warning = trailing('id:approvals') as HTMLElement;
      expect(qa('[data-v4-item="id:approvals"] [data-v4-trailing]').length).toBe(1);
      expect(warning.getAttribute('data-v4-trailing')).toBe('badge');
      expect(warning.classList).toContain('sd-sidebar-v4-menu-tree__badge--warning');
      expect(warning.getAttribute('aria-label')).toBe('3 pending');
      expect(text(warning)).toBe('3');
      const pill = getComputedStyle(warning);
      expect([pill.minWidth, pill.height, pill.borderRadius, pill.fontSize]).toEqual(['20px', '20px', '10px', '11.5px']);
      expect(pill.backgroundColor).toBe(TOKENS['--sd-warning']);

      const error = trailing('id:incidents') as HTMLElement;
      expect(error.classList).toContain('sd-sidebar-v4-menu-tree__badge--error');
      expect(error.getAttribute('aria-label')).toBe('2 pending');
      expect(getComputedStyle(error).backgroundColor).toBe(TOKENS['--sd-error']);

      const live = trailing('id:runs') as HTMLElement;
      expect(live.getAttribute('data-v4-trailing')).toBe('status');
      expect(text(live)).toBe('1 running');
      const liveDot = live.querySelector('[data-v4-status-dot]') as HTMLElement;
      expect(liveDot.classList).toContain('sd-sidebar-v4-menu-tree__status-dot--live');
      expect(getComputedStyle(liveDot).backgroundColor).toBe(TOKENS['--sd-success']);
      expect(getComputedStyle(liveDot).boxShadow).toContain('3px');

      const quiet = trailing('id:github') as HTMLElement;
      expect(quiet.getAttribute('data-v4-trailing')).toBe('status');
      expect(quiet.querySelector('[data-v4-status-dot]')?.classList).not.toContain('sd-sidebar-v4-menu-tree__status-dot--live');
      expect(getComputedStyle(quiet.querySelector('[data-v4-status-dot]') as HTMLElement).boxShadow).toBe('none');

      const soon = trailing('id:atlassian') as HTMLElement;
      expect(soon.getAttribute('data-v4-trailing')).toBe('soon');
      expect(text(soon)).toBe('Soon');
      expect(qa('[data-v4-item="id:atlassian"] [data-v4-trailing]').length).toBe(1);

      expect(trailing('id:overview')).toBeNull();
    });

    it('lets the --sd-sidebar-v4-attention token override the warning fallback', () => {
      applyTokens({ '--sd-sidebar-v4-attention': 'rgb(1, 2, 3)' });
      create();

      expect(getComputedStyle(q('[data-v4-item="id:approvals"] [data-v4-trailing]') as HTMLElement).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('keeps a comingSoon row an aria-disabled button whose activation does not navigate (AC-006)', () => {
      create();
      const navigate = jasmine.createSpy('navigate');
      fixture.componentInstance.navigate.subscribe(navigate);
      const soon = q<HTMLButtonElement>('[data-menu-key="id:atlassian"]') as HTMLButtonElement;

      // why: Enter/Space trên <button> gốc được trình duyệt chuyển thành click — click là đường kích hoạt duy nhất cần chặn.
      expect(soon.tagName).toBe('BUTTON');
      expect(soon.type).toBe('button');
      expect(soon.getAttribute('aria-disabled')).toBe('true');
      expect(getComputedStyle(soon).cursor).toBe('not-allowed');
      soon.click();
      expect(navigate).not.toHaveBeenCalled();
      expect(q('[data-pin-key="id:atlassian"]')).toBeNull();
    });

    it('lets comingSoon icons follow the disabled text colour on rows and on the rail', () => {
      applyTokens();
      const later: SdLayoutRootMenu = { id: 'later', title: 'Later', path: '/later', icon: 'schedule', permission: true, comingSoon: true };
      create({ menus: [overview, later] });

      const row = q('[data-menu-key="id:later"]') as HTMLElement;
      expect(getComputedStyle(row).color).toBe(TOKENS['--sd-disabled-text']);
      expect(getComputedStyle(row.querySelector('[data-menu-icon]') as HTMLElement).color).toBe(TOKENS['--sd-disabled-text']);
      expect(getComputedStyle(q('[data-menu-key="id:overview"] [data-menu-icon]') as HTMLElement).color).toBe(
        TOKENS['--sd-text-secondary']
      );

      create({ mode: 'collapsed', menus: [overview, later] });
      const navigate = jasmine.createSpy('navigate');
      fixture.componentInstance.navigate.subscribe(navigate);
      const railItem = q<HTMLButtonElement>('[data-v4-rail-item="id:later"]') as HTMLButtonElement;
      expect(railItem.getAttribute('aria-disabled')).toBe('true');
      expect(getComputedStyle(railItem.querySelector('[data-menu-icon]') as HTMLElement).color).toBe(TOKENS['--sd-disabled-text']);
      railItem.click();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('offers a labelled pin toggle on leaf rows only and never navigates from it', () => {
      create({ pinnedKeys: ['id:members'] });
      const navigate = jasmine.createSpy('navigate');
      const toggled: SdLayoutMenu[] = [];
      fixture.componentInstance.navigate.subscribe(navigate);
      fixture.componentInstance.togglePinned.subscribe(menu => toggled.push(menu));

      const pinned = q('[data-pin-key="id:members"]') as HTMLButtonElement;
      expect(pinned.tagName).toBe('BUTTON');
      expect(pinned.getAttribute('aria-pressed')).toBe('true');
      expect(pinned.getAttribute('aria-label')).toBe('Unpin Members & Roles');
      expect(text(pinned)).toBe('push_pin');
      const idle = q('[data-pin-key="id:overview"]') as HTMLButtonElement;
      expect(idle.getAttribute('aria-pressed')).toBe('false');
      expect(idle.getAttribute('aria-label')).toBe('Pin Overview');
      expect(q('[data-pin-key="id:settings"]')).toBeNull();

      idle.click();
      expect(toggled).toEqual([overview]);
      expect(navigate).not.toHaveBeenCalled();

      fixture.componentRef.setInput('showPin', false);
      fixture.detectChanges();
      expect(q('[data-pin-key]')).toBeNull();
    });

    it('sizes rows from the host variables, with 44px fallbacks in mobile mode', () => {
      create({ activePath: '/settings/members' });
      expect(getComputedStyle(q('[data-menu-key="id:overview"]') as HTMLElement).height).toBe('36px');
      expect(getComputedStyle(q('[data-menu-key="id:overview"]') as HTMLElement).borderRadius).toBe('999px');
      expect(getComputedStyle(q('[data-menu-key="id:members"]') as HTMLElement).height).toBe('32px');

      host.style.setProperty('--sd-sidebar-v4-item-height', '40px');
      host.style.setProperty('--sd-sidebar-v4-item-radius', '8px');
      expect(getComputedStyle(q('[data-menu-key="id:overview"]') as HTMLElement).height).toBe('40px');
      expect(getComputedStyle(q('[data-menu-key="id:overview"]') as HTMLElement).borderRadius).toBe('8px');

      create({ mode: 'mobile', activePath: '/settings/members' });
      expect(host.classList).toContain('sd-sidebar-v4-menu-tree--mobile');
      expect(getComputedStyle(q('[data-menu-key="id:overview"]') as HTMLElement).height).toBe('44px');
      expect(getComputedStyle(q('[data-menu-key="id:members"]') as HTMLElement).height).toBe('44px');
      expect(q('[data-menu-group="id:settings"]')).not.toBeNull();
    });
  });

  describe('shortcuts', () => {
    it('renders flat "title · path" rows without icons and unpins from the push_pin toggle (AC-007)', () => {
      create({ presentation: 'shortcuts', menus: [approvals, members], pathSource: menus, pinnedKeys: ['id:approvals', 'id:members'] });
      const navigated: SdLayoutRootMenu[] = [];
      const toggled: SdLayoutMenu[] = [];
      fixture.componentInstance.navigate.subscribe(menu => navigated.push(menu));
      fixture.componentInstance.togglePinned.subscribe(menu => toggled.push(menu));

      const rows = qa('[data-v4-row="shortcut"]');
      expect(rows.map(row => text(row))).toEqual(['Approvals · Execution', 'Members & Roles · Project Settings']);
      expect(getComputedStyle(rows[0].querySelector('[data-v4-shortcut-path]') as HTMLElement).fontSize).toBe('12px');
      expect(q('[data-menu-icon]')).toBeNull();
      expect(q('[data-v4-section-label]')).toBeNull();

      const unpin = q('[data-pin-key="id:members"]') as HTMLButtonElement;
      expect(unpin.getAttribute('aria-pressed')).toBe('true');
      expect(unpin.getAttribute('aria-label')).toBe('Unpin Members & Roles');
      expect(text(unpin)).toBe('push_pin');
      expect(unpin.querySelector('mat-icon')?.classList).toContain('material-icons');
      expect(unpin.querySelector('mat-icon')?.classList).not.toContain('material-icons-outlined');
      unpin.click();
      expect(toggled).toEqual([members]);
      expect(navigated).toEqual([]);

      rows[0].click();
      expect(navigated).toEqual([approvals]);

      fixture.componentRef.setInput('showPin', false);
      fixture.detectChanges();
      expect(q('[data-pin-key]')).toBeNull();
    });
  });

  describe('results', () => {
    it('announces the result count through a polite live region that stays mounted across presentations', () => {
      create();
      const live = q('[data-v4-live]') as HTMLElement;
      expect(live.getAttribute('aria-live')).toBe('polite');
      expect(live.getAttribute('aria-atomic')).toBe('true');
      expect(text(live)).toBe('');

      fixture.componentRef.setInput('presentation', 'results');
      fixture.componentRef.setInput('query', 'run');
      fixture.detectChanges();
      expect(q('[data-v4-live]')).toBe(live);
      expect(text(live)).toBe('2 results');

      fixture.componentRef.setInput('query', 'zzz');
      fixture.detectChanges();
      expect(text(live)).toBe('No menu matches “zzz”');

      fixture.componentRef.setInput('presentation', 'hierarchy');
      fixture.detectChanges();
      expect(q('[data-v4-live]')).toBe(live);
      expect(text(live)).toBe('');
    });

    it('renders the result count, the highlighted title, the parent path and the focused option (AC-004 rendering)', () => {
      create({ presentation: 'results', query: 'run', focusedIndex: 0 });
      const navigated: SdLayoutRootMenu[] = [];
      fixture.componentInstance.navigate.subscribe(menu => navigated.push(menu));

      expect(text(q('[data-v4-result-count]'))).toBe('2 results');
      expect(q('[data-v4-results]')?.getAttribute('role')).toBe('listbox');
      const rows = qa('[data-v4-result]');
      expect(fixture.componentInstance.results().map(result => result.menu)).toEqual([runs, runners]);
      expect(rows.length).toBe(2);
      expect(rows.map(row => row.getAttribute('role'))).toEqual(['option', 'option']);
      expect(rows.map(row => row.id)).toEqual([fixture.componentInstance.resultOptionId(0), fixture.componentInstance.resultOptionId(1)]);
      expect(rows.map(row => text(row.querySelector('[data-v4-match]')))).toEqual(['Run', 'Run']);
      expect(rows.map(row => text(row.querySelector('[data-v4-result-path]')))).toEqual(['Execution', 'Project Settings / Advanced']);
      expect(rows.map(row => row.getAttribute('aria-selected'))).toEqual(['true', 'false']);
      expect(rows[0].classList).toContain('sd-sidebar-v4-menu-tree__result--focused');
      expect(q('[data-menu-icon]')).toBeNull();
      expect(text(q('[data-v4-search-hint]'))).toContain('Enter');

      fixture.componentRef.setInput('focusedIndex', 1);
      fixture.detectChanges();
      expect(rows.map(row => row.getAttribute('aria-selected'))).toEqual(['false', 'true']);

      rows[1].click();
      expect(navigated).toEqual([runners]);
    });

    it('highlights accent-insensitively and renders the empty state', () => {
      create({ presentation: 'results', query: 'tro' });
      expect(text(q('[data-v4-result] [data-v4-match]'))).toBe('Trợ');

      fixture.componentRef.setInput('query', 'zzz');
      fixture.detectChanges();
      expect(text(q('[data-v4-result-count]'))).toBe('0 results');
      expect(q('[data-v4-result]')).toBeNull();
      expect(text(q('[data-v4-empty]'))).toBe('No menu matches “zzz”');

      fixture.componentRef.setInput('query', '   ');
      fixture.detectChanges();
      expect(q('[data-v4-result-count]')).toBeNull();
      expect(q('[data-v4-empty]')).toBeNull();
    });

    it('keeps result options at least 44px tall under a coarse pointer', () => {
      // Kết quả không có path (một dòng) — chiều cao chỉ đến từ min-height.
      create({ presentation: 'results', query: 'tro' });
      const option = q('[data-v4-result]') as HTMLElement;
      expect(option.querySelector('[data-v4-result-path]')).toBeNull();

      simulateCoarsePointer(option);

      expect(parseFloat(getComputedStyle(option).height)).toBeGreaterThanOrEqual(44);
    });

    it('never turns a title or a query into markup', () => {
      const markup: SdLayoutRootMenu = { id: 'markup', title: 'Use <b>bold</b> tags', path: '/markup', permission: true };
      create({ presentation: 'results', menus: [markup], query: '<b>bold' });

      const row = q('[data-v4-result]') as HTMLElement;
      expect(row.querySelector('b')).toBeNull();
      expect(text(row.querySelector('.sd-sidebar-v4-menu-tree__result-title'))).toBe('Use <b>bold</b> tags');
      expect(row.querySelector('[data-v4-match]')).not.toBeNull();

      fixture.componentRef.setInput('query', '<b>zz</b>');
      fixture.detectChanges();
      expect(host.querySelector('b')).toBeNull();
      expect(text(q('[data-v4-empty]'))).toBe('No menu matches “<b>zz</b>”');
    });
  });

  describe('collapsed rail', () => {
    it('renders icon-only rail items with separators between sections, mini badges and tooltips (AC-005)', () => {
      applyTokens();
      create({ mode: 'collapsed', activePath: '/settings/members' });

      expect(host.classList).toContain('sd-sidebar-v4-menu-tree--collapsed');
      expect(q('[data-v4-section-label]')).toBeNull();
      expect(q('[data-v4-row="child"]')).toBeNull();
      const rail = q('[data-v4-rail]') as HTMLElement;
      const sequence = Array.from(rail.children).map(element =>
        element.hasAttribute('data-v4-rail-separator')
          ? '|'
          : element.querySelector('[data-v4-rail-item]')?.getAttribute('data-v4-rail-item')
      );
      expect(sequence).toEqual([
        'id:overview',
        '|',
        'id:stories',
        '|',
        'id:runs',
        'id:approvals',
        'id:incidents',
        '|',
        'id:integrations',
        'id:settings',
        '|',
        'id:help',
      ]);
      const separator = getComputedStyle(q('[data-v4-rail-separator]') as HTMLElement);
      expect([separator.width, separator.height, separator.marginTop, separator.marginBottom]).toEqual(['32px', '1px', '5px', '5px']);

      const item = q('[data-v4-rail-item="id:approvals"]') as HTMLButtonElement;
      expect(item.tagName).toBe('BUTTON');
      expect(item.getAttribute('title')).toBe('Approvals');
      expect(item.getAttribute('aria-label')).toBe('Approvals');
      expect([getComputedStyle(item).width, getComputedStyle(item).height]).toEqual(['48px', '36px']);
      expect(item.querySelector('[data-menu-icon]')).not.toBeNull();
      expect(text(item)).not.toContain('Approvals');

      const badge = q('[data-v4-rail-cell="id:approvals"] [data-v4-rail-badge]') as HTMLElement;
      expect(text(badge)).toBe('3');
      const mini = getComputedStyle(badge);
      expect([mini.top, mini.right, mini.height, mini.borderRadius, mini.fontSize]).toEqual(['0px', '2px', '16px', '8px', '10px']);
      expect(mini.backgroundColor).toBe(TOKENS['--sd-warning']);
      expect(q('[data-v4-rail-cell="id:stories"] [data-v4-rail-badge]')).toBeNull();
      const live = q('[data-v4-rail-cell="id:runs"] [data-v4-rail-live]') as HTMLElement;
      expect(live).not.toBeNull();
      expect([getComputedStyle(live).top, getComputedStyle(live).right, getComputedStyle(live).width]).toEqual(['5px', '9px', '8px']);

      const activeGroup = q('[data-v4-rail-item="id:settings"]') as HTMLElement;
      expect(activeGroup.classList).toContain('sd-sidebar-v4-menu-tree__rail-item--active');
      expect(activeGroup.querySelector('[data-menu-icon] mat-icon')?.classList).not.toContain('material-icons-outlined');
    });

    it('navigates from a leaf rail item', () => {
      create({ mode: 'collapsed' });
      const navigated: SdLayoutRootMenu[] = [];
      fixture.componentInstance.navigate.subscribe(menu => navigated.push(menu));

      q('[data-v4-rail-item="id:overview"]')?.click();

      expect(navigated).toEqual([overview]);
    });

    it('opens a flyout with the group children and closes it on Escape with focus back on the group (AC-005)', () => {
      create({ mode: 'collapsed', activePath: '/settings/members' });
      const group = q<HTMLButtonElement>('[data-v4-rail-item="id:settings"]') as HTMLButtonElement;
      expect(group.getAttribute('aria-expanded')).toBe('false');
      expect(group.getAttribute('aria-haspopup')).toBe('dialog');

      group.click();
      fixture.detectChanges();
      const panel = overlayRoot().querySelector<HTMLElement>('[data-v4-flyout]') as HTMLElement;
      expect(panel).not.toBeNull();
      expect(group.getAttribute('aria-expanded')).toBe('true');
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
      expect(panel.getAttribute('aria-label')).toBe('Project Settings');
      expect(text(panel.querySelector('[data-v4-flyout-title]'))).toBe('Project Settings');
      expect(Array.from(panel.querySelectorAll('[data-v4-flyout-item]')).map(row => text(row))).toEqual([
        'Members & Roles',
        'AI Providers & Models',
        'Cloud Runners',
      ]);
      expect(text(panel.querySelector('[data-v4-flyout-heading]'))).toBe('Advanced');
      expect(panel.querySelector('[data-v4-flyout-item="id:members"]')?.getAttribute('aria-current')).toBe('page');
      const surface = getComputedStyle(panel);
      expect([surface.width, surface.borderTopLeftRadius, surface.paddingTop]).toEqual(['232px', '16px', '8px']);
      expect(getComputedStyle(panel.querySelector('[data-v4-flyout-item]') as HTMLElement).height).toBe('32px');
      expect(document.activeElement).toBe(panel.querySelector('[data-v4-flyout-item="id:members"]'));

      // Esc chỉ đóng flyout: handler Esc của lớp ngoài (xoá search, đóng drawer) không được nhận sự kiện.
      const outerEscape = jasmine.createSpy('outer escape');
      document.addEventListener('keydown', outerEscape);
      try {
        (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();
      } finally {
        document.removeEventListener('keydown', outerEscape);
      }
      expect(outerEscape).not.toHaveBeenCalled();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
      expect(group.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(group);
    });

    it('closes the flyout after navigating from it and on an outside click, with focus back on the group (AC-005)', () => {
      create({ mode: 'collapsed', activePath: '/settings/members' });
      const navigated: SdLayoutRootMenu[] = [];
      fixture.componentInstance.navigate.subscribe(menu => navigated.push(menu));
      const group = q<HTMLButtonElement>('[data-v4-rail-item="id:settings"]') as HTMLButtonElement;

      group.click();
      fixture.detectChanges();
      overlayRoot().querySelector<HTMLElement>('[data-v4-flyout-item="id:models"]')?.click();
      fixture.detectChanges();
      expect(navigated).toEqual([models]);
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
      expect(document.activeElement).toBe(group);

      group.focus();
      group.click();
      fixture.detectChanges();
      const panel = overlayRoot().querySelector('[data-v4-flyout]') as HTMLElement;
      expect(panel.contains(document.activeElement)).toBeTrue();
      expect(overlayRoot().querySelector('.cdk-overlay-backdrop')).toBeNull();
      // Click lên vùng không nhận focus: focus vẫn ở trong panel nên được trả về nút group.
      document.body.click();
      fixture.detectChanges();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
      expect(group.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(group);
    });

    it('leaves focus on an outside input clicked while the flyout is open', () => {
      create({ mode: 'collapsed' });
      const input = document.createElement('input');
      document.body.appendChild(input);
      try {
        const group = q<HTMLButtonElement>('[data-v4-rail-item="id:settings"]') as HTMLButtonElement;
        group.focus();
        group.click();
        fixture.detectChanges();
        expect((overlayRoot().querySelector('[data-v4-flyout]') as HTMLElement).contains(document.activeElement)).toBeTrue();

        input.focus();
        input.click();
        fixture.detectChanges();

        expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
        expect(document.activeElement).toBe(input);
      } finally {
        input.remove();
      }
    });

    it('returns focus to the last opened group after switching flyouts and pressing Escape', () => {
      create({ mode: 'collapsed' });
      // A đứng trước B trong rail: nếu panel A còn tự trả focus khi bị huỷ, focus sẽ kết thúc ở A.
      const first = q<HTMLButtonElement>('[data-v4-rail-item="id:integrations"]') as HTMLButtonElement;
      const second = q<HTMLButtonElement>('[data-v4-rail-item="id:settings"]') as HTMLButtonElement;

      first.focus();
      first.click();
      fixture.detectChanges();
      second.focus();
      second.click();
      fixture.detectChanges();
      const panel = overlayRoot().querySelector('[data-v4-flyout]') as HTMLElement;
      expect(text(panel.querySelector('[data-v4-flyout-title]'))).toBe('Project Settings');
      expect(panel.contains(document.activeElement)).toBeTrue();

      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
      expect(document.activeElement).toBe(second);
    });

    it('closes the flyout without moving focus when the route changes elsewhere or its group disappears', () => {
      create({ mode: 'collapsed' });
      const group = (): HTMLButtonElement => q<HTMLButtonElement>('[data-v4-rail-item="id:settings"]') as HTMLButtonElement;

      group().click();
      fixture.detectChanges();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).not.toBeNull();
      fixture.componentRef.setInput('activePath', '/overview');
      fixture.detectChanges();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
      expect(group().getAttribute('aria-expanded')).toBe('false');

      group().click();
      fixture.detectChanges();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).not.toBeNull();
      fixture.componentRef.setInput(
        'menus',
        menus.filter(menu => menu !== settings)
      );
      fixture.detectChanges();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();

      // key cũ đã bị xoá: thêm lại group không tự mở lại flyout
      fixture.componentRef.setInput('menus', menus);
      fixture.detectChanges();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
      expect(group().getAttribute('aria-expanded')).toBe('false');
    });

    it('marks a nested comingSoon group in the flyout with the Soon chip and disabled styling', () => {
      applyTokens();
      const beta: SdLayoutChildrenMenu = {
        id: 'beta',
        title: 'Beta',
        comingSoon: true,
        children: [{ id: 'beta-x', title: 'Beta X', path: '/beta/x', permission: true }],
      };
      create({ mode: 'collapsed', menus: [{ ...settings, children: [members, beta] }] });

      q('[data-v4-rail-item="id:settings"]')?.click();
      fixture.detectChanges();
      const heading = overlayRoot().querySelector<HTMLElement>('[data-v4-flyout-heading]') as HTMLElement;
      expect(text(heading.querySelector('.sd-sidebar-v4-menu-tree__label'))).toBe('Beta');
      expect(text(heading.querySelector('[data-v4-trailing="soon"]'))).toBe('Soon');
      expect(heading.classList).toContain('sd-sidebar-v4-menu-tree__flyout-heading--disabled');
      expect(getComputedStyle(heading).color).toBe(TOKENS['--sd-disabled-text']);
      expect(overlayRoot().querySelector('[data-v4-flyout-item="id:beta-x"]')).toBeNull();
    });

    it('lets an outside click on another rail group switch the flyout, and a second click on the same group close it', () => {
      create({ mode: 'collapsed' });
      const flyoutTitles = (): string[] => Array.from(overlayRoot().querySelectorAll('[data-v4-flyout-title]')).map(title => text(title));

      q('[data-v4-rail-item="id:settings"]')?.click();
      fixture.detectChanges();
      expect(flyoutTitles()).toEqual(['Project Settings']);

      const integrationsGroup = q('[data-v4-rail-item="id:integrations"]') as HTMLButtonElement;
      integrationsGroup.click();
      fixture.detectChanges();
      expect(flyoutTitles()).toEqual(['Integrations']);
      expect(q('[data-v4-rail-item="id:settings"]')?.getAttribute('aria-expanded')).toBe('false');
      expect(integrationsGroup.getAttribute('aria-expanded')).toBe('true');

      integrationsGroup.click();
      fixture.detectChanges();
      expect(flyoutTitles()).toEqual([]);
    });

    it('keeps flyout rows at least 44px tall under a coarse pointer, outside the host size variables', () => {
      create({ mode: 'collapsed' });
      q('[data-v4-rail-item="id:settings"]')?.click();
      fixture.detectChanges();
      const row = overlayRoot().querySelector<HTMLElement>('[data-v4-flyout-item="id:members"]') as HTMLElement;

      simulateCoarsePointer(row);

      expect(row.style.minHeight).not.toBe('');
      expect(getComputedStyle(row).minHeight).not.toBe('auto');
      expect(parseFloat(getComputedStyle(row).height)).toBeGreaterThanOrEqual(44);
    });

    it('keeps a comingSoon flyout row inert', () => {
      create({ mode: 'collapsed' });
      const navigate = jasmine.createSpy('navigate');
      fixture.componentInstance.navigate.subscribe(navigate);

      q('[data-v4-rail-item="id:integrations"]')?.click();
      fixture.detectChanges();
      const soon = overlayRoot().querySelector<HTMLElement>('[data-v4-flyout-item="id:atlassian"]') as HTMLElement;
      expect(soon.getAttribute('aria-disabled')).toBe('true');
      expect(text(soon.querySelector('[data-v4-trailing="soon"]'))).toBe('Soon');
      soon.click();
      fixture.detectChanges();
      expect(navigate).not.toHaveBeenCalled();
      expect(overlayRoot().querySelector('[data-v4-flyout]')).not.toBeNull();
    });

    it("emits expandGroup instead of opening a flyout when collapsedGroup is 'expand' (AC-005)", () => {
      create({ mode: 'collapsed', collapsedGroup: 'expand' });
      const expanded: SdLayoutMenu[] = [];
      fixture.componentInstance.expandGroup.subscribe(menu => expanded.push(menu));
      const group = q('[data-v4-rail-item="id:settings"]') as HTMLButtonElement;
      expect(group.getAttribute('aria-haspopup')).toBeNull();

      group.click();
      fixture.detectChanges();

      expect(expanded).toEqual([settings]);
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
    });
  });
});

describe('buildSidebarV4SearchResults', () => {
  it('leaves out comingSoon items and joins ancestor titles into the parent path', () => {
    const results = buildSidebarV4SearchResults(menus, 'a');
    const pathOf = (id: string): string | undefined => results.find(result => result.menu.id === id)?.path;

    expect(results.some(result => result.menu.id === 'atlassian')).toBeFalse();
    expect(buildSidebarV4SearchResults(menus, 'git').map(result => [result.menu, result.path])).toEqual([[github, 'Integrations']]);
    expect(pathOf('runs')).toBe('Execution');
    expect(pathOf('models')).toBe('Project Settings');
    expect(buildSidebarV4SearchResults(menus, 'cloud').map(result => [result.menu, result.path, result.key])).toEqual([
      [runners, 'Project Settings / Advanced', 'id:runners'],
    ]);
    expect(buildSidebarV4SearchResults(menus, 'help').length).toBe(0);
    expect(buildSidebarV4SearchResults(menus, 'giup').map(result => [result.menu, result.path])).toEqual([[help, '']]);
  });

  it('returns no rows for a blank query', () => {
    expect(buildSidebarV4SearchResults(menus, '')).toEqual([]);
    expect(buildSidebarV4SearchResults(menus, '   ')).toEqual([]);
  });
});
