import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
          [routerLink]="link.commands"
          [attr.aria-current]="activeTab() === link.id ? 'page' : null"
          [class.active]="activeTab() === link.id">
          {{ link.label }}
        </a>
      }
    </nav>
  `,
  styles: [`
    .docs-tabs { display: flex; overflow-x: auto; margin-top: 30px; border-bottom: 1px solid var(--docs-border-color); }
    a { flex: 0 0 auto; border-bottom: 3px solid transparent; padding: 12px 16px; color: var(--docs-text-secondary); font-weight: 600; }
    a.active { border-color: var(--sd-primary, #005cbb); color: var(--sd-primary, #005cbb); }
    a:hover { text-decoration: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageTabsComponent {
  readonly links = input.required<readonly DocsPageTabLink[]>();
  readonly activeTab = input.required<DocTabId>();
}
