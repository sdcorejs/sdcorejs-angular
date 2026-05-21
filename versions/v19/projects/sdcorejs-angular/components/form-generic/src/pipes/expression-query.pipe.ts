import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { SdFormGenericExpression, SdFormGenericExpressionCondition } from '../models';

// Từ Expression JSON build thành Expression String
@Pipe({
  name: 'expressionQuery',
})
@Injectable({
  providedIn: 'root',
})
export class ExpressionQueryPipe implements PipeTransform {
  #generateQuery = (condition: SdFormGenericExpression | SdFormGenericExpressionCondition) => {
    const queries: string[] = [];
    if (condition.type === 'combinator') {
      if (condition.conditions?.length) {
        for (const child of condition.conditions) {
          queries.push(`(${this.#generateQuery(child)})`);
        }
      }
      // Nếu nhiều hơn 1 điều kiện, bọc điều kiện bằng cặp ngoặc ()
      const query = queries.join(` ${condition.combinator} `);
      if (queries.length > 1) {
        return `(${query})`;
      } else {
        return query;
      }
    } else {
      return this.#generateJavascriptExpression(condition);
    }
  };
  #generateJavascriptExpression = (condition: SdFormGenericExpressionCondition) => {
    const { value } = condition;
    // Convert thành syntax ${field}
    const field = '${' + condition.field + '}';
    const { operator } = condition;
    if (!operator) {
      return undefined;
    }
    if (operator === 'NULL') {
      return `!${field}`;
    }
    if (operator === 'NOT_NULL') {
      return `!!${field}`;
    }
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (operator === 'EQUAL') {
      // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
      if (typeof value === 'string') {
        return `${field} === '${value}'`;
      }
      return `${field} === ${value}`;
    }
    if (operator === 'GREATER_THAN') {
      // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
      if (typeof value === 'string') {
        return `${field} > '${value}'`;
      }
      return `${field} > ${value}`;
    }
    if (operator === 'LESS_THAN') {
      // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
      if (typeof value === 'string') {
        return `${field} < '${value}'`;
      }
      return `${field} < ${value}`;
    }
    if (operator === 'NOT_EQUAL') {
      // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
      if (typeof value === 'string') {
        return `${field} !== '${value}'`;
      }
      return `${field} !== ${value}`;
    }
    if (operator === 'GREATER_OR_EQUAL') {
      // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
      if (typeof value === 'string') {
        return `${field} >= '${value}'`;
      }
      return `${field} >= ${value}`;
    }
    if (operator === 'LESS_OR_EQUAL') {
      // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
      if (typeof value === 'string') {
        return `${field} <= '${value}'`;
      }
      return `${field} <= ${value}`;
    }
    return undefined;
  };
  transform(condition: SdFormGenericExpression | SdFormGenericExpressionCondition | undefined): string | undefined {
    if(!condition) {
      return undefined;
    }
    return this.#generateQuery(condition);
  }
}
