import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

import { SdQuery, SdSavedFilter } from '../../query-bar.model';
import { ɵSdQueryPanelDirective, ɵSdQueryPanelTriggerDirective } from '../panel/query-panel';
import { ɵsdReadSavedFilters, ɵsdSavedFiltersStorageKey } from './saved-filters-storage';

let nextHeadingId = 0;

/**
 * Saved-filters dropdown for `sd-query-bar` (handoff section 5).
 *
 * Self-contained: persists the list to `localStorage` under `sd-query-bar:savedFilters:<key>` whenever the host passes
 * a `[key]`. Without a key the trigger stays disabled.
 *
 * The host owns the live `[query]`: each save snapshots it into a new entry, each apply emits the chosen filter back via
 * `(apply)` for the host to install into its own `filters` / `logic` / `search`. Deleting asks nothing: the toast offers
 * Undo, which puts the filter back where it was.
 */
@Component({
  selector: 'sd-query-saved-filters-menu',
  templateUrl: './saved-filters-menu.component.html',
  styleUrl: './saved-filters-menu.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, MatTooltipModule, ɵSdQueryPanelDirective, ɵSdQueryPanelTriggerDirective],
})
export class SdQuerySavedFiltersMenu {
  readonly #i18n = inject(I18nService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly tooltipLabel = computed(() => this.#i18n.t('core.component.query-bar.saved-filters.tooltip'));
  readonly tooltipDisabledLabel = computed(() => this.#i18n.t('core.component.query-bar.saved-filters.tooltip-disabled'));
  readonly headingLabel = computed(() => this.#i18n.t('core.component.query-bar.saved-filters.heading'));
  readonly emptyLabel = computed(() => this.#i18n.t('core.component.query-bar.saved-filters.empty'));
  readonly readErrorLabel = computed(() => this.#i18n.t('core.component.query-bar.saved-filters.read-error'));
  readonly saveLabel = computed(() => this.#i18n.t('core.component.query-bar.saved-filters.save'));
  readonly headingId = `sd-query-saved-filters-heading-${nextHeadingId++}`;

  /** Namespace key used to scope localStorage. `undefined` → menu disabled. */
  readonly key = input<string | undefined>(undefined);

  /** Current query the host wants to snapshot when the user clicks "Save current". */
  readonly query = input<SdQuery>({ filters: [], logic: 'AND' });

  /** `false` disables "Save current filter": no chip has a value and the search box is empty. */
  readonly canSave = input(true, { transform: booleanAttribute });

  /** Prefix of `data-autoid` (handoff section 12). */
  readonly autoId = input<string | undefined>(undefined);

  /** Fired when the user picks a saved filter from the list. */
  readonly apply = output<SdSavedFilter>();

  readonly savedFilters = signal<SdSavedFilter[]>([]);
  /** The stored list could not be read (broken JSON, not an array, storage blocked). Saving replaces it. */
  readonly readError = signal(false);
  /** Delete buttons always shown at touch size (`pointer: coarse`), read when the panel opens. */
  readonly coarse = signal(false);

  readonly panel = viewChild.required<ɵSdQueryPanelDirective>('panel');

  readonly #storageKey = computed<string | undefined>(() => {
    const k = this.key();
    return k ? ɵsdSavedFiltersStorageKey(k) : undefined;
  });

  // why: reload whenever the namespace key changes (e.g. host switches user/context).
  readonly #loadFilters = effect(() => {
    const storage = this.#storageKey();
    if (!storage) {
      this.savedFilters.set([]);
      this.readError.set(false);
      return;
    }
    let read: { filters: SdSavedFilter[]; error: boolean };
    try {
      read = ɵsdReadSavedFilters(localStorage.getItem(storage));
    } catch {
      // Storage bị chặn (SecurityError): như dữ liệu đọc không được.
      read = { filters: [], error: true };
    }
    this.savedFilters.set(read.filters);
    this.readError.set(read.error);
  });

  deleteLabel(name: string): string {
    return this.#i18n.t('core.component.query-bar.saved-filters.delete', { name });
  }

  autoIdOf(role: string): string | null {
    const base = this.autoId();
    return base ? `${base}-${role}` : null;
  }

  /** Before the panel renders: touch devices show delete buttons without hover. */
  onOpening(): void {
    this.coarse.set(typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches);
  }

  /**
   * Prompt for a name and append a snapshot of the current query as a new saved filter. The bar itself does not change.
   */
  async promptSave(): Promise<void> {
    if (!this.#storageKey()) return;
    // why: window.prompt chặn UI thread, không style/i18n được và bị vô hiệu trong vài môi trường (iframe sandbox) —
    // dialog withInput dùng chung hạ tầng confirm của lib.
    let name: string | undefined;
    try {
      name = await this.#confirm.withInput(this.#i18n.t('core.component.query-bar.saved-filters.name-label'), {
        title: this.#i18n.t('core.component.query-bar.saved-filters.save'),
        required: true,
      });
    } catch {
      return; // user huỷ dialog
    }
    if (!name?.trim()) return;
    const filter: SdSavedFilter = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: name.trim(),
      query: this.query(),
    };
    this.#write([...this.savedFilters(), filter]);
  }

  /** Apply a saved filter — host re-installs filters/logic/search via `(apply)`. */
  pick(filter: SdSavedFilter): void {
    this.panel().close('select');
    this.apply.emit(filter);
  }

  onSave(): void {
    this.panel().close('select');
    void this.promptSave();
  }

  /** Deletes the filter at `index` at once; the toast offers Undo. */
  remove(index: number): void {
    const list = this.savedFilters();
    const removed = list[index];
    if (!removed || !this.#write(list.filter((_, i) => i !== index))) return;
    const storage = this.#storageKey();
    this.#notify.info(removed.name, {
      title: this.#i18n.t('core.component.query-bar.saved-filters.deleted'),
      actionLabel: this.#i18n.t('core.component.query-bar.saved-filters.undo'),
      onAction: () => this.#restore(removed, index, storage),
    });
  }

  /** Delete from the panel: focus moves to the next row, else to "Save current filter". */
  removeAt(index: number): void {
    this.remove(index);
    this.#cdr.detectChanges();
    const root = this.panel().element();
    if (!root) return;
    const next =
      this.#applyButtons(root)[index] ??
      root.querySelector<HTMLButtonElement>('.c-sf-save:not(:disabled)') ??
      this.#applyButtons(root).at(-1);
    (next ?? root).focus();
  }

  /**
   * Arrow keys move over the apply buttons and "Save current filter" only (handoff section 5.3); → or Tab reach the
   * delete button of the row, ← or Shift+Tab come back; Delete removes the filter of an apply button.
   */
  onKeydown(event: KeyboardEvent): void {
    const root = this.panel().element();
    const target = event.target as HTMLElement;
    if (!root) return;
    // why: nút xoá cũng là menuitem nhưng nằm ngoài vòng mũi tên — chọn theo class, không theo role.
    const items = Array.from(root.querySelectorAll<HTMLButtonElement>('.c-sf-apply:not(:disabled), .c-sf-save:not(:disabled)'));
    const row = target.closest<HTMLElement>('.c-sf-row');
    const index = row ? Array.from(root.querySelectorAll('.c-sf-row')).indexOf(row) : -1;
    const onApply = target.classList.contains('c-sf-apply');
    const onDelete = target.classList.contains('c-sf-del');
    const current = onDelete
      ? items.indexOf(row!.querySelector<HTMLButtonElement>('.c-sf-apply')!)
      : items.indexOf(target as HTMLButtonElement);
    const focusItem = (position: number): void => {
      if (items.length) items[(position + items.length) % items.length].focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        focusItem(current + 1);
        break;
      case 'ArrowUp':
        focusItem(current < 0 ? -1 : current - 1);
        break;
      case 'Home':
        focusItem(0);
        break;
      case 'End':
        focusItem(-1);
        break;
      case 'ArrowRight':
        if (!onApply) return;
        row!.querySelector<HTMLButtonElement>('.c-sf-del')!.focus();
        break;
      case 'ArrowLeft':
        if (!onDelete) return;
        row!.querySelector<HTMLButtonElement>('.c-sf-apply')!.focus();
        break;
      case 'Tab':
        // why: Tab ra khỏi panel thì panel tự đóng; chỉ giữ lại hai bước trong cùng một hàng.
        if (onApply && !event.shiftKey) row!.querySelector<HTMLButtonElement>('.c-sf-del')!.focus();
        else if (onDelete && event.shiftKey) row!.querySelector<HTMLButtonElement>('.c-sf-apply')!.focus();
        else return;
        break;
      case 'Delete':
        if (!onApply) return;
        this.removeAt(index);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  #applyButtons(root: HTMLElement): HTMLButtonElement[] {
    return Array.from(root.querySelectorAll<HTMLButtonElement>('.c-sf-apply'));
  }

  /** Undo of a delete: back at its old index, clamped to the current length. */
  #restore(filter: SdSavedFilter, index: number, storage: string | undefined): void {
    const list = this.savedFilters();
    if (storage !== this.#storageKey() || list.some(item => item.id === filter.id)) return;
    const at = Math.min(index, list.length);
    this.#write([...list.slice(0, at), filter, ...list.slice(at)]);
  }

  /**
   * Shows `next` and writes it. A failing write (quota, blocked storage) puts the previous list back and shows an error
   * toast without the exception text.
   */
  #write(next: SdSavedFilter[]): boolean {
    const storage = this.#storageKey();
    if (!storage) return false;
    const previous = this.savedFilters();
    this.savedFilters.set(next);
    try {
      localStorage.setItem(storage, JSON.stringify(next));
    } catch {
      this.savedFilters.set(previous);
      this.#notify.error(this.#i18n.t('core.component.query-bar.saved-filters.write-error'));
      return false;
    }
    this.readError.set(false);
    return true;
  }
}
