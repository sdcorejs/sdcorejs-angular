import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { sdGenericImportColumns, sdGenericImportable } from '../../core';
import type { SdGenericImportColumn, SdGenericSchema } from '../../models';

/** "Import" tab: imported columns, relation match fields and the upsert key. */
@Component({
  selector: 'sd-generic-configuration-import',
  templateUrl: './generic-configuration-import.component.html',
  styleUrl: '../generic-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, SdCheckbox, SdInput, SdSelect, SdTranslatePipe],
})
export class GenericConfigurationImport {
  readonly schema = input.required<SdGenericSchema>();
  readonly schemaChange = output<SdGenericSchema>();

  readonly columns = computed<SdGenericImportColumn[]>(() =>
    sdGenericImportColumns(this.schema()).map(column => ({
      key: column.key,
      ...(column.matchField ? { matchField: column.matchField } : {}),
    }))
  );
  readonly rows = computed(() => {
    const selected = new Map(this.columns().map(column => [column.key, column]));
    return this.schema()
      .general.properties.filter(sdGenericImportable)
      .map(property => ({ property, selected: selected.has(property.key), matchField: selected.get(property.key)?.matchField ?? '' }));
  });
  /** Only an imported single-value column can match existing records (AC-020). */
  readonly upsertOptions = computed(() =>
    sdGenericImportColumns(this.schema())
      .filter(column => !column.property.multiple)
      .map(column => ({ value: column.key, display: column.property.label }))
  );

  toggle(key: string, on: unknown): void {
    const columns = this.columns();
    this.#setImport({ columns: on === true ? [...columns, { key }] : columns.filter(column => column.key !== key) });
  }

  setMatchField(key: string, raw: unknown): void {
    const matchField = raw === undefined || raw === null ? '' : String(raw).trim();
    this.#setImport({
      columns: this.columns().map(column => (column.key === key ? { key, ...(matchField ? { matchField } : {}) } : column)),
    });
  }

  setUpsertKey(raw: unknown): void {
    const upsertKey = typeof raw === 'string' && raw ? raw : undefined;
    this.#setImport({ upsertKey });
  }

  #setImport(patch: { columns?: SdGenericImportColumn[]; upsertKey?: string }): void {
    const schema = this.schema();
    const next = { ...schema.import, ...patch };
    if (Object.hasOwn(patch, 'upsertKey') && patch.upsertKey === undefined) delete next.upsertKey;
    this.schemaChange.emit({ ...schema, import: next });
  }
}
