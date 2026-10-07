import { ChangeDetectionStrategy, Component, computed, inject, input, viewChildren } from '@angular/core';
import { SdButton, SdButtonItem, type SdButtonColor, type SdButtonSize, type SdButtonType } from '@sdcorejs/angular/components/button';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdFileExplorerActionBlocked, sdFileExplorerActionsBusy, sdFileExplorerResolveActions } from '../file-explorer-actions';
import type { SdFileExplorerAction, SdFileExplorerActionGroup, SdFileExplorerActionLeaf } from '../file-explorer.model';

/**
 * Action area of the explorer (internal): `selector.actions`, `fileCommands` or `folderCommands` for one context.
 *
 * A leaf renders as an `sd-button` that runs its `click`; a group as an `sd-button` whose projected
 * `sd-button-item`s open in the button's own Action Popover. Siblings keep their declared order and wrap onto another
 * line when the area is narrow — nothing is folded into an automatic overflow menu.
 *
 * The host carries `sd-file-explorer-actions--open` while one of its menus is open and `--busy` while an entry is
 * loading, so the row, card or tree node can keep an area that is otherwise revealed on hover visible.
 */
@Component({
  selector: 'sd-file-explorer-actions',
  standalone: true,
  imports: [SdButton, SdButtonItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-actions',
    '[class.sd-file-explorer-actions--open]': 'open()',
    '[class.sd-file-explorer-actions--busy]': 'busy()',
  },
  template: `
    @let _autoId = autoId();
    @let _size = size();
    @for (entry of entries(); track entry.key) {
      @let _entryAutoId = _autoId ? _autoId + '-' + entry.key : null;
      @if (entry.kind === 'leaf') {
        <sd-button
          class="action"
          [type]="entry.type"
          [color]="entry.color"
          [size]="_size"
          [title]="entry.title"
          [tooltip]="entry.tooltip"
          [prefixIcon]="entry.prefixIcon"
          [suffixIcon]="entry.suffixIcon"
          [fontSet]="entry.fontSet"
          [disabled]="entry.disabled"
          [loading]="entry.loading"
          [attr.data-autoid]="_entryAutoId"
          (click)="run(entry.definition)" />
      } @else {
        <sd-button
          class="action action--group"
          [type]="entry.type"
          [color]="entry.color"
          [size]="_size"
          [title]="entry.title"
          [tooltip]="entry.tooltip"
          [prefixIcon]="entry.prefixIcon"
          [suffixIcon]="entry.suffixIcon"
          [fontSet]="entry.fontSet"
          [disabled]="entry.disabled"
          [loading]="entry.loading"
          [attr.data-autoid]="_entryAutoId">
          @for (child of entry.children; track child.key) {
            <sd-button-item
              [color]="child.color"
              [prefixIcon]="child.prefixIcon"
              [suffixIcon]="child.suffixIcon"
              [fontSet]="child.fontSet"
              [tooltip]="child.tooltip"
              [disabled]="child.disabled"
              [autoId]="_entryAutoId ? _entryAutoId + '-' + child.key : null"
              (click)="run(child.definition, entry.definition)">
              <!-- why: sd-button-item has no loading input; a busy item shows a spinner here and is disabled. -->
              @if (child.loading) {
                <span class="spinner" aria-hidden="true"></span>
              }
              {{ child.label }}
              @if (child.loading) {
                <span class="visually-hidden">{{ loadingLabel() }}</span>
              }
            </sd-button-item>
          }
        </sd-button>
      }
    }
  `,
  styleUrl: './actions.component.scss',
})
export class SdFileExplorerActions<T> {
  readonly #i18n = inject(I18nService);

  /** Definitions to render. */
  readonly actions = input<readonly SdFileExplorerAction<T>[] | null | undefined>(undefined);
  /** Value handed to `click` and to the state predicates: the selected files, or one item. */
  readonly context = input.required<T>();
  /** Variant of leaves (flat buttons) without `type`. */
  readonly defaultLeafType = input<SdButtonType>('text');
  /** Variant of group triggers without `type`. */
  readonly defaultGroupType = input<SdButtonType>('text');
  /** Color of definitions without `color`. */
  readonly defaultColor = input<SdButtonColor>('secondary');
  /** `sd-button` size of every entry. */
  readonly size = input<SdButtonSize>('sm');
  /** Collection name used in dev-mode warnings. */
  readonly source = input('actions');
  /** Prefix of the entries' `data-autoid`, suffixed with the declared index (and the child index in menus). */
  readonly autoId = input<string | undefined>(undefined);

  // why: Angular query không dùng được trên field private kiểu ES (#) — dùng `private` của TypeScript.
  private readonly buttons = viewChildren(SdButton);

  protected readonly entries = computed(() =>
    sdFileExplorerResolveActions(
      this.actions(),
      this.context(),
      { leafType: this.defaultLeafType(), groupType: this.defaultGroupType(), color: this.defaultColor() },
      this.source()
    )
  );
  protected readonly open = computed(() => this.buttons().some(button => button.popover.opened()));
  protected readonly busy = computed(() => sdFileExplorerActionsBusy(this.entries()));
  protected readonly loadingLabel = computed(() => this.#i18n.t('core.component.file-explorer.action-loading'));

  protected run(action: SdFileExplorerActionLeaf<T>, group?: SdFileExplorerActionGroup<T>): void {
    const actions = this.actions();
    // A stale rendered button or menu must not dispatch a definition the consumer has withdrawn.
    if (group ? !actions?.includes(group) || !group.children.includes(action) : !actions?.includes(action)) return;
    const context = this.context();
    // why: trạng thái do consumer giữ có thể đã đổi sau lần render cuối (ví dụ bật loading ngay trong click trước, khi
    // Angular chưa kịp vẽ lại nút) — đánh giá lại lúc bấm để click lặp hay menu cũ không chạy callback lần nữa.
    if ((group && sdFileExplorerActionBlocked(group, context)) || sdFileExplorerActionBlocked(action, context)) return;
    action.click(context);
  }
}
