import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import {
  ISdLayoutConfiguration,
  ISdSidebarConfiguration,
  MenuPipe,
  SD_LAYOUT_CONFIGURATION,
  SD_LAYOUT_VIEWPORT,
  SdLayoutComponent,
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

type LayoutDemoVersion = 1 | 2 | 3;
type LayoutDemoViewportMode = 'desktop' | 'mobile';

export const LAYOUT_DEMO_NOTIFICATION_COUNT = signal(6);

const LAYOUT_DEMO_TRANSLATIONS: Readonly<Record<string, string>> = {
  'core.module.layout.sidebar.search': 'Search menu',
  'core.module.layout.user.update-profile': 'Update profile',
  'core.module.layout.user.setting': 'Settings',
  'core.module.layout.user.notification': 'Notifications',
  'core.module.layout.user.change-password': 'Change password',
  'core.module.layout.user.logout': 'Sign out',
};

const SIDEBAR_CONFIGURATIONS: Readonly<Record<LayoutDemoVersion, ISdSidebarConfiguration>> = {
  1: {
    version: 1,
    defaultTitle: 'Operations Portal',
    pin: { enabled: true },
  },
  2: {
    version: 2,
    interaction: 'click',
    primaryMenuIds: ['workspace', 'insights', 'settings'],
    pin: { enabled: true },
  },
  3: {
    version: 3,
    defaultCollapsed: false,
    recent: { enabled: true, maxItems: 5 },
    pin: { enabled: true },
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

@Component({
  selector: 'app-layout-version-preview',
  standalone: true,
  imports: [SdLayoutComponent],
  providers: [
    LayoutDemoViewport,
    SdViewportService,
    MenuPipe,
    SdPermissionService,
    SdLayoutService,
    SdLayoutResponsiveService,
    SdLayoutStorageService,
    SdLayoutNavigationStateService,
    { provide: I18nService, useValue: { t: (key: string) => LAYOUT_DEMO_TRANSLATIONS[key] ?? key } },
    { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } },
    { provide: SD_LAYOUT_CONFIGURATION, useValue: DEMO_CONFIGURATION },
    { provide: SD_LAYOUT_VIEWPORT, useExisting: LayoutDemoViewport },
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

    <div
      class="layout-demo__preview"
      [class.layout-demo__preview--mobile]="selectedViewport() === 'mobile'"
      [class.layout-demo__preview--contain-v1]="version() === 1"
      [attr.data-active-layout-version]="version()"
      [attr.data-active-layout-viewport]="selectedViewport()">
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

  version = input.required<LayoutDemoVersion>();
  menus = input<SdLayoutMenu[]>([]);
  readonly selectedViewport = signal<LayoutDemoViewportMode>('desktop');
  readonly viewportOptions = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ] as const;

  constructor() {
    effect(() => this.#layoutService.sidebar.set(SIDEBAR_CONFIGURATIONS[this.version()]));
  }

  selectViewport(viewport: LayoutDemoViewportMode): void {
    this.selectedViewport.set(viewport);
    this.#viewport.resizeTo(viewport === 'mobile' ? 390 : 1280);
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
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="1" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v2-rail') {
        <demo-section
          data-layout-showcase="2"
          heading="Sidebar V2 - Rail"
          note="Primary navigation rail on desktop and bottom navigation with a direct mobile sign-out action."
          [props]="[
            { name: 'version', value: '2' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="2" [menus]="menus"></app-layout-version-preview>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v3-collapsible') {
        <demo-section
          data-layout-showcase="3"
          heading="Sidebar V3 - Collapsible"
          note="Collapsible desktop navigation and a unified mobile drawer with pinned and recent menus."
          [props]="[
            { name: 'version', value: '3' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <app-layout-version-preview [version]="3" [menus]="menus"></app-layout-version-preview>
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
  readonly menus: SdLayoutMenu[] = [
    {
      id: 'workspace',
      title: 'Workspace',
      icon: 'dashboard',
      children: [
        { id: 'overview', title: 'Overview', path: '/layout-demo/overview', icon: 'dashboard', permission: true },
        { id: 'tasks', title: 'Tasks', path: '/layout-demo/tasks', icon: 'check_circle', permission: true },
        { id: 'approvals', title: 'Approvals', path: '/layout-demo/approvals', icon: 'done_all', permission: true },
        { id: 'calendar', title: 'Calendar', path: '/layout-demo/calendar', icon: 'event', permission: true },
        { id: 'teams', title: 'Teams', path: '/layout-demo/teams', icon: 'people', permission: true },
        { id: 'documents', title: 'Documents', path: '/layout-demo/documents', icon: 'description', permission: true },
        { id: 'inbox', title: 'Inbox', path: '/layout-demo/inbox', icon: 'inbox', permission: true },
        { id: 'alerts', title: 'Notifications', path: '/layout-demo/alerts', icon: 'notifications', permission: true },
        { id: 'projects', title: 'Projects', path: '/layout-demo/projects', icon: 'folder', permission: true },
        { id: 'archive', title: 'Archive', path: '/layout-demo/archive', icon: 'archive', permission: true },
        { id: 'history', title: 'History', path: '/layout-demo/history', icon: 'history', permission: true },
        { id: 'templates', title: 'Templates', path: '/layout-demo/templates', icon: 'content_copy', permission: true },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      icon: 'bar_chart',
      children: [
        { id: 'reports', title: 'Reports', path: '/layout-demo/reports', icon: 'bar_chart', permission: true },
        { id: 'activity', title: 'Activity', path: '/layout-demo/activity', icon: 'timeline', permission: true },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      children: [
        { id: 'profile', title: 'Profile', path: '/layout-demo/profile', icon: 'person', permission: true },
        { id: 'access', title: 'Access control', path: '/layout-demo/access', icon: 'security', permission: true },
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
