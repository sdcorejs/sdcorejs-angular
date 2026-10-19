import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injectable,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import {
  ISdLayoutConfiguration,
  ISdSidebarConfiguration,
  MenuPipe,
  SD_LAYOUT_CONFIGURATION,
  SD_LAYOUT_CONTEXT_RUNTIME,
  SD_LAYOUT_STORAGE_NAMESPACE,
  SD_LAYOUT_VIEWPORT,
  SdLayoutComponent,
  SdLayoutContextConfiguration,
  SdLayoutContextRuntime,
  SdLayoutContextService,
  SdLayoutMenu,
  SdLayoutNavigationStateService,
  SdLayoutResponsiveService,
  SdLayoutService,
  SdLayoutStorageService,
  SdLayoutViewport,
} from '@sdcorejs/angular/modules/layout';
import { SD_PERMISSION_CONFIGURATION, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

type LayoutDemoVersion = 1 | 2 | 3 | 4;
type LayoutDemoViewportMode = 'desktop' | 'mobile';

export const LAYOUT_DEMO_NOTIFICATION_COUNT = signal(6);

/** One context list shared by every sidebar version; more than 7 items turns the switcher search on. */
export const LAYOUT_DEMO_CONTEXT: SdLayoutContextConfiguration = {
  label: 'Project',
  items: [
    { id: 'hcm-operations', title: 'Hồ Chí Minh Operations', subtitle: 'Retail network · 42 stores' },
    { id: 'hanoi-operations', title: 'Hà Nội Operations', subtitle: 'Retail network · 31 stores' },
    { id: 'da-nang-hub', title: 'Đà Nẵng Hub', subtitle: 'Distribution center' },
    { id: 'can-tho-hub', title: 'Cần Thơ Hub', subtitle: 'Distribution center' },
    { id: 'e-commerce', title: 'E-commerce', subtitle: 'Online channel' },
    { id: 'loyalty', title: 'Loyalty Program', subtitle: 'Members & rewards' },
    { id: 'finance', title: 'Finance Shared Services', subtitle: 'Back office' },
    { id: 'pilot-lab', title: 'Pilot Lab', subtitle: 'Sandbox project' },
  ],
};

const LAYOUT_DEMO_TRANSLATIONS: Readonly<Record<string, string>> = {
  'core.common.close': 'Close',
  'core.common.reload': 'Reload page',
  'core.module.layout.sidebar.search': 'Search menu',
  'core.module.layout.sidebar.more-menu': 'More menu',
  'core.module.layout.sidebar.more': 'More',
  'core.module.layout.sidebar.all-menu': 'All menus',
  'core.module.layout.sidebar.pinned': 'Pinned',
  'core.module.layout.sidebar.recent': 'Recent',
  'core.module.layout.sidebar.v4-search-placeholder': 'Search menu',
  'core.module.layout.sidebar.clear-search': 'Clear search',
  'core.module.layout.sidebar.result-count': '{count} results',
  'core.module.layout.sidebar.no-match': 'No menu matches “{query}”',
  'core.module.layout.sidebar.search-hint': '↑ ↓ move · Enter open · Esc clear',
  'core.module.layout.sidebar.coming-soon': 'Soon',
  'core.module.layout.sidebar.badge-pending': '{count} pending',
  'core.module.layout.sidebar.expand': 'Expand sidebar',
  'core.module.layout.sidebar.collapse': 'Collapse sidebar',
  'core.module.layout.sidebar.open-menu': 'Open menu',
  'core.module.layout.sidebar.close-menu': 'Close menu',
  'core.module.layout.sidebar.primary-nav': 'Primary navigation',
  'core.module.layout.sidebar.toggle': 'Toggle sidebar',
  'core.module.layout.sidebar.menu-groups': 'Menu groups',
  'core.module.layout.sidebar.search-in-group': 'Search this group',
  'core.module.layout.sidebar.search-in-menu': 'Search menus',
  'core.module.layout.home.tab-name': 'Home',
  'core.module.layout.menu.pin': 'Pin {title}',
  'core.module.layout.menu.unpin': 'Unpin {title}',
  'core.module.layout.context.default-label': 'Context',
  'core.module.layout.context.trigger': 'Change {label}',
  'core.module.layout.context.search-placeholder': 'Search {label}',
  'core.module.layout.context.choose-title': 'Choose {label}',
  'core.module.layout.context.switching': 'Switching…',
  'core.module.layout.context.switch-failed': 'Could not switch. Please try again.',
  'core.module.layout.context.changed-elsewhere': 'Context changed in another tab',
  'core.module.layout.user.update-profile': 'Update profile',
  'core.module.layout.user.setting': 'Settings',
  'core.module.layout.user.notification': 'Notifications',
  'core.module.layout.user.change-password': 'Change password',
  'core.module.layout.user.logout': 'Sign out',
};

/** Same placeholder rule as I18nService: `{name}` is replaced when `params` has it, otherwise kept. */
function translateLayoutDemo(key: string, params?: Record<string, unknown>): string {
  return (LAYOUT_DEMO_TRANSLATIONS[key] ?? key).replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    params && name in params ? String(params[name]) : placeholder
  );
}

const SIDEBAR_CONFIGURATIONS: Readonly<Record<LayoutDemoVersion, ISdSidebarConfiguration>> = {
  1: {
    version: 1,
    defaultTitle: 'Operations Portal',
    pin: { enabled: true },
    context: LAYOUT_DEMO_CONTEXT,
  },
  2: {
    version: 2,
    interaction: 'click',
    primaryMenuIds: ['workspace', 'insights', 'settings'],
    pin: { enabled: true },
    context: LAYOUT_DEMO_CONTEXT,
  },
  3: {
    version: 3,
    defaultTitle: 'Operations Portal',
    defaultCollapsed: false,
    recent: { enabled: true, maxItems: 5 },
    pin: { enabled: true },
    context: LAYOUT_DEMO_CONTEXT,
  },
  4: {
    version: 4,
    defaultTitle: 'Operations Portal',
    recent: { enabled: true, maxItems: 5 },
    pin: { enabled: true },
    mobile: { bottomBar: ['overview', 'approvals', 'inbox', 'activity'] },
    context: LAYOUT_DEMO_CONTEXT,
  },
};

const DEMO_CONFIGURATION: ISdLayoutConfiguration = {
  mobileBreakpoint: 900,
  sidebar: SIDEBAR_CONFIGURATIONS[1],
  userInfo: {
    fullName: 'Nguyen Minh Anh',
    username: 'minhanh',
    email: 'minhanh@example.com',
    role: {
      text: 'Product Owner',
      icon: 'badge',
      color: '#005cbb',
    },
  },
  signout: () => undefined,
  changePassword: () => undefined,
  updateProfile: () => undefined,
  setting: () => undefined,
  notification: {
    count: LAYOUT_DEMO_NOTIFICATION_COUNT,
    action: () => undefined,
  },
};

class LayoutDemoViewport implements SdLayoutViewport {
  innerWidth = 1280;
  readonly #resizeListeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void {
    if (type === 'resize') this.#resizeListeners.add(listener);
  }

  removeEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void {
    if (type === 'resize') this.#resizeListeners.delete(listener);
  }

  resizeTo(width: number): void {
    this.innerWidth = width;
    const event = new Event('resize');
    for (const listener of this.#resizeListeners) {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  }
}

/**
 * Showcase-only context runtime (INV-010): nothing reloads for real. A requested reload counts up so the preview
 * rebuilds its context scope, as the page would after reloading. `storage` events come from the browser, so a switch
 * in another tab still raises the "changed in another tab" notice; the per-tab marker lives in memory.
 */
@Injectable()
class LayoutDemoContextRuntime implements SdLayoutContextRuntime {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #reloads = signal(0);
  readonly #requestedReload = signal(0);
  #context?: SdLayoutContextService;
  #marker: string | null = null;

  /** Number of page reloads Core requested from this preview. */
  readonly reloads = this.#reloads.asReadonly();
  /** The last reload a person asked for (a context switch or "Reload page"); `0` while there was none. */
  readonly requestedReload = this.#requestedReload.asReadonly();

  /** Connects the context service of the current preview generation. */
  attach(context: SdLayoutContextService): void {
    this.#context = context;
  }

  reload(): void {
    // why: reload đối chiếu lúc chưa có context lưu (lần đầu mở trang) không do người dùng — dựng lại im lặng;
    // chỉ lần chuyển context hoặc bấm "Tải lại" sau khi tab khác đổi context mới hiện thông báo demo.
    const context = this.#context;
    const requestedByUser = !!context && (context.switchingId() !== null || context.changedElsewhere());
    const reload = this.#reloads() + 1;
    this.#reloads.set(reload);
    if (requestedByUser) this.#requestedReload.set(reload);
  }

  onStorage(listener: () => void): () => void {
    const view = this.#view;
    if (!view) return () => undefined;
    const handler = (): void => listener();
    view.addEventListener('storage', handler);
    return () => view.removeEventListener('storage', handler);
  }

  readMarker(): string | null {
    return this.#marker;
  }

  writeMarker(value: string | null): boolean {
    this.#marker = value;
    return true;
  }
}

/** Gives each preview generation its own SdLayoutContextService, so rebuilding the scope stands in for a page reload. */
@Directive({
  selector: '[appLayoutDemoContextScope]',
  standalone: true,
  providers: [SdLayoutContextService],
})
class LayoutDemoContextScopeDirective {
  constructor() {
    inject(LayoutDemoContextRuntime).attach(inject(SdLayoutContextService));
  }
}

@Component({
  selector: 'app-layout-version-preview',
  standalone: true,
  imports: [SdLayoutComponent, LayoutDemoContextScopeDirective],
  providers: [
    LayoutDemoViewport,
    LayoutDemoContextRuntime,
    SdViewportService,
    MenuPipe,
    SdPermissionService,
    SdLayoutService,
    SdLayoutResponsiveService,
    SdLayoutStorageService,
    SdLayoutNavigationStateService,
    { provide: I18nService, useValue: { t: translateLayoutDemo } },
    { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } },
    { provide: SD_LAYOUT_CONFIGURATION, useValue: DEMO_CONFIGURATION },
    { provide: SD_LAYOUT_VIEWPORT, useExisting: LayoutDemoViewport },
    { provide: SD_LAYOUT_CONTEXT_RUNTIME, useExisting: LayoutDemoContextRuntime },
    // Each preview keeps its own context, pinned, recent and collapse state, apart from other previews and apps on this origin.
    {
      provide: SD_LAYOUT_STORAGE_NAMESPACE,
      useFactory: () => {
        const preview = inject(LayoutVersionPreviewComponent);
        return () => preview.storageNamespace();
      },
    },
  ],
  template: `
    <fieldset class="layout-demo__viewport-controls">
      <legend>Preview viewport</legend>
      @for (option of viewportOptions; track option.value) {
        <button
          type="button"
          [attr.data-layout-viewport]="option.value"
          [attr.aria-pressed]="selectedViewport() === option.value"
          (click)="selectViewport(option.value)">
          {{ option.label }}
        </button>
      }
    </fieldset>

    <div class="layout-demo__reload-status" role="status">
      @if (showReloadNotice()) {
        <p class="layout-demo__reload-notice" data-layout-demo-reload-notice tabindex="-1">
          <span>Demo: Core requested a page reload to apply the project. This preview restarted instead of reloading the page.</span>
          <button type="button" (click)="dismissReloadNotice()">Dismiss</button>
        </p>
      }
    </div>

    <div
      class="layout-demo__preview"
      [class.layout-demo__preview--mobile]="selectedViewport() === 'mobile'"
      [class.layout-demo__preview--contain-v1]="version() === 1"
      [attr.data-active-layout-version]="version()"
      [attr.data-active-layout-viewport]="selectedViewport()">
      @for (scope of contextScopes(); track scope.generation) {
        <ng-container appLayoutDemoContextScope>
          <sd-layout [menus]="menus()">
            <main class="layout-demo__content">
              <span class="layout-demo__eyebrow">V{{ version() }} live fixture</span>
              <h4>Operations overview</h4>
              <p>The page content stays mounted while this showcase switches between desktop and mobile.</p>
              <div class="layout-demo__metrics" aria-label="Example summary">
                <span><strong>24</strong> open tasks</span>
                <span><strong>8</strong> approvals</span>
                <span><strong>5</strong> reports</span>
              </div>
            </main>
          </sd-layout>
        </ng-container>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .layout-demo__viewport-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        width: fit-content;
        min-width: 0;
        margin: 0;
        padding: 8px;
        border: 1px solid var(--docs-border-color, #e6e6e6);
        border-radius: 8px;
      }

      legend {
        padding: 0 4px;
        color: var(--docs-text-secondary, #4a4a4a);
        font-size: 12px;
        font-weight: 600;
      }

      button {
        min-height: 36px;
        padding: 6px 12px;
        border: 1px solid var(--docs-border-color, #d1d5db);
        border-radius: 6px;
        background: var(--docs-surface-raised, #ffffff);
        color: var(--docs-text, #1f2937);
        cursor: pointer;
      }

      button[aria-pressed='true'] {
        border-color: var(--sd-primary, #005cbb);
        background: var(--sd-primary, #005cbb);
        color: #ffffff;
      }

      button:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--sd-primary, #005cbb) 35%, transparent);
        outline-offset: 2px;
      }

      /* why: transform establishes a containing block so fixed production sidebars remain inside the live documentation fixture. */
      .layout-demo__preview {
        position: relative;
        width: min(100%, 1120px);
        height: 620px;
        margin-top: 16px;
        overflow: hidden;
        border: 1px solid var(--docs-border-color, #d1d5db);
        border-radius: 12px;
        background: var(--docs-surface-muted, #f3f5f8);
        box-shadow: 0 16px 40px rgb(15 23 42 / 12%);
        transform: translateZ(0);
        transition: width 180ms ease;
      }

      .layout-demo__preview--mobile {
        width: min(100%, 390px);
      }

      /* Keep the desktop V3 shell inside this transformed fixture: a viewport-sized inner shell can scroll the clipped preview when a deep link receives keyboard focus. */
      :host ::ng-deep .layout-demo__preview sd-sidebar-v3,
      :host ::ng-deep .layout-demo__preview .sd-sidebar-v3,
      :host ::ng-deep .layout-demo__preview .sd-sidebar-v3__content {
        display: block;
        height: 100%;
        min-height: 0;
      }

      :host ::ng-deep .layout-demo__preview:has(sd-sidebar-v3) sd-layout {
        height: 100%;
      }

      /* Same containment for desktop V4: its fixed drawer already resolves against the transformed preview; the host and content must not keep their 100vh minimum. */
      :host ::ng-deep .layout-demo__preview sd-sidebar-v4,
      :host ::ng-deep .layout-demo__preview .sd-sidebar-v4__content {
        display: block;
        height: 100%;
        min-height: 0;
      }

      :host ::ng-deep .layout-demo__preview .sd-sidebar-v4__content {
        overflow: auto;
      }

      :host ::ng-deep .layout-demo__preview:has(sd-sidebar-v4) sd-layout {
        height: 100%;
      }

      .layout-demo__reload-notice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
        width: min(100%, 1120px);
        margin: 12px 0 0;
        padding: 10px 12px;
        border: 1px solid var(--sd-border, #d1d5db);
        border-radius: 8px;
        background: var(--sd-surface-muted, #f3f5f8);
        color: var(--docs-text, #1f2937);
        font-size: 13px;
        line-height: 1.5;
      }

      .layout-demo__reload-notice span {
        flex: 1 1 240px;
      }

      /* why: V1 normally follows the browser viewport; constrain its legacy 100vh shell to the live preview so the account footer stays visible. */
      :host ::ng-deep .layout-demo__preview--contain-v1 sd-layout,
      :host ::ng-deep .layout-demo__preview--contain-v1 sidebar-v1,
      :host ::ng-deep .layout-demo__preview--contain-v1 sidebar {
        display: block;
        height: 100%;
        min-height: 0;
      }

      :host ::ng-deep .layout-demo__preview--contain-v1 .c-layout-wrapper,
      :host ::ng-deep .layout-demo__preview--contain-v1 .c-layout-sidebar,
      :host ::ng-deep .layout-demo__preview--contain-v1 .c-layout-content {
        height: 100% !important;
        max-height: 100% !important;
      }

      :host ::ng-deep .layout-demo__preview--contain-v1 .c-vertical {
        height: 100%;
      }

      .layout-demo__content {
        min-height: 100%;
        padding: 48px;
        background: linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(238 245 255 / 96%)), var(--docs-surface-raised, #ffffff);
      }

      .layout-demo__eyebrow {
        color: var(--sd-primary, #005cbb);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h4 {
        margin: 8px 0;
        color: var(--docs-text, #1f2937);
        font-size: 24px;
      }

      p {
        max-width: 520px;
        margin: 0;
        color: var(--docs-text-secondary, #4a4a4a);
        line-height: 1.6;
      }

      .layout-demo__metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }

      .layout-demo__metrics span {
        display: grid;
        gap: 4px;
        min-width: 112px;
        padding: 14px;
        border: 1px solid rgb(148 163 184 / 35%);
        border-radius: 10px;
        background: rgb(255 255 255 / 78%);
        color: var(--docs-text-secondary, #4a4a4a);
        font-size: 12px;
      }

      .layout-demo__metrics strong {
        color: var(--docs-text, #1f2937);
        font-size: 22px;
      }

      @media (prefers-reduced-motion: reduce) {
        .layout-demo__preview {
          transition: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutVersionPreviewComponent {
  readonly #layoutService = inject(SdLayoutService);
  readonly #viewport = inject(LayoutDemoViewport);
  readonly #contextRuntime = inject(LayoutDemoContextRuntime);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #dismissedReload = signal(0);

  version = input.required<LayoutDemoVersion>();
  /** `SD_LAYOUT_STORAGE_NAMESPACE` of this preview. */
  storageNamespace = input.required<string>();
  menus = input<SdLayoutMenu[]>([]);
  readonly selectedViewport = signal<LayoutDemoViewportMode>('desktop');
  readonly viewportOptions = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ] as const;
  // why: một phần tử, khoá theo số lần reload — mỗi lần "reload" giả đổi khoá nên khối layout được dựng lại từ đầu.
  protected readonly contextScopes = computed(() => [{ generation: this.#contextRuntime.reloads() }]);
  protected readonly showReloadNotice = computed(() => this.#contextRuntime.requestedReload() > this.#dismissedReload());

  constructor() {
    effect(() => this.#layoutService.sidebar.set(SIDEBAR_CONFIGURATIONS[this.version()]));
    // why (a11y): dựng lại preview xoá trigger đang giữ focus — đưa focus về switcher mới thay vì rơi về <body>.
    effect(() => {
      if (!this.#contextRuntime.requestedReload()) return;
      untracked(() => afterNextRender(() => this.#focusAfterRestart(), { injector: this.#injector }));
    });
  }

  selectViewport(viewport: LayoutDemoViewportMode): void {
    this.selectedViewport.set(viewport);
    this.#viewport.resizeTo(viewport === 'mobile' ? 390 : 1280);
  }

  dismissReloadNotice(): void {
    this.#dismissedReload.set(this.#contextRuntime.requestedReload());
    // why (a11y): nút Dismiss biến mất cùng thông báo — trả focus về switcher (hoặc nút viewport) của preview.
    afterNextRender(
      () => (this.#contextTrigger() ?? this.#host.nativeElement.querySelector<HTMLElement>('[data-layout-viewport]'))?.focus(),
      { injector: this.#injector }
    );
  }

  #focusAfterRestart(): void {
    const target = this.#contextTrigger() ?? this.#host.nativeElement.querySelector<HTMLElement>('[data-layout-demo-reload-notice]');
    target?.focus();
  }

  /** Switcher trigger of the current preview; `null` when it sits in a closed mobile drawer or sheet. */
  #contextTrigger(): HTMLElement | null {
    return this.#host.nativeElement.querySelector<HTMLElement>('.layout-demo__preview sd-layout-context-switcher [data-context-trigger]');
  }
}

@Component({
  selector: 'app-layout-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, LayoutVersionPreviewComponent],
  template: `
    <demo-page
      #demoPage
      title="Layout"
      description="Review each responsive sidebar version in an independent live showcase using the same rich menu fixture.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v1-classic') {
        <demo-section
          data-layout-showcase="1"
          heading="Sidebar V1 - Classic"
          note="Desktop rail with expand/collapse, menu search after more than 10 items, and the default SDCoreJS logo."
          [props]="[
            { name: 'version', value: '1' },
            { name: 'context.label', value: 'Project' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="1" storageNamespace="showcase-layout-v1" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v2-rail') {
        <demo-section
          data-layout-showcase="2"
          heading="Sidebar V2 - Rail"
          note="Primary navigation rail on desktop and bottom navigation with a direct mobile sign-out action."
          [props]="[
            { name: 'version', value: '2' },
            { name: 'context.label', value: 'Project' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="2" storageNamespace="showcase-layout-v2" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v3-collapsible') {
        <demo-section
          data-layout-showcase="3"
          heading="Sidebar V3 - Collapsible"
          note="Bấm từng nhóm menu để đóng/mở các mục con trên desktop. Tìm kiếm vẫn thấy mục trong nhóm đã đóng; thu gọn cả sidebar giữ trạng thái từng nhóm."
          [props]="[
            { name: 'version', value: '3' },
            { name: 'context.label', value: 'Project' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="3" storageNamespace="showcase-layout-v3" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v4-navigation') {
        <demo-section
          data-layout-showcase="4"
          heading="Sidebar V4 - Navigation"
          note="Token-driven V4: section headings, attention badge, count, live status and a coming-soon item; menu search with keyboard result navigation; flyout groups on the collapsed rail; mobile app bar with an opt-in bottom bar. Switching the Project shows a demo notice and restarts the preview instead of reloading the page. On this docs page Ctrl/⌘+K opens the docs search, which handles the shortcut first."
          [props]="[
            { name: 'version', value: '4' },
            { name: 'mobile.bottomBar', value: 'overview, approvals, inbox, activity' },
            { name: 'context.label', value: 'Project' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="4" storageNamespace="showcase-layout-v4" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v4-graphite') {
        <demo-section
          data-layout-showcase="4-graphite"
          heading="Sidebar V4 - Graphite"
          note="The same V4 inside a scope that includes sd.theme($preset: 'graphite'): near-black primary, and the active item becomes a raised surface through the preset's component tokens. The sidebar has no preset-specific code. CDK overlays (context popover, mobile sheet, rail flyouts) render outside this scoped demo wrapper, so they keep the default primary here; apps apply the preset at :root/html, so overlays follow it. On this docs page Ctrl/⌘+K opens the docs search, which handles the shortcut first, so the V4 search hint opens the docs search here."
          [props]="[
            { name: 'version', value: '4' },
            { name: 'preset', value: 'graphite' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <div class="layout-demo__preview--graphite">
            <app-layout-version-preview [version]="4" storageNamespace="showcase-layout-v4-graphite" [menus]="menus"></app-layout-version-preview>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDemoComponent {
  // `section`, `badge`, `status` and `comingSoon` are rendered by V4 only; V1–V3 ignore them.
  readonly menus: SdLayoutMenu[] = [
    {
      id: 'workspace',
      title: 'Workspace',
      icon: 'dashboard',
      section: 'Operations',
      children: [
        { id: 'overview', title: 'Overview', path: '/layout-demo/overview', icon: 'dashboard', permission: true },
        { id: 'tasks', title: 'Tasks', path: '/layout-demo/tasks', icon: 'check_circle', permission: true },
        {
          id: 'approvals',
          title: 'Approvals',
          path: '/layout-demo/approvals',
          icon: 'done_all',
          permission: true,
          badge: { value: 3, tone: 'warning' },
        },
        { id: 'calendar', title: 'Calendar', path: '/layout-demo/calendar', icon: 'event', permission: true },
        { id: 'teams', title: 'Teams', path: '/layout-demo/teams', icon: 'people', permission: true },
        { id: 'documents', title: 'Documents', path: '/layout-demo/documents', icon: 'description', permission: true },
        { id: 'inbox', title: 'Inbox', path: '/layout-demo/inbox', icon: 'inbox', permission: true, badge: { value: 9 } },
        { id: 'alerts', title: 'Notifications', path: '/layout-demo/alerts', icon: 'notifications', permission: true },
        { id: 'projects', title: 'Projects', path: '/layout-demo/projects', icon: 'folder', permission: true },
        { id: 'archive', title: 'Archive', path: '/layout-demo/archive', icon: 'archive', permission: true },
        { id: 'history', title: 'History', path: '/layout-demo/history', icon: 'history', permission: true },
        {
          id: 'templates',
          title: 'Templates',
          path: '/layout-demo/templates',
          icon: 'content_copy',
          permission: true,
          comingSoon: true,
        },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      icon: 'bar_chart',
      section: 'Operations',
      children: [
        { id: 'reports', title: 'Reports', path: '/layout-demo/reports', icon: 'bar_chart', permission: true },
        {
          id: 'activity',
          title: 'Activity',
          path: '/layout-demo/activity',
          icon: 'timeline',
          permission: true,
          status: { label: '1 running', tone: 'success', live: true },
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      section: 'Administration',
      children: [
        { id: 'profile', title: 'Profile', path: '/layout-demo/profile', icon: 'person', permission: true },
        {
          id: 'access-group',
          title: 'Access control',
          icon: 'security',
          children: [
            { id: 'access', title: 'Roles & permissions', path: '/layout-demo/access', icon: 'admin_panel_settings', permission: true },
            { id: 'audit', title: 'Audit log', path: '/layout-demo/audit', icon: 'history', permission: true },
          ],
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help',
      children: [{ id: 'help-center', title: 'Help center', path: '/layout-demo/help', icon: 'help_outline', permission: true }],
    },
  ];
}
