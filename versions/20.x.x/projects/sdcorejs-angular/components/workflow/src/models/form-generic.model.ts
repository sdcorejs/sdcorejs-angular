import { SdFormGenericComponent, SdFormGenericGroup, SdFormGenericVariable } from './form-generic-component.model';
import { SdFormGenericValidation } from './form-generic-validation.model';

export interface SdFormGeneric {
  components: (SdFormGenericComponent | SdFormGenericGroup)[];
  variables?: SdFormGenericVariable[];
  validations?: SdFormGenericValidation[];
}
