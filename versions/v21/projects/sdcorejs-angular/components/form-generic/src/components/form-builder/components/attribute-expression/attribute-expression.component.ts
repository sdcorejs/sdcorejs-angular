import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdQueryBuilder, SdQueryBuilderField } from '@sdcorejs/angular/components/query-builder';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { Filter } from '@sdcorejs/utils/models';
import {
  Attribute,
  GetAttributes,
  SdFormGenericComponent,
  SdFormGenericExpression,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../../../models';
import { ExpressionQueryPipe } from '../../../../pipes';
import { FormGenericService } from '../../../../services';
import { filterToFormExpression, formAttributesToQueryFields, formExpressionToFilter } from './form-expression-query-adapter';

@Component({
  selector: 'attribute-expression',
  templateUrl: './attribute-expression.component.html',
  styleUrl: './attribute-expression.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdButton, SdModal, SdQueryBuilder, ExpressionQueryPipe, TranslatePipe],
})
export class AttributeExpression {
  readonly modal = viewChild(SdModal);

  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  @Input() label?: string;

  queryFields: SdQueryBuilderField[] = [];
  draftFilter: Filter | null = null;
  model?: SdFormGenericExpression;

  @Input({ alias: 'model', required: true }) set _model(model: SdFormGenericExpression | undefined) {
    if (this.model !== model) {
      this.model = model;
    }
  }

  @Output() modelChange = new EventEmitter<SdFormGenericExpression>();
  @Output() sdChange = new EventEmitter<SdFormGenericExpression>();

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly formGenericService: FormGenericService
  ) {}

  onEdit = async () => {
    const attributes = await this.#getAttributes(this.components, this.variables);
    this.queryFields = formAttributesToQueryFields(attributes);
    this.draftFilter = formExpressionToFilter(this.model);
    this.modal()?.open();
    this.ref.markForCheck();
  };

  onAccept = () => {
    const nextModel = filterToFormExpression(this.draftFilter);
    this.model = nextModel;
    this.modelChange.emit(nextModel);
    this.sdChange.emit(nextModel);
    this.modal()?.close();
    this.ref.markForCheck();
  };

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
        } else if (component.type === 'datetime') {
          attributes.push({
            value: component.key,
            display: component.label,
            type: 'datetime',
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
