import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdInput } from '@sdcorejs/angular/forms/input';
import {
  SdFormGenericComponent,
  SdFormGenericDefinitionSelection,
  SdFormGenericGroup,
  SdFormGenericSelectionStaticItem,
  SdFormGenericTableColumn,
  SdFormGenericValues,
  SdFormGenericVariable,
} from '../../../../models';
import { FormGenericService } from '../../../../services';
import { BuildQueries } from './components/build-queries/build-queries.component';
import { BuildVariables } from './components/build-variables/build-variables.component';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

// Template là các mẫu do Portal định nghĩa sẵn (key, label ....) để người dùng chọn nhanh
// Khi thực hiện sao chép 1 template chúng ta sẽ CLONE để tránh ảnh hưởng template gốc
@Component({
  selector: 'attribute-selection',
  templateUrl: './attribute-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInput, SdAutocomplete, SdButton, SdSection, BuildQueries, BuildVariables, SdTranslatePipe],
})
export class AttributeSelection implements OnInit {
  private ref = inject(ChangeDetectorRef);
  private formGenericService = inject(FormGenericService);

  readonly components = input.required<(SdFormGenericComponent | SdFormGenericGroup)[]>();
  readonly variables = input.required<SdFormGenericVariable[]>();
  @Input({ required: true }) component!: SdFormGenericValues | SdFormGenericTableColumn;
  // ValuesKey
  valuesKey?: string;
  @Input({ alias: 'valuesKey', required: true }) set _valuesKey(valuesKey: string | undefined | null) {
    if (this.valuesKey !== valuesKey) {
      this.valuesKey = valuesKey?.toString();
    }
  }
  readonly sdValuesKeyChange = output<string>();
  selections: SdFormGenericDefinitionSelection[] = [];

  // Values
  values: SdFormGenericSelectionStaticItem[] = [];
  @Input({ alias: 'values', required: true }) set _values(values: SdFormGenericSelectionStaticItem[] | undefined | null) {
    if (this.values !== values) {
      this.values = values || [];
    }
  }
  readonly sdValuesChange = output<SdFormGenericSelectionStaticItem[]>();
  readonly sdChange = output<SdFormGenericComponent>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.formGenericService.selection.definitions().then(selections => {
      // Nếu không phải là type select thì không hiển thị các lựa chọn lazyValues
      // Vì radio, checklist không thể load lazy
      if (this.component.type !== 'select') {
        this.selections = selections.filter(selection => !('lazyValues' in selection) && !('lazyValuesKey' in selection));
      } else {
        this.selections = selections;
      }
      this.ref.markForCheck();
    });
  }

  onChangeValuesKey = (value: any) => {
    this.sdValuesKeyChange.emit(value);
    // Gán values rỗng nếu đã sử dụng valuesKey
    this.values = [];
    this.sdValuesChange.emit(this.values);
    this.ref.markForCheck();
  };

  onChangeValues = () => {
    this.sdValuesChange.emit(this.values);
  };

  addItem = () => {
    this.values.push({
      value: `value_${new Date().getTime().toString(36)}`,
      label: `Label ${new Date().getTime().toString(36)}`,
    });
    this.sdValuesChange.emit(this.values);
    this.ref.markForCheck();
  };

  removeItem = (idx: number) => {
    this.values.splice(idx, 1);
    this.sdValuesChange.emit(this.values);
    this.ref.markForCheck();
  };
}
