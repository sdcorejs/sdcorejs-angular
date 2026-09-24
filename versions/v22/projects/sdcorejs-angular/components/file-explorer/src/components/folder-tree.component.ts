import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdFileExplorerTreeNode } from '../file-explorer.view-model';
import { SdFileExplorerFileIcon } from './file-icon.component';

/**
 * Folder tree of the explorer (internal). Rendered as a flat `role="tree"` list whose depth is carried by
 * `aria-level`, with a roving tabindex and the WAI-ARIA tree keyboard model.
 */
@Component({
  selector: 'sd-file-explorer-folder-tree',
  standalone: true,
  imports: [SdIcon, SdFileExplorerFileIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-file-explorer-folder-tree' },
  template: `
    @let _nodes = nodes();
    @let _active = activeKey();
    <ul class="tree" role="tree" [attr.aria-label]="label()">
      @for (node of _nodes; track node.key; let i = $index) {
        <li
          class="node"
          role="treeitem"
          [class.node--selected]="node.selected"
          [attr.aria-level]="node.level"
          [attr.aria-selected]="node.selected"
          [attr.aria-expanded]="node.expandable ? node.expanded : null"
          [attr.aria-busy]="node.status === 'loading' ? true : null"
          [attr.tabindex]="node.key === _active ? 0 : -1"
          [attr.data-autoid]="node.autoId"
          [style.--sd-file-explorer-tree-indent]="(node.level > 1 ? node.level - 2 : 0) * 22 + 'px'"
          (click)="select.emit(node)"
          (keydown)="onKeydown($event, i)"
          (focus)="focusedKey.set(node.key)">
          @if (node.level > 1) {
            <span class="indent"></span>
            @if (node.expandable) {
              <button
                type="button"
                class="toggle"
                tabindex="-1"
                [attr.aria-label]="toggleLabel(node)"
                [attr.data-autoid]="node.autoId ? node.autoId + '-toggle' : null"
                (click)="onToggle($event, node)">
                <sd-icon [name]="node.expanded ? 'expand_more' : 'chevron_right'" size="16px" />
              </button>
            } @else {
              <span class="toggle toggle--placeholder"></span>
            }
          }
          <sd-file-explorer-file-icon [icon]="node.expanded ? 'folder-open' : 'folder-closed'" [size]="28" />
          <span class="label" [title]="node.name">{{ node.name }}</span>
          @if (node.status === 'loading') {
            <span class="spinner" aria-hidden="true"></span>
          } @else if (node.status === 'error') {
            <button
              type="button"
              class="retry"
              tabindex="-1"
              [attr.aria-label]="retryLabel()"
              [title]="retryLabel()"
              (click)="onRetry($event, node)">
              <sd-icon name="refresh" size="16px" />
            </button>
          }
        </li>
      }
    </ul>
  `,
  styleUrl: './folder-tree.component.scss',
})
export class SdFileExplorerFolderTree {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #i18n = inject(I18nService);

  /** Visible nodes in display order. */
  readonly nodes = input.required<readonly SdFileExplorerTreeNode[]>();
  /** Accessible name of the tree. */
  readonly label = input<string>('');
  /** A node was activated (click, Enter, Space). */
  readonly select = output<SdFileExplorerTreeNode>();
  /** Expand / collapse requested. */
  readonly toggle = output<SdFileExplorerTreeNode>();
  /** Retry loading the children of a node whose listing failed. */
  readonly retry = output<SdFileExplorerTreeNode>();

  protected readonly focusedKey = signal<string | null>(null);
  protected readonly retryLabel = computed(() => this.#i18n.t('core.component.file-explorer.retry'));

  /** Node owning the roving tabindex: the focused node if still visible, else the selected one. */
  protected readonly activeKey = computed(() => {
    const nodes = this.nodes();
    const focused = this.focusedKey();
    if (focused && nodes.some(node => node.key === focused)) return focused;
    return nodes.find(node => node.selected)?.key ?? nodes[0]?.key ?? null;
  });

  protected toggleLabel(node: SdFileExplorerTreeNode): string {
    const key = node.expanded ? 'core.component.file-explorer.collapse' : 'core.component.file-explorer.expand';
    return this.#i18n.t(key, { name: node.name });
  }

  protected onToggle(event: Event, node: SdFileExplorerTreeNode): void {
    // why: nút toggle nằm trong treeitem — chặn bubble để bấm mũi tên không đồng thời điều hướng vào thư mục.
    event.stopPropagation();
    this.toggle.emit(node);
  }

  protected onRetry(event: Event, node: SdFileExplorerTreeNode): void {
    event.stopPropagation();
    this.retry.emit(node);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const nodes = this.nodes();
    const node = nodes[index];
    if (!node) return;
    switch (event.key) {
      case 'ArrowDown':
        this.#focusIndex(Math.min(index + 1, nodes.length - 1));
        break;
      case 'ArrowUp':
        this.#focusIndex(Math.max(index - 1, 0));
        break;
      case 'Home':
        this.#focusIndex(0);
        break;
      case 'End':
        this.#focusIndex(nodes.length - 1);
        break;
      case 'ArrowRight':
        if (node.expandable && !node.expanded) this.toggle.emit(node);
        else if (node.expanded || node.level === 1) this.#focusIndex(Math.min(index + 1, nodes.length - 1));
        break;
      case 'ArrowLeft':
        if (node.expandable && node.expanded) {
          this.toggle.emit(node);
        } else {
          for (let i = index - 1; i >= 0; i--) {
            if (nodes[i].level < node.level) {
              this.#focusIndex(i);
              break;
            }
          }
        }
        break;
      case 'Enter':
      case ' ':
        this.select.emit(node);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  #focusIndex(index: number): void {
    const node = this.nodes()[index];
    if (!node) return;
    this.focusedKey.set(node.key);
    const element = this.#host.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]')[index];
    element?.focus();
  }
}
