import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  Attribute,
  GetAttributes,
  SdFormGenericComponent,
  SdFormGenericExpression,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../../../models';
import { FormGenericService } from '../../../../services';
import { ExpressionBuilderComponent } from '../expression-builder/expression-builder.component';

// Component xây dựng Expression dựa vào SdFormGenericExpression
@Component({
  selector: 'attribute-expression',
  templateUrl: './attribute-expression.component.html',
  styleUrl: './attribute-expression.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExpressionBuilderComponent],
})
export class AttributeExpression implements OnInit {
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  attributes: Attribute[] = [];
  @Input() label?: string;
  model?: SdFormGenericExpression;
  @Input({ alias: 'model', required: true }) set _model(model: SdFormGenericExpression | undefined) {
    if (this.model !== model) {
      this.model = model;
    }
  }
  @Output() modelChange = new EventEmitter<SdFormGenericExpression>();
  @Output() sdChange = new EventEmitter<SdFormGenericExpression>();
  constructor(
    private ref: ChangeDetectorRef,
    private formGenericService: FormGenericService
  ) {}

  ngOnInit(): void {}

  onEdit = async () => {
    this.attributes = await this.#getAttributes(this.components, this.variables);
    this.ref.markForCheck();
  };

  onChange = (value: any) => {
    this.modelChange.emit(value);
    this.sdChange.emit(value);
  };

  // Từ components map thành các attributes
  #getAttributes = async (
    components: (SdFormGenericComponent | SdFormGenericGroup)[],
    variables: SdFormGenericVariable[]
  ): Promise<Attribute[]> => {
    const attributes: Attribute[] = [];
    if (components?.length) {
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
            // Nếu là mảng thì push vào
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
    if (variables?.length) {
      for (const variable of variables) {
        attributes.push({
          value: variable.key,
          display: `[VARIABLE] ${variable.label}`,
          type: 'string',
        });
      }
    }
    return attributes;
  };
}
