import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SD_FILE_EXPLORER_COMMAND_DEFAULTS, sdFileExplorerActionsBusy, sdFileExplorerResolveActions } from '../file-explorer-actions';
import type { SdFileExplorerCommand } from '../file-explorer.model';
import type { SdFileExplorerCommandMenu, SdFileExplorerTreeNode } from '../file-explorer.view-model';
import { SdFileExplorerActions } from './actions.component';
import { SdFileExplorerFileIcon } from './file-icon.component';
import type { SdFileExplorerCommandsRequest } from './item-list.component';
import { SdFileExplorerMenuTrigger } from './menu-trigger.component';

let nextTreeId = 0;

/** Events from a folder command (or the space between them), or from the compact actions trigger, belong to it. */
const COMMAND_AREAS = '.node-actions, .sd-file-explorer-menu-trigger';

/**
 * Folder tree of the explorer (internal). Rendered as a flat `role="tree"` list whose depth is carried by
 * `aria-level`, with a roving tabindex and the WAI-ARIA tree keyboard model.
 *
 * Folder commands sit at the end of each folder node. On desktop they are rendered for the hovered or focused node
 * only — taking no room while hidden, so names keep the full width — and `Tab` from the focused node reaches them
 * while the tree keeps a single tab stop. A node with commands is named by its label alone and wraps its commands
 * onto a second line when they do not fit next to the name.
 *
 * In the compact layout a folder node carries one actions trigger instead, which asks the explorer for its command
 * drawer; only the trigger of the tab-stop node is in the tab order.
 */
@Component({
  selector: 'sd-file-explorer-folder-tree',
  standalone: true,
  imports: [SdIcon, SdFileExplorerActions, SdFileExplorerFileIcon, SdFileExplorerMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-folder-tree',
    '[class.sd-file-explorer-folder-tree--touch]': 'touch()',
    '[class.sd-file-explorer-folder-tree--compact]': 'compact()',
  },
  template: `
    @let _nodes = nodes();
    @let _active = activeKey();
    @let _commands = commands();
    @let _hasCommands = !!_commands?.length;
    @let _touch = touch();
    @let _commandSize = _touch ? 'lg' : 'sm';
    @let _menus = menus();
    @let _menuOpenId = menuOpenId();
    <ul class="tree" role="tree" [attr.aria-label]="label()">
      @for (node of _nodes; track node.key; let i = $index) {
        @let _nodeCommands = _hasCommands && !!node.item;
        @let _labelId = treeId + '-label-' + i;
        <li
          class="node"
          role="treeitem"
          [class.node--selected]="node.selected"
          [class.node--commands]="_nodeCommands"
          [attr.aria-labelledby]="_nodeCommands ? _labelId : null"
          [attr.aria-level]="node.level"
          [attr.aria-selected]="node.selected"
          [attr.aria-expanded]="node.expandable ? node.expanded : null"
          [attr.aria-busy]="node.status === 'loading' ? true : null"
          [attr.tabindex]="node.key === _active ? 0 : -1"
          [attr.data-autoid]="node.autoId"
          [style.--sd-file-explorer-tree-indent]="(node.level > 1 ? node.level - 2 : 0) * 22 + 'px'"
          (click)="onClick($event, node)"
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
          <span class="label" [id]="_labelId" [title]="node.name">{{ node.name }}</span>
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
          @if (_nodeCommands) {
            @if (node.item; as folder) {
              @if (!_menus) {
                <sd-file-explorer-actions
                  class="node-actions"
                  source="folderCommands"
                  [actions]="_commands"
                  [context]="folder"
                  [size]="_commandSize"
                  [autoId]="node.autoId ? node.autoId + '-command' : undefined" />
              } @else {
                @if (_menus.get(node.key); as menu) {
                  <sd-file-explorer-menu-trigger
                    class="node-menu"
                    [label]="menuLabel(node)"
                    [busy]="menu.busy"
                    [expanded]="folder.id === _menuOpenId"
                    [touch]="_touch"
                    [tabIndex]="node.key === _active ? 0 : -1"
                    [autoId]="node.autoId ? node.autoId + '-commands' : undefined"
                    (activate)="openCommands.emit({ item: folder, trigger: $event })" />
                }
              }
            }
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

  /** Prefix of the label ids that name nodes with commands. */
  protected readonly treeId = `sd-file-explorer-tree-${nextTreeId++}`;

  /** Visible nodes in display order. */
  readonly nodes = input.required<readonly SdFileExplorerTreeNode[]>();
  /** Accessible name of the tree. */
  readonly label = input<string>('');
  /** Commands of every folder node; the root has none. */
  readonly commands = input<readonly SdFileExplorerCommand[] | null | undefined>(undefined);
  /** Touch screen: commands always visible, with 48 px buttons (44 px compact trigger). */
  readonly touch = input(false);
  /** Compact layout: an actions trigger per folder node instead of its commands. */
  readonly compact = input(false);
  /** Id of the folder whose command drawer is open from the tree. */
  readonly menuOpenId = input<string | null>(null);
  /** A node was activated (click, Enter, Space). */
  readonly select = output<SdFileExplorerTreeNode>();
  /** Expand / collapse requested. */
  readonly toggle = output<SdFileExplorerTreeNode>();
  /** Retry loading the children of a node whose listing failed. */
  readonly retry = output<SdFileExplorerTreeNode>();
  /** Compact actions trigger of a folder pressed. */
  readonly openCommands = output<SdFileExplorerCommandsRequest>();

  protected readonly focusedKey = signal<string | null>(null);
  protected readonly retryLabel = computed(() => this.#i18n.t('core.component.file-explorer.retry'));

  /**
   * Compact: trigger state per folder node key, for folders whose drawer would list something; `null` on desktop,
   * where the nodes render their commands.
   */
  protected readonly menus = computed<ReadonlyMap<string, SdFileExplorerCommandMenu> | null>(() => {
    if (!this.compact()) return null;
    const commands = this.commands();
    const menus = new Map<string, SdFileExplorerCommandMenu>();
    for (const node of this.nodes()) {
      if (!node.item) continue;
      const resolved = sdFileExplorerResolveActions(commands, node.item, SD_FILE_EXPLORER_COMMAND_DEFAULTS, 'folderCommands');
      if (resolved.length) menus.set(node.key, { busy: sdFileExplorerActionsBusy(resolved) });
    }
    return menus;
  });

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

  protected menuLabel(node: SdFileExplorerTreeNode): string {
    return this.#i18n.t('core.component.file-explorer.item-actions', { name: node.name });
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

  protected onClick(event: MouseEvent, node: SdFileExplorerTreeNode): void {
    if (this.#fromCommands(event)) return;
    this.select.emit(node);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    // why: phím bấm trên nút lệnh thuộc về nút đó — Enter/Space không được mở thư mục, mũi tên không được dời focus khỏi nút.
    if (this.#fromCommands(event)) return;
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

  /** The event started on a folder command (or the space between them) or on the actions trigger of the node. */
  #fromCommands(event: Event): boolean {
    const target = event.target instanceof Element ? event.target : null;
    const area = target?.closest(COMMAND_AREAS);
    return !!area && event.currentTarget instanceof Element && event.currentTarget.contains(area);
  }
}
