import { Inject, Injectable, Optional } from '@angular/core';
import { SdSearch } from '@sdcorejs/angular/forms';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../configurations';
import { SdFormGenericArgs, SdFormGenericDefinitionHtml, SdFormGenericDefinitionSelection, SdFormGenericSelectionItem } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FormGenericService {
  #selections?: SdFormGenericDefinitionSelection[];
  #definitionHtmls?: SdFormGenericDefinitionHtml[];
  constructor(
    @Inject(SD_FORM_GENERIC_CONFIGURATION)
    @Optional()
    private readonly configuration: ISdFormGenericConfiguration
  ) {}

  get selections() {
    return this.configuration?.form?.selections || [];
  }

  get tables() {
    return this.configuration?.form?.tables || [];
  }

  getSelection = async (valuesKey: string | undefined | null) => {
    if (!valuesKey) {
      return undefined;
    }
    const selections = await this.selection.definitions();
    return selections.find(e => e.value === valuesKey);
  };

  selection = {
    definitions: async (): Promise<SdFormGenericDefinitionSelection[]> => {
      // Nếu chưa xử lý lấy trước đó thì thực hiện xử lý lấy data cho selections
      if (!this.#selections) {
        const selections = this.configuration?.form?.selections;
        if (!selections) {
          this.#selections = [];
        } else if (Array.isArray(selections)) {
          this.#selections = selections;
        } else {
          const results = selections();
          if (results instanceof Promise) {
            this.#selections = (await results) || [];
          } else {
            this.#selections = results || [];
          }
        }
      }
      return this.#selections || [];
    },
    getDefinition: async (valuesKey: string | undefined | null) => {
      if (!valuesKey) {
        return undefined;
      }
      const selections = await this.selection.definitions();
      return selections.find(e => e.value === valuesKey);
    },
    // Lấy dữ liệu items cho dropdown, radio, checklist
    // Dữ liệu có thể là 1 mảng hoặc hàm
    items: async (
      valuesKey: string | undefined | null,
      args: SdFormGenericArgs
    ): Promise<SdFormGenericSelectionItem[] | SdSearch<SdFormGenericSelectionItem>> => {
      try {
        const { component, column } = args;
        // Nếu có values thì xử lý trả về mảng tĩnh
        if (component && 'values' in component && Array.isArray(component.values) && component.values.length) {
          return component.values.map(e => ({
            value: e.value,
            display: e.label,
            data: e,
          }));
        }
        // Nếu component là table và có thông tin column
        if (component?.type === 'table' && column && 'values' in column && Array.isArray(column.values) && column.values.length) {
          return column.values.map(e => ({
            value: e.value,
            display: e.label,
            data: e,
          }));
        }
        // Ngoài ra nếu không có valuesKey thì trả về mảng rỗng
        if (!valuesKey) {
          return [];
        }
        // Tìm cấu hình dựa vào valuesKey
        const selection = await this.selection.getDefinition(valuesKey);
        if (!selection) {
          return [];
        }
        if ('values' in selection) {
          return await selection.values(args);
        } else if ('valuesKey' in selection && selection?.valuesKey && !!this.configuration?.form?.getValues) {
          return (await this.configuration?.form?.getValues?.(selection.valuesKey, selection.args)) || [];
        } else if ('lazyValues' in selection) {
          return searchArgs => {
            return selection.lazyValues(searchArgs, args);
          };
        } else if ('lazyValuesKey' in selection && selection?.lazyValuesKey && !!this.configuration?.form?.getLazyValues) {
          const getLazyValues = this.configuration?.form?.getLazyValues?.(selection.lazyValuesKey, selection.args);
          return searchArgs => {
            return getLazyValues(searchArgs, args);
          };
        }
        return [];
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    variables: {
      detail: async (valuesKey: string, values: string | number | string[] | number[], args: SdFormGenericArgs) => {
        const selection = await this.selection.getDefinition(valuesKey);
        return selection?.variables?.detail?.(values, args);
      },
    },
  };

  html = {
    definitions: async (): Promise<SdFormGenericDefinitionHtml[]> => {
      // Nếu chưa xử lý lấy trước đó thì thực hiện xử lý lấy data cho htmls
      if (!this.#definitionHtmls) {
        const htmls = this.configuration?.form?.htmls;
        if (!htmls) {
          this.#definitionHtmls = [];
        } else if (Array.isArray(htmls)) {
          this.#definitionHtmls = htmls;
        } else {
          const results = htmls();
          if (results instanceof Promise) {
            this.#definitionHtmls = (await results) || [];
          } else {
            this.#definitionHtmls = results || [];
          }
        }
      }
      return this.#definitionHtmls || [];
    },
    getContent: async (template: string, query?: Record<string, any>): Promise<string> => {
      const definitions = await this.html.definitions();
      const html = definitions.find(e => e.value === template);
      if (html) {
        if (typeof html.content === 'string') {
          return html.content;
        }
        if (typeof html.content === 'function') {
          return await html.content(query).catch(err => {
            console.error(err);
            return '';
          });
        }
        return '';
      }
      return '';
    },
  };
}
