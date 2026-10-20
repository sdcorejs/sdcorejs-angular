import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

/** What the unknown-total paginator renders; computed by `SdTable`. */
export interface SdTableUnknownTotalPagerState {
  /** Page the controls navigate from: the shown page, or the failed target after a read error. */
  pageIndex: number;
  /** Page size of the latest request. */
  pageSize: number;
  /** 1-based rows on screen; omitted when no row of the shown page is rendered. */
  range?: { from: number; to: number };
  hasPrevious: boolean;
  /** Only true when the shown page is settled and its loader reported `hasMore`. */
  hasNext: boolean;
  /** A read is scheduled or running; every control is inert so it cannot queue a duplicate request. */
  busy: boolean;
}

export interface SdTableUnknownTotalPageEvent {
  pageIndex: number;
  pageSize: number;
}

let nextId = 0;

/**
 * @internal Paginator of `<sd-table>` for `paginate.total: 'unknown'`.
 *
 * why: `mat-paginator` derives Next/Last and its range from `length`; driving it without a total
 * would need a fake length. This view keeps the same markup classes, tokens and `MatPaginatorIntl`
 * labels as `mat-paginator`, so the table footer, theming and i18n stay identical, but it renders
 * only facts: the rows actually shown, Previous/Next from `hasMore`, and no total or last page.
 */
@Component({
  selector: 'sd-table-unknown-total-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule],
  templateUrl: './unknown-total-paginator.component.html',
  styleUrl: './unknown-total-paginator.component.scss',
  host: {
    class: 'mat-mdc-paginator sd-table-unknown-total-paginator',
    role: 'group',
    '[attr.aria-busy]': 'state().busy ? "true" : null',
    '[attr.data-autoid]': 'autoId() ? autoId() + "-paginator" : null',
  },
})
export class SdTableUnknownTotalPaginator {
  readonly state = input.required<SdTableUnknownTotalPagerState>();
  readonly pageSizeOptions = input<number[] | undefined>([]);
  readonly hidePageSize = input(false, { transform: booleanAttribute });
  /** First page needs no total, so it follows `showFirstLastButtons`; a last-page button is never rendered. */
  readonly showFirstButton = input(false, { transform: booleanAttribute });
  readonly autoId = input<string | null | undefined>();
  readonly page = output<SdTableUnknownTotalPageEvent>();

  readonly intl = inject(MatPaginatorIntl);
  readonly pageSizeLabelId = `sd-table-unknown-total-page-size-${nextId++}`;

  readonly displayedPageSizeOptions = computed(() => {
    const options = new Set((this.pageSizeOptions() ?? []).filter(size => size > 0));
    options.add(this.state().pageSize);
    return [...options].sort((a, b) => a - b);
  });

  // Same format as the known-total label (`SdTablePaginatorIntl.getRangeLabel`) minus the `/total` part.
  readonly rangeLabel = computed(() => {
    const range = this.state().range;
    return range ? `${range.from}-${range.to}` : '';
  });

  readonly previousDisabled = computed(() => !this.state().hasPrevious);
  readonly nextDisabled = computed(() => !this.state().hasNext);

  first(): void {
    if (this.previousDisabled()) return;
    this.page.emit({ pageIndex: 0, pageSize: this.state().pageSize });
  }

  previous(): void {
    if (this.previousDisabled()) return;
    this.page.emit({ pageIndex: this.state().pageIndex - 1, pageSize: this.state().pageSize });
  }

  next(): void {
    if (this.nextDisabled()) return;
    this.page.emit({ pageIndex: this.state().pageIndex + 1, pageSize: this.state().pageSize });
  }

  changePageSize(pageSize: number): void {
    if (this.state().busy || pageSize === this.state().pageSize) return;
    // why: offsets of the old page size do not map onto the new one without a total; restart at the first page.
    this.page.emit({ pageIndex: 0, pageSize });
  }
}
