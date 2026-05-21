/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform } from '@angular/core';
import { EvaluateExpression, SdFormGenericComponent, SdFormGenericGroup, SdFormGenericHtml } from '../models';

@Pipe({
  name: 'whenExpression',
  standalone: true,
})
// Xử lý thông tin required, disabled, hidden của component
export class WhenExpressionPipe implements PipeTransform {
  #hidden = (component: SdFormGenericComponent | SdFormGenericGroup, variables: Record<string, any>) => {
    if (component.properties?.hidden) {
      return true;
    }
    const hiddenWhenExpression = component.properties?.hiddenWhenExpression;
    if (hiddenWhenExpression) {
      const result = EvaluateExpression(hiddenWhenExpression, variables);
      if (typeof result === 'boolean') {
        return result;
      }
      return true;
    }
    const visibleWhenExpression = component.properties?.visibleWhenExpression;
    if (visibleWhenExpression) {
      const result = EvaluateExpression(visibleWhenExpression, variables);
      if (typeof result === 'boolean') {
        return !result;
      }
      return true;
    }
    return false;
  };
  #disabled = (component: Exclude<SdFormGenericComponent, SdFormGenericHtml>, variables: Record<string, any>) => {
    const disabledWhenExpression = component.properties?.disabledWhenExpression;
    if (disabledWhenExpression) {
      const result = EvaluateExpression(disabledWhenExpression, variables);
      if (typeof result === 'boolean') {
        return result;
      }
      return true;
    }
    return false;
  };
  #required = (component: Exclude<SdFormGenericComponent, SdFormGenericHtml>, variables: Record<string, any>) => {
    const requiredWhenExpression = component.properties?.requiredWhenExpression;
    if (requiredWhenExpression) {
      const result = EvaluateExpression(requiredWhenExpression, variables);
      if (typeof result === 'boolean') {
        return result;
      }
      return false;
    }
    return false;
  };
  transform(
    hashed: string | undefined,
    component: SdFormGenericComponent | SdFormGenericGroup,
    entity: Record<string, any>
  ): {
    hidden: boolean;
    disabled: boolean;
    required: boolean;
  } {
    // Group và html chỉ xử lý ẩn/hiện
    if (component.type === 'group' || component.type === 'html' || component.type === 'break') {
      // Break/html/group: chỉ tính hidden (validate/disabled không áp dụng).
      return {
        hidden: this.#hidden(component, entity),
        disabled: false,
        required: false,
      };
    }
    return {
      hidden: this.#hidden(component, entity),
      disabled: component?.disabled || this.#disabled(component, entity),
      required: component?.validate?.required || this.#required(component, entity),
    };
  }
}
