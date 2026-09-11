import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, model, output, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdLayoutMenu, SdLayoutRootMenu, getMenuStableKey, searchMenuLeaves } from '../../../services';
import { resolveActiveMenuPath } from '../../../utils';

interface SdLayoutMenuTreeNode {
  menu: SdLayoutMenu;
  key: string;
  title: string;
  depth: number;
  paddingLeft: number;
  inset: number;
  branchOffsets: number[];
  showIcon: boolean;
  isRoot: boolean;
  isGroup: boolean;
  isCollapsible: boolean;
  isExpanded: boolean;
  isActive: boolean;
  isPinned: boolean;
  isPinVisible: boolean;
  /** Accessible name of the pin toggle — already i18n-resolved with the menu title interpolated. */
  pinLabel: string;
}

@Component({
  selector: 'sd-layout-menu-tree',
  standalone: true,
  imports: [SdIcon, NgTemplateOutlet],
  templateUrl: './menu-tree.component.html',
  styleUrl: './menu-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLayoutMenuTreeComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly #i18n = inject(I18nService);
  readonly #hoveredPinKey = signal<string | null>(null);
  #pinHoverTimerId: ReturnType<typeof setTimeout> | undefined;

  menus = input<SdLayoutMenu[]>([]);
  query = input('');
  activePath = input('');
  pinnedKeys = input<string[]>([]);
  showPin = input(true);
  pinVisibility = input<'hover' | 'always'>('hover');
  /** V3 hierarchy and flat shortcuts are opt-in; V2/mobile retain the default presentation. */
  presentation = input<'default' | 'hierarchy' | 'shortcuts'>('default');
  collapsible = input(false);
  collapsedGroupKeys = model<string[]>([]);
  structured = computed(() => this.presentation() !== 'default');
  iconFontSet = computed(() => (this.structured() ? ('material-icons-outlined' as const) : undefined));
  navigate = output<SdLayoutRootMenu>();
  togglePinned = output<SdLayoutMenu>();

  nodes = computed<SdLayoutMenuTreeNode[]>(() => {
    const pinnedKeys = new Set(this.pinnedKeys());
    const hoveredPinKey = this.#hoveredPinKey();
    const alwaysShowPin = this.pinVisibility() === 'always';
    const query = this.query().trim();
    const structured = this.structured();
    const hierarchy = this.presentation() === 'hierarchy' && !query;
    const collapsible = this.collapsible() && !query;
    const collapsedKeys = new Set(this.collapsedGroupKeys());
    const menus = query ? searchMenuLeaves(this.menus(), query) : this.menus();
    // Nhiều menu cùng khớp route thì chỉ path sát nhất sáng: ở '/appointment/cs' thì '/appointment' không sáng nữa
    const activeMenuPath = resolveActiveMenuPath(menus, this.activePath());
    const nodes: SdLayoutMenuTreeNode[] = [];

    const append = (items: SdLayoutMenu[], depth: number, ancestors: string[]): void => {
      for (const menu of items) {
        const key = getMenuStableKey(menu, ancestors);
        if (!key) continue;
        const isGroup = 'children' in menu && !!menu.children?.length;
        const path = 'path' in menu ? menu.path : '';
        const title = menu.title ?? menu.tooltipTitle ?? '';
        const isPinned = pinnedKeys.has(key);
        const isExpanded = !collapsible || !collapsedKeys.has(key);
        nodes.push({
          menu,
          key,
          title,
          depth,
          paddingLeft: structured ? (depth ? 38 + (depth - 1) * 16 : 10) : 12 + depth * 16,
          inset: structured && depth ? 28 + (depth - 1) * 16 : 0,
          branchOffsets: hierarchy ? Array.from({ length: depth }, (_, index) => 19 + index * 16) : [],
          showIcon: !structured || (hierarchy && depth === 0),
          isRoot: depth === 0 && (!structured || hierarchy),
          isGroup,
          isCollapsible: isGroup && collapsible,
          isExpanded,
          isActive: !!path && path === activeMenuPath,
          isPinned,
          isPinVisible: alwaysShowPin || isPinned || hoveredPinKey === key,
          // why: template cũ nối `'Pin ' + node.title` — chuỗi tiếng Anh cứng và ép trật tự
          // "động từ trước tên" của tiếng Anh lên mọi ngôn ngữ. Nội suy `{title}` để catalog tự
          // quyết định vị trí. Tính trong `nodes` computed nên tự cập nhật khi đổi ngôn ngữ.
          pinLabel: this.#i18n.t(isPinned ? 'core.module.layout.menu.unpin' : 'core.module.layout.menu.pin', { title }),
        });
        if (isGroup && isExpanded && 'children' in menu) append(menu.children ?? [], depth + 1, [...ancestors, menu.title ?? key]);
      }
    };

    append(menus, 0, []);
    return nodes;
  });

  constructor() {
    this.#destroyRef.onDestroy(() => this.#clearPinHoverTimer());
  }

  onNavigate(menu: SdLayoutMenu): void {
    if ('path' in menu) this.navigate.emit(menu);
  }

  onToggleGroup(key: string): void {
    this.collapsedGroupKeys.update(keys => (keys.includes(key) ? keys.filter(value => value !== key) : [...keys, key]));
  }

  onTogglePinned(event: MouseEvent, menu: SdLayoutMenu): void {
    event.stopPropagation();
    this.togglePinned.emit(menu);
  }

  onPinHoverStart(key: string): void {
    if (this.pinVisibility() === 'always') return;
    this.#clearPinHoverTimer();
    this.#pinHoverTimerId = setTimeout(() => {
      this.#hoveredPinKey.set(key);
      this.#pinHoverTimerId = undefined;
    }, 300);
  }

  onPinHoverEnd(key: string): void {
    this.#clearPinHoverTimer();
    if (this.#hoveredPinKey() === key) this.#hoveredPinKey.set(null);
  }

  #clearPinHoverTimer(): void {
    if (this.#pinHoverTimerId === undefined) return;
    clearTimeout(this.#pinHoverTimerId);
    this.#pinHoverTimerId = undefined;
  }
}
