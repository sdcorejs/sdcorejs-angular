import { ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocTabId } from '../core/documentation.models';

export interface DocsPageTabLink {
  readonly id: DocTabId;
  readonly label: string;
  readonly commands: string[];
}

@Component({
  selector: 'docs-page-tabs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="docs-tabs" aria-label="Documentation sections">
      @for (link of links(); track link.id) {
        <a
          #tabLink
          [routerLink]="link.commands"
          [attr.aria-current]="activeTab() === link.id ? 'page' : null"
          [class.active]="activeTab() === link.id">
          {{ link.label }}
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .docs-tabs {
        display: flex;
        overflow-x: auto;
        margin-top: 30px;
        border-bottom: 1px solid var(--docs-border-color);
        scroll-padding-inline: 8px;
        scrollbar-width: thin;
      }
      a {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        min-height: 44px;
        border-bottom: 3px solid transparent;
        padding: 10px 16px;
        color: var(--docs-text-secondary);
        font-weight: 600;
      }
      a.active {
        border-color: var(--sd-primary, #005cbb);
        color: var(--sd-primary, #005cbb);
      }
      a:hover {
        text-decoration: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageTabsComponent {
  readonly links = input.required<readonly DocsPageTabLink[]>();
  readonly activeTab = input.required<DocTabId>();
  readonly tabElements = viewChildren<ElementRef<HTMLAnchorElement>>('tabLink');

  constructor() {
    effect(() => {
      const activeTab = this.activeTab();
      const links = this.links();
      const elements = this.tabElements();
      const activeIndex = links.findIndex(link => link.id === activeTab);
      const element = elements[activeIndex]?.nativeElement;
      if (element) queueMicrotask(() => element.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
    });
  }
}
