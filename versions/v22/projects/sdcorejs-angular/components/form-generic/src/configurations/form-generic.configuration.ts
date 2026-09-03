import { InjectionToken } from '@angular/core';
import { IWorkflowConfigurationForm } from './form.configuration';

export interface ISdFormGenericConfiguration {
  form?: IWorkflowConfigurationForm;
}

export const SD_FORM_GENERIC_CONFIGURATION = new InjectionToken<ISdFormGenericConfiguration>('sd.form-generic.configuration');
