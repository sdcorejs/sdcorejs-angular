/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { ArrayUtilities } from '@sdcorejs/angular/utilities/extensions';
import {
  Attribute,
  AttributeOperators,
  GetAttributes,
  SdFormGenericComponent,
  SdFormGenericExpression,
  SdFormGenericGroup,
} from '../../models';
import { ExpressionFeelPipe } from '../../pipes';
import { FormGenericService } from '../../services';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

// Template lÃ  cÃ¡c máº«u do Portal Ä‘á»‹nh nghÄ©a sáºµn (key, label ....) Ä‘á»ƒ ngÆ°á»i dÃ¹ng chá»n nhanh
// Khi thá»±c hiá»‡n sao chÃ©p 1 template chÃºng ta sáº½ CLONE Ä‘á»ƒ trÃ¡nh áº£nh hÆ°á»Ÿng template gá»‘c
@Component({
  selector: 'sd-feel-expression',
  templateUrl: './sd-feel-expression.component.html',
  styleUrl: './sd-feel-expression.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInput, SdInputNumber, SdSelect, SdAutocomplete, SdButton, SdSelect, SdModal, TranslatePipe],
})
export class SdFeelExpression extends SdBaseSecureComponent {
  @ViewChild(SdModal) modal?: SdModal;
  form = new FormGroup({});
  attributeOperators = AttributeOperators;
  attributes: Attribute[] = [];
  attribute: Record<string, Attribute> = {};
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  // ValuesKey
  expression?: SdFormGenericExpression;
  @Input({ alias: 'expression', required: true }) set _expression(expression: SdFormGenericExpression | undefined) {
    if (this.expression !== expression) {
      this.expression = expression;
    }
    this.expression = this.expression || {
      key: `${new Date().getTime().toString(36)}`,
      type: 'combinator',
      combinator: '&&',
      conditions: [],
    };
  }
  @Output() expressionChange = new EventEmitter<SdFormGenericExpression>();

  //
  model?: string;
  @Input({ alias: 'model', required: true }) set _model(model: string | undefined) {
    if (this.model !== model) {
      this.model = model;
    }
  }
  @Output() modelChange = new EventEmitter<string>();

  @Output() sdChange = new EventEmitter<{ model?: string; expression?: SdFormGenericExpression }>();

  constructor(
    private ref: ChangeDetectorRef,
    private expressionFeelPipe: ExpressionFeelPipe,
    private formGenericService: FormGenericService
  ) {
    super()
  }

  ngOnInit(): void {}

  edit = async () => {
    this.attributes = await this.#getAttributes(this.components);
    this.attribute = ArrayUtilities.toObject('value', this.attributes);
    this.modal?.open?.();
    this.ref.markForCheck();
  };

  addCondition = (conditions: SdFormGenericExpression['conditions']) => {
    conditions.push({
      key: `${new Date().getTime().toString(36)}`,
      type: 'condition',
      field: undefined,
      operator: 'EQUAL',
      value: undefined,
      dayInfo: {}
    });
    this.ref.markForCheck();
  };

  addCombinator = (conditions: SdFormGenericExpression['conditions']) => {
    conditions.push({
      key: `${new Date().getTime().toString(36)}`,
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
    if (this.expression) {
      this.model = this.expressionFeelPipe.transform(this.expression!);
      this.expressionChange.emit(this.expression);
    } else {
      this.model = '';
    }
    this.modelChange.emit(this.model);
    this.sdChange.emit({
      model: this.model,
      expression: this.expression,
    });
    this.modal?.close();
    this.ref.markForCheck();
  };

  // Tá»« components map thÃ nh cÃ¡c attributes
  #getAttributes = async (components: (SdFormGenericComponent | SdFormGenericGroup)[]): Promise<Attribute[]> => {
    const attributes: Attribute[] = [];
    if (components.length) {
      for (const component of components) {
        if (component.type === 'group') {
          attributes.push(...GetAttributes(component.components));
        } else if (component.type === 'textfield' || component.type === 'textarea') {
          attributes.push({
            value: component.key,
            display: component.label,
            type: 'string',
          });
        } else if (component.type === 'number') {
          attributes.push({
            value: component.key,
            display: component.label,
            type: 'number',
          });
        } else if (component.type === 'checkbox') {
          attributes.push({
            value: component.key,
            display: component.label,
            type: 'boolean',
            displayOnTrue: 'YES',
            displayOnFalse: 'NO',
          });
        } else if (component.type === 'radio' || component.type === 'select') {
          if (component.values?.length) {
            attributes.push({
              value: component.key,
              display: component.label,
              type: 'values',
              values: component.values.map(e => ({
                value: e.value,
                display: e.label,
              })),
            });
          } else {
            const values = await this.formGenericService.selection.items(component.valuesKey, {
              entity: {},
              component,
            });
            // Náº¿u lÃ  máº£ng thÃ¬ push vÃ o
            if (Array.isArray(values)) {
              attributes.push({
                value: component.key,
                display: component.label,
                type: 'values',
                values,
              });
            } else {
              attributes.push({
                value: component.key,
                display: component.label,
                type: 'string',
              });
            }
          }
        }
      }
    }
    return attributes;
  };
}

