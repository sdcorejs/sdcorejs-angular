import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { sdGenericListColumns, sdGenericPageSize } from '../../core';
import type { SdGenericListColumn, SdGenericListSection, SdGenericSchema } from '../../models';

const NOT_FILTERABLE = new Set(['json', 'file']);

/** "List" tab: column order and flags, external filters, page size and export. */
@Component({
  selector: 'sd-generic-configuration-list',
  templateUrl: './generic-configuration-list.component.html',
  styleUrl: '../generic-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, SdButton, SdCheckbox, SdInput, SdInputNumber, SdTranslatePipe],
})
export class GenericConfigurationList {
  readonly schema = input.required<SdGenericSchema>();
  readonly schemaChange = output<SdGenericSchema>();

  readonly #announcer = inject(LiveAnnouncer);
  readonly #i18n = inject(I18nService);

  readonly columns = computed(() => sdGenericListColumns(this.schema()));
  readonly pageSize = computed(() => sdGenericPageSize(this.schema()));
  readonly rows = computed(() => {
    const schema = this.schema();
    const columns = this.columns();
    const filters = new Set((schema.list?.externalFilters ?? []).map(filter => filter.key));
    const shown = new Set(columns.map(column => column.key));
    const properties = new Map(schema.general.properties.map(property => [property.key, property]));
    const listed = columns.filter(column => properties.has(column.key)).map(column => ({ column, shown: true }));
    return [
      ...listed,
      ...schema.general.properties
        .filter(property => !shown.has(property.key))
        .map(property => ({ column: { key: property.key } as SdGenericListColumn, shown: false })),
    ].map((row, index) => ({
      ...row,
      label: properties.get(row.column.key)?.label ?? row.column.key,
      filter: filters.has(row.column.key),
      filterable: !NOT_FILTERABLE.has(properties.get(row.column.key)?.dataType ?? 'json'),
      first: index === 0,
      last: !row.shown || index === listed.length - 1,
    }));
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

  toggleColumn(key: string, shown: boolean): void {
    const columns = this.columns();
    this.setList({ columns: shown ? [...columns, { key }] : columns.filter(column => column.key !== key) });
  }

  setColumn(key: string, patch: Partial<SdGenericListColumn>): void {
    this.setList({ columns: this.columns().map(column => (column.key === key ? { ...column, ...patch } : column)) });
  }

  move(key: string, delta: -1 | 1): void {
    const columns = [...this.columns()];
    const index = columns.findIndex(column => column.key === key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= columns.length) return;
    [columns[index], columns[target]] = [columns[target], columns[index]];
    this.setList({ columns });
    // why: a screen reader does not report that the row moved; announce the new position of the column.
    const label = this.schema().general.properties.find(property => property.key === key)?.label ?? key;
    void this.#announcer.announce(this.#i18n.t('core.module.generic.configuration.moved', { label, position: target + 1 }));
  }

  toggleFilter(key: string, on: boolean): void {
    const filters = this.schema().list?.externalFilters ?? [];
    this.setList({ externalFilters: on ? [...filters, { key }] : filters.filter(filter => filter.key !== key) });
  }

  flag(value: unknown): boolean {
    return value === true;
  }
}
