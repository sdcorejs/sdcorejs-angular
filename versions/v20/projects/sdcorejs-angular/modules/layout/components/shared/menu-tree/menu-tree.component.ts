import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdLayoutMenu, SdLayoutRootMenu, getMenuStableKey, searchMenuLeaves } from '../../../services';

interface SdLayoutMenuTreeNode {
  menu: SdLayoutMenu;
  key: string;
  title: string;
  depth: number;
  paddingLeft: number;
  isGroup: boolean;
  isActive: boolean;
  isPinned: boolean;
}

@Component({
  selector: 'sd-layout-menu-tree',
  standalone: true,
  imports: [SdIcon],
  templateUrl: './menu-tree.component.html',
  styleUrl: './menu-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLayoutMenuTreeComponent {
  menus = input<SdLayoutMenu[]>([]);
  query = input('');
  activePath = input('');
  pinnedKeys = input<string[]>([]);
  showPin = input(true);
  navigate = output<SdLayoutRootMenu>();
  togglePinned = output<SdLayoutMenu>();

  nodes = computed<SdLayoutMenuTreeNode[]>(() => {
    const pinnedKeys = new Set(this.pinnedKeys());
    const query = this.query().trim();
    const menus = query ? searchMenuLeaves(this.menus(), query) : this.menus();
    const nodes: SdLayoutMenuTreeNode[] = [];

    const append = (items: SdLayoutMenu[], depth: number, ancestors: string[]): void => {
      for (const menu of items) {
        const key = getMenuStableKey(menu, ancestors);
        if (!key) continue;
        const isGroup = 'children' in menu && !!menu.children?.length;
        const path = 'path' in menu ? menu.path : '';
        nodes.push({
          menu,
          key,
          title: menu.title ?? menu.tooltipTitle ?? '',
          depth,
          paddingLeft: 12 + depth * 16,
          isGroup,
          isActive: !!path && this.#pathMatches(this.activePath(), path),
          isPinned: pinnedKeys.has(key),
        });
        if (isGroup && 'children' in menu) append(menu.children ?? [], depth + 1, [...ancestors, menu.title ?? key]);
      }
    };

    append(menus, 0, []);
    return nodes;
  });

  onNavigate(menu: SdLayoutMenu): void {
    if ('path' in menu) this.navigate.emit(menu);
  }

  onTogglePinned(event: MouseEvent, menu: SdLayoutMenu): void {
    event.stopPropagation();
    this.togglePinned.emit(menu);
  }

  #pathMatches(currentPath: string, menuPath: string): boolean {
    const normalize = (path: string): string => (path.endsWith('/') ? path : `${path}/`);
    return currentPath === menuPath || normalize(currentPath).startsWith(normalize(menuPath));
  }
}
