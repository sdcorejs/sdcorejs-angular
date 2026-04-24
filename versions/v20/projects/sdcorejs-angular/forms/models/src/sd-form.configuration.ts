import { InjectionToken } from '@angular/core';
import { MatFormFieldAppearance } from '@angular/material/form-field';

export interface ISdFormConfiguration {
  appearance?: MatFormFieldAppearance;
}

export const SD_FORM_CONFIGURATION = new InjectionToken<ISdFormConfiguration>('sd.form.configuration');
