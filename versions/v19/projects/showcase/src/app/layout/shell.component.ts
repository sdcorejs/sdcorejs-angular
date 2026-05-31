import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SIDEBAR_GROUPS, SidebarItem } from './sidebar.config';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MatIconModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  groups = SIDEBAR_GROUPS;

  query = signal('');

  collapsed = signal<Record<string, boolean>>({});

  toggleGroup(title: string) {
    this.collapsed.update((m) => ({ ...m, [title]: !m[title] }));
  }

  isCollapsed(title: string): boolean {
    return !!this.collapsed()[title];
  }

  filteredGroups = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.groups;
    return this.groups
      .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  });

  trackItem = (_: number, it: SidebarItem) => it.path;
}
