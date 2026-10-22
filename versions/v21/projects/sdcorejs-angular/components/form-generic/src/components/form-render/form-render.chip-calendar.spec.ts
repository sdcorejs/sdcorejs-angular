import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdChipCalendar } from '@sdcorejs/angular/forms/chip-calendar';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { SdFormRender } from './form-render.component';

const schemaOf = (elements: Record<string, unknown>[]) => ({ pages: [{ id: 'p', elements }] }) as unknown as SdFormGenericSchema;

// Design handoff sd-chip-calendar · D1: the form-render wrapper passes `validation.maxItems` through `maxCount`, not the
// deprecated `max`. The schema has no `minItems`, so `minCount` stays unset.
describe('SdFormRender · chip-calendar field', () => {
  let fixture: ComponentFixture<SdFormRender>;

  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [SdFormRender, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdFormRender);
  });

  it('passes maxItems as maxCount without the deprecation warning', async () => {
    const warn = spyOn(console, 'warn').and.callThrough();
    fixture.componentRef.setInput(
      'schema',
      schemaOf([{ id: 'f-days', key: 'days', type: 'chip-calendar', label: 'Days', validation: { maxItems: 2 } }])
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const calendar = fixture.debugElement.query(By.directive(SdChipCalendar)).componentInstance as SdChipCalendar;
    expect(calendar.maxCount()).toBe(2);
    expect(calendar.max()).toBe(0);
    expect(calendar.effectiveMaxCount()).toBe(2);
    expect(warn.calls.allArgs().some(args => String(args[0]).includes('[sd-chip-calendar]'))).toBeFalse();
  });
});
