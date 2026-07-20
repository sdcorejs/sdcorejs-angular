import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild, OnInit, inject, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { Utilities } from '@sdcorejs/utils/fns';
import { ArrayUtilities, DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import {
  Attribute,
  AttributeOperators,
  DayInfoPreviouses,
  DayInfoTypes,
  SdFormGenericExpression,
  SdFormGenericExpressionCondition,
} from '../../../../models';
import { ExpressionQueryPipe } from '../../../../pipes';
import { SdSuffixDefDirective } from '@sdcorejs/angular/forms/directives';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

// Component xây dựng Expression dựa vào SdFormGenericExpression
@Component({
  selector: 'expression-builder',
  templateUrl: './expression-builder.component.html',
  styleUrl: './expression-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SdInput,
    SdInputNumber,
    SdSelect,
    SdAutocomplete,
    SdButton,
    SdSelect,
    SdModal,
    ExpressionQueryPipe,
    SdDatetime,
    SdSuffixDefDirective,
    TranslatePipe,
  ],
})
export class ExpressionBuilderComponent implements OnInit {
  private ref = inject(ChangeDetectorRef);

  @ViewChild(SdModal) modal?: SdModal;
  form = new FormGroup({});
  attributeOperators = AttributeOperators;
  attributes: Attribute[] = [];
  numberAttributes: Attribute[] = [];
  dateAttributes: Attribute[] = [];
  attribute: Record<string, Attribute> = {};
  types = DayInfoTypes;
  previouses = DayInfoPreviouses;

  @Input() label?: string;

  @Input('attributes') set _attributes(attributes: Attribute[]) {
    this.attributes = attributes || [];
    this.numberAttributes = this.attributes
      .filter(e => e.type === 'number')
      .map(e => ({
        ...e,
        value: '${' + e.value + '}',
      }));
    this.dateAttributes = this.attributes
      .filter(e => e.type === 'datetime')
      .map(e => ({
        ...e,
        value: '${' + e.value + '}',
      }));
    this.attribute = ArrayUtilities.toObject('value', this.attributes);
  }

  expression?: SdFormGenericExpression = {
    key: Utilities.randomId(),
    type: 'combinator',
    combinator: '&&',
    conditions: [],
  };
  model?: SdFormGenericExpression = {
    key: Utilities.randomId(),
    type: 'combinator',
    combinator: '&&',
    conditions: [],
  };
  @Input({ alias: 'model', required: true }) set _model(model: SdFormGenericExpression | undefined) {
    if (this.model !== model) {
      this.model = model;
    }
    this.model = this.model || {
      key: Utilities.randomId(),
      type: 'combinator',
      combinator: '&&',
      conditions: [],
    };
  }
  readonly modelChange = output<SdFormGenericExpression | undefined>();
  readonly sdChange = output<SdFormGenericExpression | undefined>();
  readonly edit = output<void>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}

  onEdit = async () => {
    // Khi cập nhật expression thì clone ra
    this.expression = JSON.parse(JSON.stringify(this.model));
    // Thông báo cho component cha có sự kiện edit trong trường hợp attributes có thay đổi
    this.edit.emit();
    this.modal?.open?.();
    this.ref.markForCheck();
  };

  addCondition = (conditions: SdFormGenericExpression['conditions']) => {
    conditions.push({
      key: Utilities.randomId(),
      type: 'condition',
      field: undefined,
      operator: 'EQUAL',
      value: undefined,
      dayInfo: {},
    });
    this.ref.markForCheck();
  };

  addCombinator = (conditions: SdFormGenericExpression['conditions']) => {
    conditions.push({
      key: Utilities.randomId(),
      type: 'combinator',
      combinator: '&&',
      conditions: [],
    });
    this.ref.markForCheck();
  };

  remove = (conditions: SdFormGenericExpression['conditions'], idx: number) => {
    conditions.splice(idx, 1);
    this.ref.markForCheck();
  };

  onAccept = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.model = this.expression;
    this.modelChange.emit(this.model);
    this.sdChange.emit(this.model);
    this.modal?.close();
    this.ref.markForCheck();
  };

  onChangeAttribute = (condition: SdFormGenericExpressionCondition) => {
    const fieldAttribute = this.attribute[condition.field!];
    if (fieldAttribute.type === 'datetime') {
      condition.dayInfo = condition.dayInfo || {};
    }
  };

  onChangeDateInfo = (condition: SdFormGenericExpressionCondition) => {
    // Xử lý giá trị
    if (condition.dayInfo?.type === 'NOW') {
      condition.value = 'now';
    } else if (condition.dayInfo?.type === 'RELATED' && condition.dayInfo.relatedValue) {
      condition.value = DayInfoPreviouses.find(e => e.value === condition.dayInfo.related)?.format(condition.dayInfo.relatedValue) ?? null;
    } else if (condition.value?.type === 'DATETIME' && condition.value) {
      condition.value = DateUtilities.toFormat(condition.value, 'yyyy/MM/dd HH:mm:00');
    }
  };
}
