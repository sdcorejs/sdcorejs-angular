import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  },
  signout: () => undefined,
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
  selector: 'app-layout-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdLayoutComponent],
  providers: [
    LayoutDemoViewport,
    SdViewportService,
    MenuPipe,
    SdPermissionService,
    SdLayoutService,
    SdLayoutResponsiveService,
    SdLayoutStorageService,
    SdLayoutNavigationStateService,
    { provide: I18nService, useValue: { t: (key: string) => key } },
    { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } },
    { provide: SD_LAYOUT_CONFIGURATION, useValue: DEMO_CONFIGURATION },
    { provide: SD_LAYOUT_VIEWPORT, useExisting: LayoutDemoViewport },
  ],
  template: `
    <demo-page
      #demoPage
      title="Layout"
      description="Compare the existing sidebar with two responsive navigation variants using the same menu fixture.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sidebar-v1-v2-v3') {
        <demo-section
          heading="Sidebar V1, V2 & V3"
          note="Switch versions and viewport widths without reloading the Showcase page."
          [props]="[
            { name: 'version', value: '1 / 2 / 3' },
            { name: 'mobileBreakpoint', value: '900' },
            { name: 'viewport', value: 'desktop / mobile' },
          ]">
          <div class="layout-demo__controls" aria-label="Layout preview controls">
            <fieldset>
              <legend>Sidebar version</legend>
              @for (option of versionOptions; track option.value) {
                <button
                  type="button"
                  [attr.data-layout-version]="option.value"
                  [attr.aria-pressed]="selectedVersion() === option.value"
                  (click)="selectVersion(option.value)">
                  {{ option.label }}
                </button>
              }
            </fieldset>
            <fieldset>
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
          </div>

          <div
            class="layout-demo__preview"
            [class.layout-demo__preview--mobile]="selectedViewport() === 'mobile'"
            [attr.data-active-layout-version]="selectedVersion()"
            [attr.data-active-layout-viewport]="selectedViewport()">
            <sd-layout [menus]="menus">
              <main class="layout-demo__content">
                <span class="layout-demo__eyebrow">Live fixture</span>
                <h4>Operations overview</h4>
                <p>The page content stays mounted while the responsive sidebar implementation changes.</p>
                <div class="layout-demo__metrics" aria-label="Example summary">
                  <span><strong>24</strong> open tasks</span>
                  <span><strong>8</strong> approvals</span>
                  <span><strong>5</strong> reports</span>
                </div>
              </main>
            </sd-layout>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .layout-demo__controls {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        width: 100%;
      }

      fieldset {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
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
        outline: 3px solid color-mix(in srgb, var(--sd-primary, #005cbb) 35%, transparent);
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
export class LayoutDemoComponent {
  readonly #layoutService = inject(SdLayoutService);
  readonly #viewport = inject(LayoutDemoViewport);

  readonly selectedVersion = signal<LayoutDemoVersion>(1);
  readonly selectedViewport = signal<LayoutDemoViewportMode>('desktop');
  readonly versionOptions = [
    { value: 1, label: 'V1 - Classic' },
    { value: 2, label: 'V2 - Rail' },
    { value: 3, label: 'V3 - Collapsible' },
  ] as const;
  readonly viewportOptions = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ] as const;
  readonly menus: SdLayoutMenu[] = [
    {
      id: 'workspace',
      title: 'Workspace',
      icon: 'space_dashboard',
      children: [
        { id: 'overview', title: 'Overview', path: '/layout-demo/overview', icon: 'dashboard', permission: true },
        { id: 'tasks', title: 'Tasks', path: '/layout-demo/tasks', icon: 'task_alt', permission: true },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      icon: 'monitoring',
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
        { id: 'access', title: 'Access control', path: '/layout-demo/access', icon: 'admin_panel_settings', permission: true },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help',
      children: [{ id: 'help-center', title: 'Help center', path: '/layout-demo/help', icon: 'support', permission: true }],
    },
  ];

  selectVersion(version: LayoutDemoVersion): void {
    this.selectedVersion.set(version);
    this.#layoutService.sidebar.set(SIDEBAR_CONFIGURATIONS[version]);
  }

  selectViewport(viewport: LayoutDemoViewportMode): void {
    this.selectedViewport.set(viewport);
    this.#viewport.resizeTo(viewport === 'mobile' ? 390 : 1280);
  }
}
