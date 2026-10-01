import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { MappingRow, mappingText } from './mapping-summary';
import { ValueBoxComponent } from './value-box.component';

/** Khung xem của một ánh xạ `tên = giá trị`, sửa trong popup của component cha. */
@Component({
  selector: 'fb-mapping-box',
  template: `
    @let _rows = rows();
    <fb-value-box
      [label]="label()"
      [empty]="!_rows.length"
      [tooltip]="text()"
      [readonly]="readonly()"
      [editLabel]="'core.component.form-builder.value-box.edit' | sdTranslate"
      (edit)="edit.emit()">
      @for (row of _rows; track row.name) {
        <span class="map-row">
          <span class="map-row__name">{{ row.name }}</span>
          <span class="map-row__eq" aria-hidden="true"> = </span>
          <span class="map-row__value">{{ row.value }}</span>
        </span>
      } @empty {
        {{ 'core.component.form-builder.value-box.empty' | sdTranslate }}
      }
    </fb-value-box>
  `,
  styles: `
    :host {
      display: block;
    }
    .map-row {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .map-row__name {
      color: var(--sd-text);
      font-weight: var(--sd-font-weight-semibold, 600);
    }
    .map-row__eq {
      color: var(--sd-text-secondary);
    }
    .map-row__value {
      color: var(--sd-primary);
      font-family: 'Roboto Mono', ui-monospace, monospace;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueBoxComponent, SdTranslatePipe],
})
export class MappingBoxComponent {
  readonly label = input<string | undefined>(undefined);
  readonly rows = input<readonly MappingRow[]>([]);
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly edit = output<void>();

  readonly text = computed(() => mappingText(this.rows()));
}
