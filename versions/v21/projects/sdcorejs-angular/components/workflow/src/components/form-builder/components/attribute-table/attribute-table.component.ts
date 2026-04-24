/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { ISdWorkflowConfiguration, SD_WORKFLOW_CONFIGURATION } from '../../../../configurations';
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

// Template lÃ  cÃ¡c máº«u do Portal Ä‘á»‹nh nghÄ©a sáºµn (key, label ....) Ä‘á»ƒ ngÆ°á»i dÃ¹ng chá»n nhanh
// Khi thá»±c hiá»‡n sao chÃ©p 1 template chÃºng ta sáº½ CLONE Ä‘á»ƒ trÃ¡nh áº£nh hÆ°á»Ÿng template gá»‘c
@Component({
  selector: 'attribute-table',
  templateUrl: './attribute-table.component.html',
  imports: [
    MatIconModule,
    MatDividerModule,
    SdLabel,
    SdAutocomplete,
    SdButton,
    SdSection,
    SdModal,
    AttributeSelection,
    AttributeInput,
    AttributeSelect,
    AttributeSwitch,
    AttributeParameter
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
  tables: SdFormGenericDefinitionTable[] = [];

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
  constructor(@Inject(SD_WORKFLOW_CONFIGURATION) private workflowConfiguration: ISdWorkflowConfiguration) {
    this.tables = this.workflowConfiguration?.form?.tables || [];
  }

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
      key: SdUtilities.randomId('key'),
      label: SdUtilities.randomId('label'),
      type: 'string',
      width: '100px',
      validate: {},
    };
    this.modal?.open();
  };

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

