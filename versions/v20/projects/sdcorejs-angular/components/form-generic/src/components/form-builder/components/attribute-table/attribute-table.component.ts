import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { Utilities } from '@sdcorejs/utils/fns';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../../../../configurations';
import {
  SdFormGenericComponent,
  SdFormGenericDefinitionTable,
  SdFormGenericGroup,
  SdFormGenericTableColumn,
  SdFormGenericVariable,
  TableColumnTypes,
} from '../../../../models';
import { AttributeInput } from '../attribute-input/attribute-input.component';
import { AttributeSelect } from '../attribute-select/attribute-select.component';
import { AttributeSelection } from '../attribute-selection/attribute-selection.component';
import { AttributeSwitch } from '../attribute-switch/attribute-switch.component';
import { AttributeParameter } from '../attribute-parameter/attribute-parameter.component';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

// Template là các mẫu do Portal định nghĩa sẵn (key, label ....) để người dùng chọn nhanh
// Khi thực hiện sao chép 1 template chúng ta sẽ CLONE để tránh ảnh hưởng template gốc
@Component({
  selector: 'attribute-table',
  templateUrl: './attribute-table.component.html',
  imports: [
    MatDividerModule,
    SdLabel,
    SdAutocomplete,
    SdButton,
    SdModal,
    AttributeSelection,
    AttributeInput,
    AttributeSelect,
    AttributeSwitch,
    AttributeParameter,
    TranslatePipe,
  ],
})
export class AttributeTable {
  @ViewChild(SdModal) modal?: SdModal;
  form = new FormGroup({});
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  // ColumnsKey
  columnsKey?: string;
  @Input({ alias: 'columnsKey', required: true }) set _columnsKey(columnsKey: string | undefined | null) {
    if (this.columnsKey !== columnsKey) {
      this.columnsKey = columnsKey?.toString();
    }
  }
  @Output() columnsKeyChange = new EventEmitter<string>();
  private readonly formGenericConfiguration: ISdFormGenericConfiguration | null = inject(SD_FORM_GENERIC_CONFIGURATION, { optional: true });
  tables: SdFormGenericDefinitionTable[] = this.formGenericConfiguration?.form?.tables || [];

  // Columns
  types = TableColumnTypes;
  columns: SdFormGenericTableColumn[] = [];
  @Input({ alias: 'columns', required: true }) set _columns(columns: SdFormGenericTableColumn[] | undefined | null) {
    if (this.columns !== columns) {
      this.columns = columns || [];
    }
  }
  @Output() columnsChange = new EventEmitter<SdFormGenericTableColumn[]>();
  column?: SdFormGenericTableColumn;

  onChangeColumnsKey = (value: any) => {
    this.columnsKeyChange.emit(value);
    const table = this.tables.find(e => e.value === value);
    if (table) {
      this.columns = table.columns();
    } else {
      this.columns = [];
    }
    this.columnsChange.emit(this.columns);
  };

  addColumn = () => {
    this.selectedIdx = undefined;
    this.column = {
      key: Utilities.randomId('key'),
      label: Utilities.randomId('label'),
      type: 'string',
      width: '100px',
      validate: {},
    };
    this.modal?.open();
  };

  // Map column type → Material Symbol icon (per design handoff form-builder redesign).
  readonly columnTypeIcons: Record<string, string> = {
    string: 'text_fields',
    number: '123',
    boolean: 'check_box',
    bool: 'check_box',
    date: 'event',
    datetime: 'calendar_month',
    radio: 'radio_button_checked',
    values: 'arrow_drop_down_circle',
    image: 'image',
    file: 'attach_file',
  };
  columnTypeSymbol = (type: string | undefined): string => this.columnTypeIcons[type || 'string'] ?? 'text_fields';

  selectedIdx? = 0;
  editColumn = (idx: number) => {
    if (this.columns[idx]) {
      this.selectedIdx = idx;
      this.column = JSON.parse(JSON.stringify(this.columns[idx]));
      this.column!.validate = this.column?.validate || {};
      this.modal?.open();
    }
  };

  removeColumn = (idx: number) => {
    this.columns.splice(idx, 1);
    this.columnsChange.emit(this.columns);
  };

  onConfirm = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.column) {
      if (this.selectedIdx! >= 0) {
        this.columns.splice(this.selectedIdx!, 1, this.column);
      } else {
        this.columns.push(this.column);
      }
      this.columnsChange.emit(this.columns);
    }
    this.modal?.close();
  };
}
