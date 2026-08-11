import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SdQuery, SdSavedFilter } from '../../query-bar.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/**
 * Saved-filters dropdown for `sd-query-bar`.
 *
 * Self-contained: persists the list to `localStorage` under
 * `sd-query-bar:savedFilters:<key>` whenever the host passes a `[key]`. Without a
 * key the dropdown still renders (host can still preview the menu) but the
 * trigger stays disabled.
 *
 * The host owns the live `[query]`: each save snapshots it into a new entry,
 * each apply emits the chosen filter back via `(apply)` for the host to install
 * into its own `filters` / `logic` / `search` model.
 *
 * The save action (`promptSave`) is public so the parent toolbar can place its
 * own "Lưu bộ lọc" button anywhere — typically next to the Search trigger.
 */
@Component({
  selector: 'sd-query-saved-filters-menu',
  templateUrl: './saved-filters-menu.component.html',
  styleUrl: './saved-filters-menu.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, MatMenuModule, MatTooltipModule],
})
export class SdQuerySavedFiltersMenu {
  /** Namespace key used to scope localStorage. `undefined` → menu disabled. */
  readonly key = input<string | undefined>(undefined);

  /** Current query the host wants to snapshot when the user clicks "Save current". */
  readonly query = input<SdQuery>({ filters: [], logic: 'AND' });

  /** Fired when the user picks a saved filter from the list. */
  readonly apply = output<SdSavedFilter>();

  readonly savedFilters = signal<SdSavedFilter[]>([]);

  readonly #storageKey = computed<string | undefined>(() => {
    const k = this.key();
    return k ? `sd-query-bar:savedFilters:${k}` : undefined;
  });

  // why: reload whenever the namespace key changes (e.g. host switches user/context).
  readonly #loadFilters = effect(() => {
    const storage = this.#storageKey();
    if (!storage) {
      this.savedFilters.set([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storage);
      this.savedFilters.set(raw ? JSON.parse(raw) : []);
    } catch {
      this.savedFilters.set([]);
    }
  });

  #persist(filters: SdSavedFilter[]): void {
    const storage = this.#storageKey();
    if (!storage) return;
    try {
      localStorage.setItem(storage, JSON.stringify(filters));
    } catch {
      /* quota / disabled storage — silent */
    }
  }

  /**
   * Prompt for a name and append a snapshot of the current query as a new
   * saved filter. Public so the parent toolbar can wire its external "save"
   * button to this method without re-implementing persistence.
   */
  promptSave(): void {
    if (!this.#storageKey()) return;
    const name = window.prompt('Tên bộ lọc:');
    if (!name?.trim()) return;
    const filter: SdSavedFilter = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: name.trim(),
      query: this.query(),
    };
    const next = [...this.savedFilters(), filter];
    this.savedFilters.set(next);
    this.#persist(next);
  }

  /** Apply a saved filter — host re-installs filters/logic/search via `(apply)`. */
  pick(filter: SdSavedFilter): void {
    this.apply.emit(filter);
  }

  /** Delete a saved filter by id. Stops propagation so the parent button doesn't fire `pick`. */
  remove(id: string, ev?: Event): void {
    ev?.stopPropagation();
    const next = this.savedFilters().filter(f => f.id !== id);
    this.savedFilters.set(next);
    this.#persist(next);
  }
}
