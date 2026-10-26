import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Size } from '@sdcorejs/utils/models';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdChipCalendar } from './chip-calendar.component';

// Design handoff (sd-chip-calendar) · step 3: suffix buttons, chips sorted by date, “+N”, displayFormat, viewed text,
// placeholder and the 20 / 24 / 28 chip scale (B1, B2, B3, C2, C3).

describe('SdChipCalendar · design handoff step 3 · field', () => {
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
  const el = (): HTMLElement => fixture.nativeElement;
  const chipTexts = () =>
    Array.from(el().querySelectorAll('mat-chip-row .mdc-evolution-chip__text-label')).map(label =>
      label.textContent?.replace(/\s+/g, ' ').trim()
    );
  const openButton = () => el().querySelector<HTMLButtonElement>('button[data-chip-calendar-open]');
  const clearButton = () => el().querySelector<HTMLButtonElement>('button.sd-clear-btn');
  const panel = () => overlay.querySelector('.sd-chip-calendar-panel');

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdChipCalendar, NoopAnimationsModule] }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => (overlay.innerHTML = ''));

  describe('B1 · suffix', () => {
    it('has a calendar button that opens and closes the popup', async () => {
      create({ model: ['2031/03/15'] });
      const button = openButton()!;
      expect(button).withContext('calendar button').not.toBeNull();
      expect(button.getAttribute('aria-label')).toBe(i18n.t('core.form.date.open-picker'));
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      button.click();
      await settle();
      expect(panel()).not.toBeNull();
      expect(button.getAttribute('aria-expanded')).toBe('true');
      button.click();
      await settle();
      expect(panel()).toBeNull();
    });

    it('offers the clear button only when clearable, keeps locked days, does not open the popup', async () => {
      create({ model: ['2031/03/15', '2031/03/18'] });
      expect(clearButton()).withContext('not clearable').toBeNull();

      create({ model: ['2031/03/15', '2031/03/18'], clearable: true, removable: (day: string) => day !== '2031/03/15' });
      expect(clearButton()!.getAttribute('aria-label')).toBe(i18n.t('core.form.chip-calendar.clear'));
      clearButton()!.click();
      await settle();
      expect(changes).toEqual([['2031/03/15']]);
      expect(panel()).toBeNull();
      expect(clearButton()).withContext('only locked days left').toBeNull();
    });

    it('hides both buttons when disabled, and the clear button when required', () => {
      create({ model: ['2031/03/15'], clearable: true, disabled: true });
      expect(openButton()).toBeNull();
      expect(clearButton()).toBeNull();
      create({ model: ['2031/03/15'], clearable: true, required: true });
      expect(clearButton()).toBeNull();
      expect(openButton()).not.toBeNull();
    });

    it('uses the default placeholder “Chọn ngày” instead of the label', () => {
      create({ model: [] });
      expect(el().querySelector('input')!.getAttribute('placeholder')).toBe(i18n.t('core.form.chip-calendar.placeholder'));
    });

    // Design handoff · field: the placeholder only shows while no day is chosen, like the prototype.
    it('shows the placeholder only while no day is chosen', () => {
      create({ model: ['2031/10/05'], placeholder: 'Chọn ngày nghỉ' });
      expect(el().querySelector('input')!.getAttribute('placeholder') ?? '').toBe('');
      fixture.componentRef.setInput('model', []);
      fixture.detectChanges();
      expect(el().querySelector('input')!.getAttribute('placeholder')).toBe('Chọn ngày nghỉ');
    });
  });

  describe('B2 / C3 · chips', () => {
    it('shows chips by date without reordering the model', () => {
      const model = ['2031/10/27', '2031/10/05'];
      create({ model });
      expect(chipTexts()).toEqual(['05/10/2031', '27/10/2031']);
      expect(model).toEqual(['2031/10/27', '2031/10/05']);
    });

    it('formats chips with displayFormat', () => {
      create({ model: ['2031/10/05'], displayFormat: 'd/M' });
      expect(chipTexts()).toEqual(['5/10']);
    });

    it('shows a lock instead of the remove button on a day that cannot go', () => {
      create({ model: ['2031/10/05'], removable: false });
      const row = el().querySelector('mat-chip-row')!;
      expect(row.querySelector('[matChipRemove]')).toBeNull();
      expect(row.querySelector('sd-icon.sd-chip-calendar__lock')).not.toBeNull();
      expect(row.classList).toContain('sd-chip-calendar__chip--locked');
    });

    it('uses the close icon on the remove button', () => {
      create({ model: ['2031/10/05'] });
      expect(el().querySelector('[matChipRemove]')!.getAttribute('name')).toBe('close');
    });
  });

  describe('B3 · maxVisible', () => {
    it('folds the extra days into “+N” while closed and shows them all once open', async () => {
      create({ model: ['2031/10/05', '2031/10/06', '2031/10/07', '2031/10/08', '2031/10/09'], maxVisible: 2 });
      expect(chipTexts()).toEqual(['05/10/2031', '06/10/2031']);
      const more = el().querySelector<HTMLButtonElement>('button.sd-chip-calendar__more')!;
      expect(more.textContent?.trim()).toBe('+3');
      expect(more.getAttribute('aria-label')).toBe(i18n.t('core.form.chip-calendar.more', { count: 3 }));
      more.click();
      await settle();
      expect(panel()).not.toBeNull();
      expect(chipTexts().length).toBe(5);
    });
  });

  describe('C3 · viewed', () => {
    it('shows the days sorted and formatted, joined by commas', () => {
      create({ model: ['2031/10/27', '2031/10/05'], viewed: true });
      expect(el().querySelector('sd-view')!.textContent).toContain('05/10/2031, 27/10/2031');
    });
  });
});

@Component({
  imports: [SdChipCalendar, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 420px">
      <sd-chip-calendar label="Ngày nghỉ" [size]="size" [model]="model" [removable]="removable" [clearable]="clearable" />
    </div>
  `,
})
class SizeHost {
  size: Size = 'md';
  model: string[] = ['2031/10/05'];
  removable: boolean | ((day: string) => boolean) = true;
  clearable = false;
}

describe('SdChipCalendar · design handoff step 3 · size scale (C2)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SizeHost, NoopAnimationsModule] }).compileComponents();
  });

  for (const [size, field, chip] of [
    ['sm', 32, 20],
    ['md', 40, 24],
    ['lg', 48, 28],
  ] as const) {
    it(`${size}: one line is ${field}px with a ${chip}px chip`, async () => {
      const fixture = TestBed.createComponent(SizeHost);
      fixture.componentInstance.size = size;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const wrapper = fixture.nativeElement.querySelector('.mat-mdc-text-field-wrapper') as HTMLElement;
      const row = fixture.nativeElement.querySelector('mat-chip-row') as HTMLElement;
      expect(wrapper.getBoundingClientRect().height).withContext('field').toBeCloseTo(field, 0);
      expect(row.getBoundingClientRect().height).withContext('chip').toBeCloseTo(chip, 0);
      // The chip is centred in the field.
      const top = row.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
      const bottom = wrapper.getBoundingClientRect().bottom - row.getBoundingClientRect().bottom;
      expect(Math.abs(top - bottom))
        .withContext('centred')
        .toBeLessThanOrEqual(1);
    });
  }

  // why: icon ✕ / khoá nhỏ hơn bảng handoff một bậc (user chọn 2026-10-23: 16px trong chip 24px trông to). Material ép
  // icon của `.mat-mdc-chip-remove` thành 18px bất kể `--sd-icon-size`, và vẽ lớp hover `::after` hình bầu dục (hộp không
  // vuông + `border-radius: 50%`) chồng lên nền bo 4px — nên ✕ to hơn khoá và nền hover không tròn.
  for (const [size, icon] of [
    ['sm', 12],
    ['md', 14],
    ['lg', 16],
  ] as const) {
    it(`${size}: ✕ and lock are ${icon}px, the ✕ hover is a ${icon + 4}px circle`, async () => {
      const fixture = TestBed.createComponent(SizeHost);
      fixture.componentInstance.size = size;
      fixture.componentInstance.model = ['2031/10/05', '2031/10/12'];
      fixture.componentInstance.removable = day => day !== '2031/10/05';
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const remove = host.querySelector('.mat-mdc-chip-remove') as HTMLElement;
      const removeGlyph = remove.querySelector('mat-icon') as HTMLElement;
      const lockGlyph = host.querySelector('.sd-chip-calendar__lock mat-icon') as HTMLElement;

      expect(getComputedStyle(removeGlyph).fontSize).withContext('✕ glyph').toBe(`${icon}px`);
      expect(removeGlyph.getBoundingClientRect().width).withContext('✕ glyph box').toBeCloseTo(icon, 0);
      expect(getComputedStyle(lockGlyph).fontSize).withContext('lock glyph').toBe(`${icon}px`);
      expect(remove.getBoundingClientRect().width)
        .withContext('✕ button width')
        .toBeCloseTo(icon + 4, 0);
      expect(remove.getBoundingClientRect().height)
        .withContext('✕ button height')
        .toBeCloseTo(icon + 4, 0);
      expect(getComputedStyle(remove).borderRadius).withContext('✕ button corner').toBe('50%');
      // `::after` vẫn còn (vùng bấm 24×24 khi pointer: coarse), chỉ lớp màu hover / focus của Material là trong suốt.
      expect(getComputedStyle(remove, '::after').backgroundColor).withContext('Material state layer').toBe('rgba(0, 0, 0, 0)');
    });

    // why: khoá từng nằm trong dòng chữ với `margin-left: -1px` — lấn vào chữ 1px, lệch xuống theo baseline và cách mép
    // phải khác ✕. Chip khoá phải giống hệt chip bỏ được, chỉ khác icon.
    it(`${size}: the lock sits where the ✕ sits on a removable chip`, async () => {
      const fixture = TestBed.createComponent(SizeHost);
      fixture.componentInstance.size = size;
      fixture.componentInstance.model = ['2031/10/05', '2031/10/12'];
      fixture.componentInstance.removable = day => day !== '2031/10/05';
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const geometry = (chip: HTMLElement, glyph: HTMLElement) => {
        const c = chip.getBoundingClientRect();
        const t = chip.querySelector('.sd-chip-calendar__chip-text')!.getBoundingClientRect();
        const g = glyph.getBoundingClientRect();
        return { textToGlyph: g.left - t.right, glyphToEdge: c.right - g.right, centre: g.top + g.height / 2 - (c.top + c.height / 2) };
      };
      const locked = host.querySelector('.sd-chip-calendar__chip--locked') as HTMLElement;
      const removable = host.querySelector('.sd-chip-calendar__chip:not(.sd-chip-calendar__chip--locked)') as HTMLElement;
      const lock = geometry(locked, locked.querySelector('.sd-chip-calendar__lock mat-icon') as HTMLElement);
      const close = geometry(removable, removable.querySelector('.mat-mdc-chip-remove mat-icon') as HTMLElement);

      // ✕: 2px đệm của nút + 3px đệm cuối chip (handoff) — vòng hover cách mép chip 3px, không chạm viền.
      expect(close.textToGlyph).withContext('text → ✕').toBeCloseTo(4, 0);
      expect(close.glyphToEdge).withContext('✕ → chip edge').toBeCloseTo(5, 0);
      expect(lock.textToGlyph).withContext('text → lock').toBeCloseTo(close.textToGlyph, 0);
      expect(lock.glyphToEdge).withContext('lock → chip edge').toBeCloseTo(close.glyphToEdge, 0);
      expect(Math.abs(lock.centre)).withContext('lock centred in the chip').toBeLessThanOrEqual(0.5);
    });
  }

  // why: `.sd-clear-btn sd-icon` của core/form.scss ép icon 16px, nên icon 18 / 20px của md / lg chưa từng hiện. Thang nút
  // bỏ hết giờ nằm trong mixin sd-chip-row() dùng chung với sd-chip (handoff design-icon-chip-table · C1).
  for (const [size, button, icon] of [
    ['sm', 24, 16],
    ['md', 28, 18],
    ['lg', 32, 20],
  ] as const) {
    it(`${size}: the clear button is ${button}px with a ${icon}px icon`, async () => {
      const fixture = TestBed.createComponent(SizeHost);
      fixture.componentInstance.size = size;
      fixture.componentInstance.clearable = true;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const clear = fixture.nativeElement.querySelector('button.sd-clear-btn') as HTMLElement;
      expect(clear.getBoundingClientRect().width).withContext('width').toBeCloseTo(button, 0);
      expect(clear.getBoundingClientRect().height).withContext('height').toBeCloseTo(button, 0);
      expect(getComputedStyle(clear.querySelector('mat-icon')!).fontSize)
        .withContext('icon')
        .toBe(`${icon}px`);
    });
  }

  // why: Material cho ô nhập chip `flex: 1 0 150px`, nên ba chip trong ô 420px đã đẩy ô nhập xuống dòng hai (field 2 dòng
  // dù chip còn vừa). Ô nhập chỉ lấp phần còn lại của dòng.
  it('keeps three chips and the input on one line', async () => {
    const fixture = TestBed.createComponent(SizeHost);
    fixture.componentInstance.model = ['2031/10/05', '2031/10/12', '2031/10/27'];
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.mat-mdc-text-field-wrapper') as HTMLElement;
    expect(fixture.nativeElement.querySelectorAll('mat-chip-row').length).toBe(3);
    expect(wrapper.getBoundingClientRect().height).withContext('field').toBeCloseTo(40, 0);
  });

  // why: `MatFormField._textField` là view query, chỉ có sau khi view của form-field dựng xong. Origin đọc quá sớm rơi về
  // cả `mat-form-field` (gồm dòng subscript ~20px) nên popup mở bên dưới cách viền ~26px thay vì 6px. Khung Karma quá thấp để
  // popup vừa trên hay dưới (overlay bị đẩy), nên spec kiểm origin; khoảng cách 6px đo trên showcase.
  it('hangs the popup from the outline, not from the subscript row', async () => {
    const fixture = TestBed.createComponent(SizeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('button[data-chip-calendar-open]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const calendar = fixture.debugElement.query(debug => debug.componentInstance instanceof SdChipCalendar)
      .componentInstance as SdChipCalendar;
    expect(calendar.overlayOrigin()?.nativeElement.classList.contains('mat-mdc-text-field-wrapper')).withContext('origin').toBeTrue();
    expect(overlay.querySelector('.sd-chip-calendar-panel')).withContext('panel').not.toBeNull();
    overlay.innerHTML = '';
  });
});
