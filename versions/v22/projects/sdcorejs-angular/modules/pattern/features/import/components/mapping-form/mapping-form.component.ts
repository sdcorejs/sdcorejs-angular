import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { IMPORT_FIELDS, type ImportField, type ImportMapping } from '../../services/import.model';

/** Bước "Nhận diện & ánh xạ": chọn cột của nguồn cho từng field; mã và tên là bắt buộc. */
@Component({
  selector: 'mapping-form',
  standalone: true,
  imports: [SdSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="d-flex flex-column gap-8">
      @for (item of fields; track item.field) {
        <sd-select
          [label]="item.label"
          [items]="columns()"
          valueField="value"
          displayField="value"
          [required]="item.required"
          [autoId]="'import-map-' + item.field"
          [model]="mapping()[item.field]"
          [inlineError]="
            item.required && showErrors() && !mapping()[item.field] ? 'Chọn cột cho ' + item.label.toLowerCase() + '.' : undefined
          "
          (modelChange)="change(item.field, $event)" />
      }
    </div>
  `,
})
export class MappingFormComponent {
  readonly sourceColumns = input.required<readonly string[]>();
  readonly mapping = input.required<ImportMapping>();
  readonly showErrors = input(false);
  readonly mappingChange = output<ImportMapping>();
  protected readonly fields = IMPORT_FIELDS;
  protected readonly columns = computed(() => this.sourceColumns().map(value => ({ value })));

  protected change(field: ImportField, value: unknown): void {
    this.mappingChange.emit({ ...this.mapping(), [field]: typeof value === 'string' && value ? value : null });
  }
}
