import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCalendar } from '@angular/material/datepicker';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdChipCalendar } from './chip-calendar.component';

// Design handoff (sd-chip-calendar) · step 2: a CDK overlay role="dialog" with its own header, head and footer (A3, A5,
// B4, B5, B6, C1). 2031 dates keep the calendar away from today.

describe('SdChipCalendar · design handoff step 2 · popup', () => {
  let fixture: ComponentFixture<SdChipCalendar>;
  let comp: SdChipCalendar;
  let overlay: HTMLElement;
  let changes: unknown[];
  let i18n: I18nService;

  const create = (inputs: Record<string, unknown> = {}) => {
    fixture = TestBed.createComponent(SdChipCalendar);
    comp = fixture.componentInstance;
    changes = [];
    comp.sdChange.subscribe(value => changes.push(value));
    fixture.componentRef.setInput('label', 'Ngày nghỉ');
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
  };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input');
  const panel = (): HTMLElement | null => overlay.querySelector('.sd-chip-calendar-panel');
  const open = async () => {
    input().click();
    await settle();
  };
  const cell = (day: number): HTMLElement =>
    Array.from(overlay.querySelectorAll<HTMLElement>('.mat-calendar-body-cell')).find(
      element => element.querySelector('.mat-calendar-body-cell-content')?.textContent?.trim() === String(day)
    )!;
  const calendar = (): MatCalendar<Date> => fixture.debugElement.query(By.directive(MatCalendar))?.componentInstance;
  const key = (target: EventTarget, name: string, keyCode: number) => {
    const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    target.dispatchEvent(event);
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdChipCalendar, NoopAnimationsModule] }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => (overlay.innerHTML = ''));

  describe('A3 · dialog', () => {
    it('opens a role="dialog" panel named after the label, not a menu', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      expect(panel()).withContext('panel').not.toBeNull();
      expect(panel()!.getAttribute('role')).toBe('dialog');
      expect(panel()!.getAttribute('aria-label')).toBe('Ngày nghỉ');
      expect(overlay.querySelector('.mat-mdc-menu-panel')).toBeNull();
    });

    it('keeps the panel open when Tab moves from the header to the grid', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      const next = panel()!.querySelector<HTMLElement>('[data-chip-calendar-next]')!;
      next.focus();
      key(next, 'Tab', 9);
      cell(15).focus();
      await settle();
      expect(panel()).not.toBeNull();
    });

    it('closes on Escape, marks the field touched and gives focus back to the input', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      key(cell(15), 'Escape', 27);
      await settle();
      expect(panel()).toBeNull();
      expect(comp.formControl.touched).toBeTrue();
      expect(document.activeElement).toBe(input());
    });

    it('keeps the panel open when a day is picked', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      cell(18).click();
      await settle();
      expect(changes).toEqual([['2031/03/15', '2031/03/18']]);
      expect(panel()).not.toBeNull();
    });
  });

  describe('B6 · head and footer', () => {
    it('counts the chosen days and states the limit', async () => {
      create({ model: ['2031/03/15', '2031/03/18'], maxCount: 10 });
      await open();
      const head = panel()!.querySelector('.sd-chip-calendar-panel__head')!.textContent!;
      expect(head).toContain(i18n.t('core.form.chip-calendar.selected-count', { count: 2 }));
      expect(head).toContain(i18n.t('core.form.chip-calendar.max-count', { max: 10 }));
    });

    it('says there is no limit without maxCount', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      expect(panel()!.querySelector('.sd-chip-calendar-panel__head')!.textContent).toContain(i18n.t('core.form.chip-calendar.no-limit'));
    });

    it('closes with "Xong" and gives focus back to the input', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      panel()!.querySelector<HTMLElement>('[data-chip-calendar-done] button')!.click();
      await settle();
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(input());
    });

    it('offers "Xoá hết" only when clearable, keeps locked days and disables it when nothing can go', async () => {
      create({ model: ['2031/03/15'] });
      await open();
      expect(panel()!.querySelector('[data-chip-calendar-clear-all]')).withContext('not clearable').toBeNull();
      overlay.innerHTML = '';

      create({ model: ['2031/03/15', '2031/03/18'], clearable: true, removable: (day: string) => day !== '2031/03/15' });
      await open();
      panel()!.querySelector<HTMLElement>('[data-chip-calendar-clear-all] button')!.click();
      await settle();
      expect(changes).toEqual([['2031/03/15']]);
      expect(panel()!.querySelector('[data-chip-calendar-clear-all] button')!.hasAttribute('disabled')).toBeTrue();
    });
  });

  describe('A5 · maxCount', () => {
    it('disables the unchosen days and says so once the limit is reached, and reopens them after a removal', async () => {
      create({ model: ['2031/03/15', '2031/03/18'], maxCount: 2 });
      await open();
      expect(cell(20).getAttribute('aria-disabled')).toBe('true');
      expect(cell(15).getAttribute('aria-disabled')).not.toBe('true');
      const live = panel()!.querySelector('[aria-live="polite"]')!;
      expect(live.textContent).toContain(i18n.t('core.form.chip-calendar.full', { max: 2 }));

      cell(15).click();
      await settle();
      expect(cell(20).getAttribute('aria-disabled')).not.toBe('true');
      expect(live.textContent?.trim()).toBe('');
    });
  });

  describe('B4 · first month', () => {
    it('opens at the chosen day nearest to today', async () => {
      create({ model: ['2035/01/01', '2031/03/15'] });
      await open();
      expect([calendar().activeDate.getFullYear(), calendar().activeDate.getMonth()]).toEqual([2031, 2]);
    });

    it('opens at startAt when it is set', async () => {
      create({ model: ['2031/03/15'], startAt: '2040/06/01' });
      await open();
      expect([calendar().activeDate.getFullYear(), calendar().activeDate.getMonth()]).toEqual([2040, 5]);
    });
  });

  describe('B5 · date limits', () => {
    // 15 Mar 2031 is a Saturday.
    const noWeekend = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;

    it('disables days outside minDate / maxDate and days the filter refuses', async () => {
      create({ model: [], startAt: '2031/03/12', minDate: '2031/03/10', maxDate: '2031/03/20', dateFilter: noWeekend });
      await open();
      expect(cell(9).getAttribute('aria-disabled')).withContext('before minDate').toBe('true');
      expect(cell(21).getAttribute('aria-disabled')).withContext('after maxDate').toBe('true');
      expect(cell(15).getAttribute('aria-disabled')).withContext('weekend').toBe('true');
      expect(cell(18).getAttribute('aria-disabled')).withContext('a free Tuesday').not.toBe('true');
    });

    it('still lets the user remove a chosen day the filter refuses', async () => {
      create({ model: ['2031/03/15'], dateFilter: noWeekend });
      await open();
      expect(cell(15).getAttribute('aria-disabled')).not.toBe('true');
      cell(15).click();
      await settle();
      expect(changes).toEqual([[]]);
    });

    it('marks chosen and locked days with classes', async () => {
      create({ model: ['2031/03/15', '2031/03/18'], removable: (day: string) => day !== '2031/03/15' });
      await open();
      expect(cell(18).classList).toContain('sd-chip-calendar-selected');
      expect(cell(15).classList).toContain('sd-chip-calendar-locked');
      expect(cell(15).getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('minCount / maxCount and the deprecated min / max', () => {
    it('keeps min / max working as aliases, with one dev-mode warning', () => {
      const warn = spyOn(console, 'warn');
      create({ model: ['2031/03/15', '2031/03/18'], max: 1 });
      expect(comp.formControl.errors?.['maxlength']).toBeTruthy();
      fixture.componentRef.setInput('min', 3);
      fixture.detectChanges();
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('deprecated')).length).toBe(1);
    });

    it('lets minCount win over min', () => {
      create({ model: ['2031/03/15'], min: 5, minCount: 2 });
      expect(comp.formControl.errors?.['minlength']?.requiredLength).toBe(2);
    });
  });
});
