import { SdSearch } from '@sdcorejs/angular/forms/models';
import {
  SdFormGenericArgs,
  SdFormGenericDefinitionHtml,
  SdFormGenericDefinitionSelection,
  SdFormGenericDefinitionTable,
  SdFormGenericSelectionItem,
  SdFormGenericTemplate
} from '../models';
import { SdFormGenericValidationConfiguration } from '../models/form-generic-validation.model';

export interface IWorkflowConfigurationForm<TSelectionArgs = any> {
  // Mẫu chung chọn nhanh
  templates: SdFormGenericTemplate[];
  // Definition cho select/radio/checklist
  selections:  SdFormGenericDefinitionSelection<any, TSelectionArgs>[] | (() => SdFormGenericDefinitionSelection<any, TSelectionArgs>[]) | (() => Promise<SdFormGenericDefinitionSelection[]>);
  getValues?: (key: string, selectionArgs?: TSelectionArgs) => Promise<SdFormGenericSelectionItem[]>; // Nếu sử dụng valuesKey
  getLazyValues?: (key: string, selectionArgs?: TSelectionArgs) => ((searchArgs: Parameters<SdSearch>[0], args: SdFormGenericArgs) => Promise<SdFormGenericSelectionItem[]>); // Nếu sử dụng lazyValuesKey
  // Definition cho table
  tables: SdFormGenericDefinitionTable[];
  // Definition cho table
  htmls: SdFormGenericDefinitionHtml[] | (() => SdFormGenericDefinitionHtml[]) | (() => Promise<SdFormGenericDefinitionHtml[]>);
  // Validation
  validation?: SdFormGenericValidationConfiguration;
}
