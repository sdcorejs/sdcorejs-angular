/* eslint-disable @typescript-eslint/no-explicit-any */
import { InjectionToken } from '@angular/core';
import { IWorkflowConfigurationForm } from './form.configuration';

export interface ISdWorkflowConfiguration {
  form?: IWorkflowConfigurationForm;
}

export const SD_WORKFLOW_CONFIGURATION = new InjectionToken<ISdWorkflowConfiguration>('sd.workflow.configuration');
