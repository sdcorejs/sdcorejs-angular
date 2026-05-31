/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DateUtilities, NumberUtilities } from '@sdcorejs/angular/utilities/extensions';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { SdFormGenericComponent, SdFormGenericHtml } from '../models';
import { FormGenericService } from '../services';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';

@Pipe({
  name: 'componentViewed',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
// Pipe xá»­ lÃ½ hiá»ƒn thá»‹ detail cho component
export class ComponentViewedPipe implements PipeTransform {
  constructor(
    private readonly formatNumberPipe: SdFormatNumberPipe,
    private readonly formGenericService: FormGenericService
  ) {}
  transform = async (
    value: any,
    entity: Record<string, any>,
    component: Exclude<SdFormGenericComponent, SdFormGenericHtml>
  ): Promise<string> => {
    if (!component?.key) {
      return '';
    }
    const val = entity?.[component.key];
    if (val === undefined || val === null) {
      return EMPTY_STR;
    }
    if (component.type === 'textfield' || component.type === 'textarea') {
      return val || EMPTY_STR;
    }
    if (component.type === 'number') {
      return this.formatNumberPipe.transform(value)?.toString() ?? EMPTY_STR;
    }
    if (component.type === 'datetime') {
      if (component.subtype === 'datetime') {
        return DateUtilities.toFormat(val, 'dd/MM/yyyy HH:mm') || EMPTY_STR;
      } else {
        return DateUtilities.toFormat(val, 'dd/MM/yyyy') || EMPTY_STR;
      }
    }
    if (component.type === 'select' || component.type === 'radio' || component.type === 'checklist') {
      const values = (Array.isArray(val) ? val : [val]).filter(value => value !== undefined && value !== null && value !== '');
      if (!values.length) {
        return EMPTY_STR;
      }
      const selection = await this.formGenericService.selection.getDefinition(component?.valuesKey);
      // Náº¿u cÃ³ cáº¥u hÃ¬nh view tÆ°Æ¡ng á»©ng vá»›i selection thÃ¬ sá»­ dá»¥ng viewed
      if (selection?.viewed) {
        return (
          (await selection.viewed(values, {
            entity,
            component,
          })) || EMPTY_STR
        );
      }
      // NgoÃ i ra xá»­ lÃ½ láº¥y thÃ´ng tin items
      const items = await this.formGenericService.selection.items(component?.valuesKey, {
        entity,
        component,
      });
      if (!items) {
        return EMPTY_STR;
      }
      // Náº¿u items lÃ  Array thÃ¬ kiá»ƒm tra value vÃ  hiá»ƒn thá»‹ display
      if (Array.isArray(items)) {
        return (
          items
            .filter(e => values.includes(e.value))
            .map(e => e.display)
            .join(', ') || EMPTY_STR
        );
      }
      // items lÃ  Function (lazyValues) thÃ¬ thá»±c hiá»‡n gá»i API
      return await items({
        type: 'VALUE',
        value: values,
      }).then(results => {
        return (
          results
            .filter(e => values.includes(e.value))
            .map(e => e.display)
            .join(', ') || EMPTY_STR
        );
      });
    }
    return '';
  };
}

