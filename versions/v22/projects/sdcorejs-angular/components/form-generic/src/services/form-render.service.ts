import { Injectable, inject } from '@angular/core';
import { SdFormGeneric } from '../models/form-generic.model';
import { ComponentViewedPipe } from '../pipes';

@Injectable({
  providedIn: 'root',
})
export class SdFormRenderService {
  private readonly componentViewedPipe = inject(ComponentViewedPipe);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  viewEntities = async (form: SdFormGeneric, entities: Record<string, any>[]): Promise<Record<string, any>[]> => {
    const reuslts: Record<string, any>[] = [];
    for (const entity of entities || []) {
      const result: Record<string, any> = {};
      for (const component of form?.components || []) {
        // Group và upload thì k cần lấy view
        if (
          component.type !== 'table' &&
          component.type !== 'group' &&
          component.type !== 'upload' &&
          component.type !== 'html' &&
          component.key
        ) {
          result[component.key] = await this.componentViewedPipe.transform(entity?.[component.key], entity, component);
        }
      }
      reuslts.push(result);
    }
    return reuslts;
  };
}
