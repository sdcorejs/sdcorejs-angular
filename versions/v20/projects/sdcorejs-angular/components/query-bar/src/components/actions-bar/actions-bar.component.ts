/* eslint-disable @typescript-eslint/no-explicit-any */
import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SdQuery, SdQueryLogic, SdSavedFilter } from '../../query-bar.model';
import { SdQuerySavedFiltersMenu } from '../saved-filters-menu/saved-filters-menu.component';

/**
 * Right-pinned toolbar for `sd-query-bar`: AND/OR connector toggle, clear-all,
 * saved-filters dropdown (with footer "Lưu bộ lọc hiện tại"), and the deferred
 * Search trigger. Owns no business logic — just routes user intent back via
 * outputs (`(logic)` model, `(clear)`, `(search)`, `(applyFilter)`).
 *
 * The "save current query" action lives INSIDE the saved-filters mat-menu
 * footer (one zone for both apply + save). The dropdown trigger sits
 * immediately before Search so the user sees one filter-cluster on the right.
 */
@Component({
  selector: 'sd-query-actions-bar',
  templateUrl: './actions-bar.component.html',
  styleUrl: './actions-bar.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule, SdQuerySavedFiltersMenu],
})
export class SdQueryActionsBar {
  // AND/OR toggle —
  readonly showLogicToggle = input(false, { transform: booleanAttribute });
  readonly logic = model<SdQueryLogic>('AND');
  readonly filtersCount = input(0);

  // Saved filters —
  readonly showSavedFilters = input(false, { transform: booleanAttribute });
  readonly savedFiltersKey = input<string | undefined>(undefined);
  readonly query = input<SdQuery>({ filters: [], logic: 'AND' });
  readonly applyFilter = output<SdSavedFilter>();

  // Clear-all —
  readonly showClearAll = input(true, { transform: booleanAttribute });
  readonly clear = output<void>();

  // Search trigger —
  readonly canSearch = input(false);
  readonly search = output<void>();

  setLogic(value: SdQueryLogic): void {
    if (this.logic() === value) return;
    this.logic.set(value);
  }
}
