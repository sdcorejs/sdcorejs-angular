import { Component, NgModule, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdChip } from '@sdcorejs/angular/forms/chip';
import { SdChipCalendar } from '@sdcorejs/angular/forms/chip-calendar';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdItemDefDefDirective, SdLabelDefDirective, SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import {
  SdEntityPicker,
  SdEntityPickerDetailTemplateDirective,
  SdEntityPickerRowTemplateDirective,
  SdEntityPickerSelectedTemplateDirective,
} from '@sdcorejs/angular/forms/entity-picker';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputColor } from '@sdcorejs/angular/forms/input-color';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdSelect, SdSelectFooterActionDirective } from '@sdcorejs/angular/forms/select';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdTime } from '@sdcorejs/angular/forms/time';
import { SdTimeRange } from '@sdcorejs/angular/forms/time-range';
import { SdTreeSelect, SdTreeSelectNodeTemplateDirective } from '@sdcorejs/angular/forms/tree-select';

import { SdFormsModule } from './forms.module';

// why: host KHÔNG standalone — đây chính là kịch bản của consumer NgModule mà SdFormsModule tồn
// tại để phục vụ. Template chỉ compile được nếu module export đủ control; thiếu control nào thì
// element của nó không match component nào và `By.directive(...)` trả về null (RED trước fix —
// module chỉ khai 12/20). Vì vậy phải tắt `prefer-standalone` ở đúng host này.
@Component({
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  selector: 'sd-forms-module-host',
  template: `
    <sd-label label="Label"></sd-label>
    <sd-input></sd-input>
    <sd-input-color></sd-input-color>
    <sd-inline-text></sd-inline-text>
    <sd-input-number></sd-input-number>
    <sd-date></sd-date>
    <sd-datetime></sd-datetime>
    <sd-date-range></sd-date-range>
    <sd-time></sd-time>
    <sd-time-range></sd-time-range>
    <sd-entity-picker></sd-entity-picker>
    <sd-tree-select></sd-tree-select>
    <sd-select></sd-select>
    <sd-autocomplete></sd-autocomplete>
    <sd-switch></sd-switch>
    <sd-radio valueField="id" displayField="name"></sd-radio>
    <sd-textarea></sd-textarea>
    <sd-chip></sd-chip>
    <sd-chip-calendar></sd-chip-calendar>
    <sd-checkbox></sd-checkbox>
  `,
})
class SdFormsModuleHost {}

@NgModule({
  imports: [NoopAnimationsModule, SdFormsModule],
  declarations: [SdFormsModuleHost],
})
class SdFormsModuleHostModule {}

const CONTROLS: Type<unknown>[] = [
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

const DIRECTIVES: Type<unknown>[] = [
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

function moduleExports(): unknown[] {
  const def = (SdFormsModule as unknown as { ɵmod: { exports: unknown } }).ɵmod;
  const exported = typeof def.exports === 'function' ? (def.exports as () => unknown[])() : def.exports;
  return (exported as unknown[]) ?? [];
}

describe('SdFormsModule', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdFormsModuleHostModule] }).compileComponents();
  });

  it('resolves every form control in an NgModule-declared template', () => {
    const fixture = TestBed.createComponent(SdFormsModuleHost);
    fixture.detectChanges();

    for (const control of CONTROLS) {
      expect(fixture.debugElement.query(By.directive(control)))
        .withContext(`${control.name} is not exported by SdFormsModule`)
        .not.toBeNull();
    }
  });

  it('exports every projection directive re-exported from forms/index.ts', () => {
    const exported = moduleExports();

    for (const directive of DIRECTIVES) {
      expect(exported).withContext(`${directive.name} is not exported by SdFormsModule`).toContain(directive);
    }
  });

  it('exports exactly what it imports (no half-registered control)', () => {
    const def = (SdFormsModule as unknown as { ɵmod: { imports: unknown } }).ɵmod;
    const imported = typeof def.imports === 'function' ? (def.imports as () => unknown[])() : ((def.imports as unknown[]) ?? []);

    for (const control of [...CONTROLS, ...DIRECTIVES]) {
      expect(imported).withContext(`${control.name} missing from imports`).toContain(control);
    }
  });
});
