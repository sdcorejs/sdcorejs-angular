import { NgModule } from '@angular/core';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';

@NgModule({
  imports: [SdInput, SdInputNumber, SdDate, SdDateRange, SdSelect, SdAutocomplete, SdRadio, SdTextarea],
  declarations: [],
  providers: [],
  exports: [SdInput, SdInputNumber, SdDate, SdDateRange, SdSelect, SdAutocomplete, SdRadio, SdTextarea],
})
export class SdFormsModule {}
