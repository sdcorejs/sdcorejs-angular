import { Pipe, PipeTransform } from '@angular/core';
import { Attribute, SdFormGenericOperators, SdFormGenericExpression, SdFormGenericExpressionCondition } from '../models';

@Pipe({
  name: 'expressionView',
})
export class ExpressionViewPipe implements PipeTransform {
  transform(condition: SdFormGenericExpression | SdFormGenericExpressionCondition, attributes: Attribute[]): string {
    if (condition.type === 'combinator') {
      return '';
    }
    const { field, operator, value } = condition;
    const containerStyle = `style="border: 1px solid #e6e6e6; border-radius: 4px; background-color: #e6e6e6; padding: 4px 8px;"`;
    const results: string[] = [];
    // Wording field
    results.push(`<div ${containerStyle}>${attributes.find(e => e.value === field)?.display || field}</div>`);
    // Wording operator
    if (operator) {
      results.push(`<div>${SdFormGenericOperators.find(e => e.value === operator)?.display || operator}</div>`);
    }
    // Wording value
    if (operator && value !== undefined) {
      results.push(`<div ${containerStyle}>${value}</div>`);
    }
    return `<div class="d-flex flex-row align-items-center" style="gap:8px ;flex-wrap: wrap ;word-wrap: break-word">${results.join(
      ''
    )}</div>`;
  }
}
