import { NgModule } from '@angular/core';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputColor } from '@sdcorejs/angular/forms/input-color';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdSelect, SdSelectFooterActionDirective } from '@sdcorejs/angular/forms/select';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdChip } from '@sdcorejs/angular/forms/chip';
import { SdChipCalendar } from '@sdcorejs/angular/forms/chip-calendar';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdTime } from '@sdcorejs/angular/forms/time';
import { SdTimeRange } from '@sdcorejs/angular/forms/time-range';
import {
  SdEntityPicker,
  SdEntityPickerDetailTemplateDirective,
  SdEntityPickerRowTemplateDirective,
  SdEntityPickerSelectedTemplateDirective,
} from '@sdcorejs/angular/forms/entity-picker';
import { SdTreeSelect, SdTreeSelectNodeTemplateDirective } from '@sdcorejs/angular/forms/tree-select';
import { SdItemDefDefDirective, SdLabelDefDirective, SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';

// why: mọi control standalone re-export từ `forms/index.ts` PHẢI có mặt ở đây. Trước đây module
// chỉ khai 12/20 control (thiếu datetime / checkbox / switch / chip / chip-calendar / input-color /
// inline-text / label), nên consumer dùng NgModule chỉ import `SdFormsModule` vẫn không compile
// được một nửa thư viện ("is not a known element") dù package đã export class. Danh sách này bám
// 1:1 theo `forms/index.ts` — thêm entry point mới thì phải thêm cả ở đây.
const SD_FORM_CONTROLS = [
  SdLabel,
  SdInput,
  SdInputColor,
  SdInlineText,
  SdInputNumber,
  SdDate,
  SdDatetime,
  SdDateRange,
  SdTime,
  SdTimeRange,
  SdEntityPicker,
  SdTreeSelect,
  SdSelect,
  SdAutocomplete,
  SdSwitch,
  SdRadio,
  SdTextarea,
  SdChip,
  SdChipCalendar,
  SdCheckbox,
];

// why: các directive projection (`sdViewDef`, `sdLabelDef`, `sdItemDef`, `sdSuffixDef`, footer
// action của select, template của entity-picker/tree-select) là một phần API của chính các control
// trên — không export thì consumer NgModule dựng được control nhưng không tuỳ biến được nội dung.
const SD_FORM_DIRECTIVES = [
  SdSuffixDefDirective,
  SdLabelDefDirective,
  SdViewDefDirective,
  SdItemDefDefDirective,
  SdSelectFooterActionDirective,
  SdEntityPickerSelectedTemplateDirective,
  SdEntityPickerRowTemplateDirective,
  SdEntityPickerDetailTemplateDirective,
  SdTreeSelectNodeTemplateDirective,
];

@NgModule({
  imports: [...SD_FORM_CONTROLS, ...SD_FORM_DIRECTIVES],
  declarations: [],
  providers: [],
  exports: [...SD_FORM_CONTROLS, ...SD_FORM_DIRECTIVES],
})
export class SdFormsModule {}
