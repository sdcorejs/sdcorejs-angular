import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocsI18nService } from '../core/docs-i18n.service';
import { DocTabId } from '../core/documentation.models';

function revealHorizontally(element: HTMLElement): void {
  const strip = element.parentElement;
  if (!strip) return;
  const left = element.offsetLeft - strip.offsetLeft;
  if (left < strip.scrollLeft) strip.scrollLeft = left;
  else if (left + element.offsetWidth > strip.scrollLeft + strip.clientWidth) {
    strip.scrollLeft = left + element.offsetWidth - strip.clientWidth;
  }
}

export interface DocsPageTabLink {
  readonly id: DocTabId;
  readonly label: string;
  readonly commands: string[];
  /** Number shown in a mono pill (API members, examples); null hides the pill. */
  readonly count?: number | null;
}

@Component({
  selector: 'docs-page-tabs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="docs-tabs" [attr.aria-label]="i18n.t().sections">
      @for (link of links(); track link.id) {
        <a
          #tabLink
          [routerLink]="link.commands"
          [attr.aria-current]="activeTab() === link.id ? 'page' : null"
          [class.active]="activeTab() === link.id"
          (click)="tabSelected.emit(link.id)">
          <span>{{ i18n.t().tabs[link.id] }}</span>
          @if (link.count != null) {
            <span class="docs-tabs__count">{{ link.count }}</span>
          }
        </a>
      }
    </nav>
  `,
  styles: [
    `
      :host {
        position: sticky;
        z-index: 20;
        top: var(--docs-header-height);
        display: block;
        background: var(--docs-bg);
      }
      .docs-tabs {
        display: flex;
        gap: 2px;
        overflow-x: auto;
        border-bottom: 1px solid var(--docs-line);
        scroll-padding-inline: 8px;
        scrollbar-width: none;
      }
      a {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 8px;
        height: 48px;
        padding: 0 14px;
        color: var(--docs-fg-3);
        font-size: 14.5px;
        font-weight: 600;
        white-space: nowrap;
      }
      a:hover {
        color: var(--docs-fg);
        text-decoration: none;
      }
      a.active {
        box-shadow: inset 0 -2px 0 var(--docs-acc);
        color: var(--docs-acc);
      }
      .docs-tabs__count {
        border-radius: var(--docs-radius-pill);
        background: var(--docs-bg-3);
        padding: 0 6px;
        color: var(--docs-fg-3);
        font-family: var(--docs-font-mono);
        font-size: 11px;
        font-weight: 500;
        line-height: 18px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageTabsComponent {
  readonly i18n = inject(DocsI18nService);
  readonly links = input.required<readonly DocsPageTabLink[]>();
  readonly activeTab = input.required<DocTabId>();
  /** Emits before the router navigates, so the page can keep the reader at the tab bar. */
  readonly tabSelected = output<DocTabId>();
  readonly tabElements = viewChildren<ElementRef<HTMLAnchorElement>>('tabLink');

  constructor() {
    effect(() => {
      const activeTab = this.activeTab();
      const links = this.links();
      const elements = this.tabElements();
      const activeIndex = links.findIndex(link => link.id === activeTab);
      const element = elements[activeIndex]?.nativeElement;
      // why: only the tab strip scrolls sideways; scrollIntoView would also move the page to the tab bar.
      if (element) queueMicrotask(() => revealHorizontally(element));
    });
  }
}
