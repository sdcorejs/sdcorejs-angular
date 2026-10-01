import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { BuilderItem, isGroup } from '../state/builder-document';
import { itemIcon, itemTypeLabelKey } from '../state/builder-palette';
import { FormBuilderStore } from '../state/builder-store';

interface TreeNode {
  readonly item: BuilderItem;
  readonly depth: number;
  readonly parentId: string | null;
  readonly isGroup: boolean;
  readonly expanded: boolean;
  readonly childCount: number;
}

/**
 * Tab "Cấu trúc": cây PHẢN CHIẾU schema (không phải nguồn dữ liệu riêng). Chọn node = chọn trên
 * canvas (mở group nếu đang thu gọn, cuộn tới field). Field ẩn vẫn liệt kê kèm chỉ báo.
 * Bàn phím: ↑/↓ di chuyển, →/← mở/đóng group, Enter/Space chọn.
 */
@Component({
  selector: 'fb-structure',
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdTranslatePipe],
})
export class StructureComponent {
  readonly store = inject(FormBuilderStore);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly focusItem = output<string>();
  readonly itemIcon = itemIcon;
  readonly itemTypeLabelKey = itemTypeLabelKey;

  readonly nodes = computed<TreeNode[]>(() => {
    const collapsed = this.store.collapsed();
    const nodes: TreeNode[] = [];
    for (const item of this.store.doc().elements) {
      if (!item) continue;
      if (isGroup(item)) {
        const expanded = !collapsed.has(item.id);
        const children = (item.elements ?? []).filter(Boolean);
        nodes.push({ item, depth: 1, parentId: null, isGroup: true, expanded, childCount: children.length });
        if (expanded) {
          for (const child of children) {
            if (child) nodes.push({ item: child, depth: 2, parentId: item.id, isGroup: false, expanded: false, childCount: 0 });
          }
        }
      } else nodes.push({ item, depth: 1, parentId: null, isGroup: false, expanded: false, childCount: 0 });
    }
    return nodes;
  });

  /** Node nhận tabindex=0 (roving): node đang chọn, không có thì node đầu. */
  readonly activeId = computed(() => {
    const selected = this.store.selectedId();
    const nodes = this.nodes();
    return nodes.some(node => node.item.id === selected) ? selected : (nodes[0]?.item.id ?? null);
  });

  labelOf = (item: BuilderItem) => this.store.labelOf(item);

  isHidden = (item: BuilderItem) => !!(item as { hidden?: boolean }).hidden;

  isConditional = (item: BuilderItem) => {
    const rules = (item as { rules?: Record<string, unknown> }).rules;
    return !!(rules?.['visible'] || rules?.['hidden'] || rules?.['disabled'] || rules?.['required']);
  };

  keyOf = (item: BuilderItem) => (!isGroup(item) ? ((item as { key?: string }).key ?? '') : '');

  choose(node: TreeNode): void {
    this.store.select(node.item.id);
    this.store.revealItem(node.item.id);
    this.focusItem.emit(node.item.id);
  }

  toggle(node: TreeNode, event?: Event): void {
    event?.stopPropagation();
    if (node.isGroup) this.store.toggleCollapsed(node.item.id);
  }

  onKeydown(event: KeyboardEvent, node: TreeNode): void {
    const nodes = this.nodes();
    const position = nodes.findIndex(candidate => candidate.item.id === node.item.id);
    const focusAt = (index: number) => {
      const target = nodes[Math.max(0, Math.min(nodes.length - 1, index))];
      if (!target) return;
      this.#host.nativeElement.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(target.item.id)}"]`)?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(position + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(position - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(nodes.length - 1);
        break;
      case 'ArrowRight':
        if (node.isGroup && !node.expanded) {
          event.preventDefault();
          this.store.toggleCollapsed(node.item.id, false);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (node.isGroup && node.expanded) this.store.toggleCollapsed(node.item.id, true);
        else if (node.parentId) focusAt(nodes.findIndex(candidate => candidate.item.id === node.parentId));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.choose(node);
        break;
    }
  }
}
