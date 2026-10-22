import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdChipCalendar } from './chip-calendar.component';

// Design handoff (sd-chip-calendar) · step 1: removable on every path (A1), a wide model read like sd-date (A2 / 4.7),
// one error gate (A4) and names for chips and their remove buttons (A6).

const FULL_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

describe('SdChipCalendar · design handoff step 1', () => {
  let fixture: ComponentFixture<SdChipCalendar>;
  let comp: SdChipCalendar;
  let modelChanges: unknown[];
  let changes: unknown[];

  const create = (inputs: Record<string, unknown> = {}) => {
    fixture = TestBed.createComponent(SdChipCalendar);
    comp = fixture.componentInstance;
    modelChanges = [];
    changes = [];
    comp.model.subscribe(value => modelChanges.push(value));
    comp.sdChange.subscribe(value => changes.push(value));
    fixture.componentRef.setInput('label', 'Ngày nghỉ');
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
  };
  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('mat-chip-row'));
  // why: Material 19 đặt tên chip lên ô role=gridcell của mat-chip-row; bản mới hơn lên nút primary action.
  const primaryAction = (row: Element) =>
    row.querySelector('[role="gridcell"][aria-label], .mdc-evolution-chip__action--primary[aria-label]') ??
    row.querySelector('[role="gridcell"]')!;
  const rowText = () => rows().map(row => row.textContent?.replace(/\s+/g, ' ').trim());
  const press = (target: Element, key: string, keyCode: number) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    target.dispatchEvent(event);
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdChipCalendar, NoopAnimationsModule] }).compileComponents();
  });

  describe('A1 · removable predicate on every path', () => {
    const notBefore = (day: string) => day >= '2026/10/20';

    beforeEach(() => create({ model: ['2026/10/05', '2026/10/23'], removable: notBefore }));

    it('passes the normalised yyyy/MM/dd day to the predicate', () => {
      const seen: unknown[] = [];
      fixture.componentRef.setInput('removable', (day: unknown) => (seen.push(day), true));
      fixture.componentRef.setInput('model', [new Date(2026, 9, 5)]);
      fixture.detectChanges();
      expect(seen).toContain('2026/10/05');
    });

    it('ignores Backspace on a chip the predicate keeps', () => {
      press(rows()[0], 'Backspace', 8);
      fixture.detectChanges();
      expect(changes).toEqual([]);
      expect(rows().length).toBe(2);
    });

    it('does not drop a kept day when its calendar cell is pressed again', () => {
      comp.onSelectDate(new Date(2026, 9, 5));
      expect(changes).toEqual([]);
      expect(comp.formControl.value).toEqual(['2026/10/05', '2026/10/23']);
    });

    it('keeps the kept days when everything is cleared, in one change', () => {
      comp.onClear();
      expect(changes).toEqual([['2026/10/05']]);
    });

    it('does not remove a kept day through onRemove either', () => {
      comp.onRemove('2026/10/05');
      expect(changes).toEqual([]);
    });
  });

  describe('A2 · model read like sd-date, written as string[]', () => {
    it('reads Date, timestamp, ISO and yyyy/MM/dd items as calendar days', () => {
      const iso = new Date(2026, 9, 23, 10).toISOString();
      create({ model: [new Date(2026, 9, 5), new Date(2026, 9, 14).getTime(), iso, '2026/10/27'] });
      expect(comp.formControl.value).toEqual(['2026/10/05', '2026/10/14', '2026/10/23', '2026/10/27']);
      expect(rows().length).toBe(4);
      expect(comp.dateClass(new Date(2026, 9, 14))).toContain('selected');
      expect(comp.dateClass(new Date(2026, 9, 5))).toContain('selected');
    });

    it('removes a day that came in as a Date and writes yyyy/MM/dd strings', () => {
      create({ model: [new Date(2026, 9, 5), new Date(2026, 9, 14).getTime()] });
      comp.onRemove('2026/10/05');
      expect(modelChanges).toEqual([['2026/10/14']]);
      expect(changes).toEqual([['2026/10/14']]);
    });

    it('shows one chip for the same day given twice in different forms', () => {
      create({ model: [new Date(2026, 9, 5), '2026/10/05'] });
      expect(rows().length).toBe(1);
      expect(comp.formControl.value).toEqual(['2026/10/05']);
    });

    it('never writes back a model that came from the parent', () => {
      const parent = [new Date(2026, 9, 5), new Date(2026, 9, 6).getTime()];
      create({ model: parent });
      fixture.detectChanges();
      expect(modelChanges).toEqual([]);
      expect(changes).toEqual([]);
      expect(comp.model() as unknown).toBe(parent);
      expect(parent[0]).toEqual(new Date(2026, 9, 5));
    });

    it('writes each day with transform="ISOString" as the start of that day', () => {
      create({ model: ['2026/10/05'], transform: 'ISOString' });
      comp.onSelectDate(new Date(2026, 9, 7));
      expect(modelChanges).toEqual([[new Date(2026, 9, 5).toISOString(), new Date(2026, 9, 7).toISOString()]]);
    });

    it('skips items it cannot read and warns once in dev mode', () => {
      const warn = spyOn(console, 'warn');
      create({ model: ['not a date', '2026/10/05', ''] });
      fixture.componentRef.setInput('model', ['still not a date', '2026/10/05']);
      fixture.detectChanges();
      expect(comp.formControl.value).toEqual(['2026/10/05']);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('A4 · one error gate', () => {
    it('does not show an error while a too-short selection is still being picked', () => {
      create({ min: 3 });
      comp.onSelectDate(new Date(2026, 9, 5));
      fixture.detectChanges();
      expect(comp.formControl.invalid).toBeTrue();
      expect(comp.matcher.isErrorState(null, null)).toBeFalse();
      expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    });

    it('marks the control touched when the calendar closes', () => {
      create();
      comp.onCloseCalendar();
      expect(comp.formControl.touched).toBeTrue();
    });
  });

  describe('A6 · names', () => {
    it('names each chip with the full date and its remove button with "Bỏ ngày …"', () => {
      create({ model: ['2026/05/09'] });
      const i18n = TestBed.inject(I18nService);
      const full = new Intl.DateTimeFormat(i18n.locale(), FULL_DATE).format(new Date(2026, 4, 9));
      const primary = primaryAction(rows()[0]);
      expect(primary.getAttribute('aria-label')).toBe(full);
      const remove = rows()[0].querySelector('[matChipRemove]')!;
      expect(remove.getAttribute('aria-label')).toBe(i18n.t('core.form.chip-calendar.remove', { date: full }));
    });

    it('adds the locked note to a chip that cannot be removed', () => {
      create({ model: ['2026/05/09'], removable: false });
      const i18n = TestBed.inject(I18nService);
      const full = new Intl.DateTimeFormat(i18n.locale(), FULL_DATE).format(new Date(2026, 4, 9));
      const primary = primaryAction(rows()[0]);
      expect(primary.getAttribute('aria-label')).toBe(`${full}, ${i18n.t('core.form.chip-calendar.locked')}`);
      expect(rowText()[0]).not.toContain('cancel');
    });
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdChipCalendar, FormsModule],
  template: `<form #f="ngForm"><sd-chip-calendar name="dates" label="Ngày nghỉ" [form]="f" required /></form>`,
})
class SubmitHost {
  @ViewChild('f') ngForm!: NgForm;
}

describe('SdChipCalendar · design handoff step 1 · submit', () => {
  it('shows the required error and aria-invalid after a submit without touching the field', async () => {
    await TestBed.configureTestingModule({ imports: [SubmitHost, NoopAnimationsModule] }).compileComponents();
    const fixture = TestBed.createComponent(SubmitHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.ngForm.onSubmit(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-error')).withContext('mat-error').not.toBeNull();
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-invalid')).toBe('true');
  });
});
