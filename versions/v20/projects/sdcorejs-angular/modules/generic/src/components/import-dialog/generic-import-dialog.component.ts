import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { SdImportExcel, type SdImportExcelOption, type SdImportExcelValidation } from '@sdcorejs/angular/components/import-excel';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import type { SdGenericImportCellError } from '../../core';
import type { SdGenericSchema } from '../../models';
import { SdGenericImportService } from '../../services';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** sd-import-excel renders row messages as HTML; spreadsheet and backend text must stay text (ST-002). */
const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, character => HTML_ESCAPES[character]);

const CELL_MESSAGES: Record<SdGenericImportCellError['code'], string> = {
  'relation-not-found': 'core.module.generic.import.not-found',
  'enum-unknown': 'core.module.generic.import.enum-unknown',
  'number-invalid': 'core.module.generic.import.number-invalid',
  'match-ambiguous': 'core.module.generic.import.match-ambiguous',
};

/** Excel import of one entity: template from the import columns, rows saved through `SdGenericImportService`. */
@Component({
  selector: 'sd-generic-import-dialog',
  templateUrl: './generic-import-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdImportExcel],
  providers: [SdGenericImportService],
})
export class GenericImportDialog {
  readonly schema = input.required<SdGenericSchema>();
  /** Emitted after an import saved at least one row. */
  readonly imported = output<void>();

  readonly #importer = inject(SdGenericImportService);
  readonly #notify = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  readonly excel = viewChild(SdImportExcel);

  readonly option = computed<SdImportExcelOption<Record<string, unknown>>>(() => {
    const schema = this.schema();
    return {
      title: this.#i18n.t('core.module.generic.import.title', { label: schema.general.label }),
      fileName: `${schema.module}-${schema.entity}`,
      columns: this.#importer.columns(schema).map(column => ({
        field: column.key,
        title: column.property.label,
        type: column.property.dataType === 'number' ? ('number' as const) : ('string' as const),
        required: !!column.property.validation?.required,
        ...(column.property.dataType === 'enum'
          ? { description: (column.property.enums ?? []).map(option => option.label).join(', ') }
          : {}),
      })),
      accept: items => this.#accept(schema, items),
    };
  });

  open(): void {
    this.excel()?.open();
  }

  async #accept(schema: SdGenericSchema, items: Record<string, unknown>[]): Promise<SdImportExcelValidation[]> {
    let validations: SdImportExcelValidation[];
    try {
      const results = await this.#importer.run(schema, items);
      const saved = results.filter(result => result.status !== 'error');
      if (saved.length) {
        const created = saved.filter(result => result.status === 'created').length;
        const updated = saved.length - created;
        this.#notify.success(
          `${this.#i18n.t('core.module.generic.import.created')}: ${created} · ${this.#i18n.t('core.module.generic.import.updated')}: ${updated}`
        );
        this.imported.emit();
      }
      validations = results
        .filter(result => result.status === 'error')
        .map(result => ({
          idx: result.index,
          errorMessage: escapeHtml(result.message ?? result.errors.map(error => this.#cellError(schema, error)).join('; ')),
        }));
    } catch (error) {
      this.#notify.error(error instanceof Error ? error.message : String(error));
      return [];
    }
    // why: sd-import-excel ignores the value returned by `accept`; the row results only show through setValidation.
    this.excel()?.setValidation(validations);
    return validations;
  }

  #cellError(schema: SdGenericSchema, error: SdGenericImportCellError): string {
    const label = schema.general.properties.find(property => property.key === error.key)?.label ?? error.key;
    return this.#i18n.t(CELL_MESSAGES[error.code], { label, value: String(error.value) });
  }
}
