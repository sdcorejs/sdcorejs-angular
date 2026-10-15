import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkDrag, type CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdGenericListColumns, sdGenericPageSize } from '../../core';
import type { SdGenericListColumn, SdGenericListSection, SdGenericProperty, SdGenericSchema } from '../../models';
import { GenericPropertyIdentity } from '../property-identity/generic-property-identity.component';

interface ColumnRow {
  column: SdGenericListColumn;
  property: SdGenericProperty;
  label: string;
  first: boolean;
  last: boolean;
}

/**
 * "List" tab: column order (drag-drop or move buttons) and flags, page size and export. External filters are
 * declared in code (backend schema or provideSdGenericEntity), not here (D-001).
 */
@Component({
  selector: 'sd-generic-configuration-list',
  templateUrl: './generic-configuration-list.component.html',
  styleUrl: '../generic-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    GenericPropertyIdentity,
    SdButton,
    SdCheckbox,
    SdIcon,
    SdInput,
    SdInputNumber,
    SdSection,
    SdTooltipDirective,
    SdTranslatePipe,
  ],
})
export class GenericConfigurationList {
  readonly schema = input.required<SdGenericSchema>();
  readonly schemaChange = output<SdGenericSchema>();

  readonly #announcer = inject(LiveAnnouncer);
  readonly #i18n = inject(I18nService);

  readonly columns = computed(() => sdGenericListColumns(this.schema()));
  readonly pageSize = computed(() => sdGenericPageSize(this.schema()));
  readonly #properties = computed(() => new Map(this.schema().general.properties.map(property => [property.key, property])));
  /** Columns of the table, in order; they match `list.columns` because merge drops unknown keys (INV-005). */
  readonly listedRows = computed<ColumnRow[]>(() => {
    const properties = this.#properties();
    const listed = this.columns().filter(column => properties.has(column.key));
    return listed.map((column, index) => {
      const property = properties.get(column.key)!;
      return { column, property, label: property.label || column.key, first: index === 0, last: index === listed.length - 1 };
    });
  });
  /** Properties that are not a column of the table; they can be added but not reordered. */
  readonly unlistedRows = computed<ColumnRow[]>(() => {
    const shown = new Set(this.columns().map(column => column.key));
    return this.schema()
      .general.properties.filter(property => !shown.has(property.key))
      .map(property => ({ column: { key: property.key }, property, label: property.label || property.key, first: false, last: true }));
  });

  setList(patch: Partial<SdGenericListSection>): void {
    const schema = this.schema();
    this.schemaChange.emit({ ...schema, list: { ...schema.list, ...patch } });
  }

  setTitle(raw: unknown): void {
    const title = raw === undefined || raw === null ? '' : String(raw);
    this.setList({ title: title || undefined });
  }

  setPageSize(raw: unknown): void {
    const value = Number(raw);
    if (Number.isInteger(value) && value > 0) this.setList({ pageSize: value });
  }

  /** Adding a column appends it to the end; neither adding nor removing is a reorder. */
  toggleColumn(key: string, shown: boolean): void {
    const columns = this.columns();
    this.setList({ columns: shown ? [...columns, { key }] : columns.filter(column => column.key !== key) });
  }

  setColumn(key: string, patch: Partial<SdGenericListColumn>): void {
    this.setList({ columns: this.columns().map(column => (column.key === key ? { ...column, ...patch } : column)) });
  }

  move(key: string, delta: -1 | 1): void {
    // why: `first` / `last` of the buttons come from the listed rows; move past the next listed row, like drop().
    const rows = this.listedRows();
    const target = rows[rows.findIndex(row => row.column.key === key) + delta]?.column.key;
    if (!target) return;
    const columns = this.columns();
    this.reorder(
      columns.findIndex(column => column.key === key),
      columns.findIndex(column => column.key === target)
    );
  }

  drop(event: CdkDragDrop<unknown>): void {
    // why: the drop list holds the listed rows only; translate its indices into positions in `list.columns`.
    const rows = this.listedRows();
    const from = rows[event.previousIndex]?.column.key;
    const to = rows[event.currentIndex]?.column.key;
    if (!from || !to) return;
    const columns = this.columns();
    this.reorder(
      columns.findIndex(column => column.key === from),
      columns.findIndex(column => column.key === to)
    );
  }

  /** The only writer of the column order (D-012, INV-005): indices are positions in `list.columns`. */
  reorder(fromIndex: number, toIndex: number): void {
    const columns = [...this.columns()];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= columns.length || toIndex >= columns.length) return;
    const key = columns[fromIndex].key;
    moveItemInArray(columns, fromIndex, toIndex);
    this.setList({ columns });
    // why: a screen reader does not report that the row moved; announce the new position of the column.
    const properties = this.#properties();
    const label = properties.get(key)?.label || key;
    // why: announce the position among the listed rows, which is what the user sees.
    const position = columns.slice(0, toIndex + 1).filter(column => properties.has(column.key)).length;
    void this.#announcer.announce(this.#i18n.t('core.module.generic.configuration.moved', { label, position }));
  }

  flag(value: unknown): boolean {
    return value === true;
  }
}
