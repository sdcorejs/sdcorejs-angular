import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, isSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Size } from '@sdcorejs/utils/models';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdChip } from './chip.component';

// Design handoff (design-icon-chip-table) · CH3: the chip scale and look that sd-chip shares with sd-chip-calendar
// through the sd-chip-row() mixin (C1, C2), the locked chip (C3), the dead CSS (C4) and the code cleanup (D1).

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdChip, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div [style.width.px]="width">
      <sd-chip
        [label]="label"
        [size]="size"
        [model]="model"
        [removable]="removable"
        [clearable]="clearable"
        [maxVisible]="maxVisible"
        [disabled]="disabled" />
    </div>
    <span class="probe-surface" style="background-color: var(--sd-surface)"></span>
    <span class="probe-border" style="border: 1px solid var(--sd-border)"></span>
    <span class="probe-locked" style="background-color: var(--sd-chip-locked-bg)"></span>
  `,
})
class ChipHost {
  width = 420;
  label = 'Thẻ';
  size: Size = 'md';
  model: (string | number)[] = ['alpha'];
  removable: boolean | ((item: string | number) => boolean) = true;
  clearable = false;
  maxVisible: number | null = null;
  disabled = false;
}

describe('SdChip · design handoff CH3 · chip scale and look', () => {
  let fixture: ComponentFixture<ChipHost>;

  const create = async (inputs: Partial<ChipHost> = {}) => {
    fixture = TestBed.createComponent(ChipHost);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const host = (): HTMLElement => fixture.nativeElement;
  const wrapper = () => host().querySelector('.mat-mdc-text-field-wrapper') as HTMLElement;
  const rows = (): HTMLElement[] => Array.from(host().querySelectorAll('mat-chip-row'));
  const box = (el: Element) => el.getBoundingClientRect();
  const colour = (selector: string, property: 'backgroundColor' | 'borderTopColor') =>
    getComputedStyle(host().querySelector(selector)!)[property];

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [ChipHost, NoopAnimationsModule] }).compileComponents();
  });

  describe('C1 · scale', () => {
    for (const [size, field, chip, font, padding] of [
      ['sm', 32, 20, 12, 8],
      ['md', 40, 24, 13, 8],
      ['lg', 48, 28, 14, 10],
    ] as const) {
      it(`${size}: one line is ${field}px with a ${chip}px chip in the middle`, async () => {
        await create({ size });
        const row = rows()[0];
        expect(box(wrapper()).height).withContext('field').toBeCloseTo(field, 0);
        expect(box(row).height).withContext('chip').toBeCloseTo(chip, 0);
        const top = box(row).top - box(wrapper()).top;
        const bottom = box(wrapper()).bottom - box(row).bottom;
        expect(Math.abs(top - bottom))
          .withContext('centred')
          .toBeLessThanOrEqual(1);
        expect(getComputedStyle(row.querySelector('.sd-chip__chip-text')!).fontSize)
          .withContext('text')
          .toBe(`${font}px`);
        const text = box(row.querySelector('.sd-chip__chip-text')!);
        expect(text.left - box(row).left)
          .withContext('padding before the text')
          .toBeCloseTo(padding, 0);
      });
    }

    // why: icon ✕ / khoá theo cỡ của sd-chip-calendar (12 / 14 / 16px, nhỏ hơn bảng handoff một bậc — user chọn
    // 2026-10-23 cho chip-calendar), để hai field chip giống nhau.
    for (const [size, icon] of [
      ['sm', 12],
      ['md', 14],
      ['lg', 16],
    ] as const) {
      it(`${size}: ✕ and lock are ${icon}px and the lock sits where the ✕ sits`, async () => {
        await create({ size, model: ['alpha', 'beta'], removable: item => item !== 'alpha' });
        const locked = host().querySelector('.sd-chip__chip--locked') as HTMLElement;
        const removable = host().querySelector('.sd-chip__chip:not(.sd-chip__chip--locked)') as HTMLElement;
        const remove = removable.querySelector('.mat-mdc-chip-remove') as HTMLElement;
        const removeGlyph = remove.querySelector('mat-icon') as HTMLElement;
        const lockGlyph = locked.querySelector('.sd-chip__lock mat-icon') as HTMLElement;
        expect(getComputedStyle(removeGlyph).fontSize).withContext('✕ glyph').toBe(`${icon}px`);
        expect(getComputedStyle(lockGlyph).fontSize).withContext('lock glyph').toBe(`${icon}px`);
        expect(box(remove).width)
          .withContext('✕ button')
          .toBeCloseTo(icon + 4, 0);
        expect(getComputedStyle(remove).borderRadius).withContext('✕ button corner').toBe('50%');

        const geometry = (chip: HTMLElement, glyph: HTMLElement) => {
          const c = box(chip);
          const t = box(chip.querySelector('.sd-chip__chip-text')!);
          const g = box(glyph);
          return { textToGlyph: g.left - t.right, glyphToEdge: c.right - g.right, centre: g.top + g.height / 2 - (c.top + c.height / 2) };
        };
        const close = geometry(removable, removeGlyph);
        const lock = geometry(locked, lockGlyph);
        expect(close.textToGlyph).withContext('text → ✕').toBeCloseTo(4, 0);
        expect(close.glyphToEdge).withContext('✕ → chip edge').toBeCloseTo(5, 0);
        expect(lock.textToGlyph).withContext('text → lock').toBeCloseTo(close.textToGlyph, 0);
        expect(lock.glyphToEdge).withContext('lock → chip edge').toBeCloseTo(close.glyphToEdge, 0);
        expect(Math.abs(lock.centre)).withContext('lock centred in the chip').toBeLessThanOrEqual(0.5);
      });
    }

    for (const [size, button, icon] of [
      ['sm', 24, 16],
      ['md', 28, 18],
      ['lg', 32, 20],
    ] as const) {
      it(`${size}: the clear button is ${button}px with a ${icon}px icon`, async () => {
        await create({ size, clearable: true });
        const clear = host().querySelector('button.sd-chip__clear') as HTMLElement;
        expect(box(clear).width).withContext('width').toBeCloseTo(button, 0);
        expect(box(clear).height).withContext('height').toBeCloseTo(button, 0);
        expect(getComputedStyle(clear.querySelector('mat-icon')!).fontSize)
          .withContext('icon')
          .toBe(`${icon}px`);
      });
    }

    it('makes “+N” as tall as a chip and spaces chips 4px apart', async () => {
      await create({ model: ['alpha', 'beta', 'gamma'], maxVisible: 2 });
      const more = host().querySelector('.sd-chip__more') as HTMLElement;
      expect(box(more).height).withContext('+N').toBeCloseTo(24, 0);
      expect(box(rows()[1]).left - box(rows()[0]).right)
        .withContext('gap')
        .toBeCloseTo(4, 0);
      expect(box(more).left - box(rows()[1]).right)
        .withContext('gap before +N')
        .toBeCloseTo(4, 0);
    });

    // C4: the md chip set used to sit 10px lower (`margin-top`), so two chips and the input made the field taller.
    it('keeps two chips and the input on one 40px line', async () => {
      await create({ model: ['alpha', 'beta'] });
      expect(box(wrapper()).height).withContext('field').toBeCloseTo(40, 0);
      const input = host().querySelector('input.sd-chip-input') as HTMLElement;
      expect(Math.abs(box(input).top + box(input).height / 2 - (box(rows()[0]).top + box(rows()[0]).height / 2)))
        .withContext('input on the chip line')
        .toBeLessThanOrEqual(1);
    });

    // why: Material giữ cho ô nhập 150px (`flex: 1 0 150px`), nên ba chip ngắn cùng nút bỏ hết trong ô 420px đã đẩy ô nhập
    // xuống dòng hai ở md / lg. Vùng gõ chỉ cần 80px (khoảng 10 ký tự) trước khi xuống dòng.
    for (const [size, field] of [
      ['md', 40],
      ['lg', 48],
    ] as const) {
      it(`${size}: keeps three short chips, the input and the clear button on one ${field}px line`, async () => {
        await create({ size, model: ['Quản trị', 'Angular', 'RxJS'], removable: item => item !== 'Quản trị', clearable: true });
        expect(box(wrapper()).height).withContext('field').toBeCloseTo(field, 0);
        const input = host().querySelector('input.sd-chip-input') as HTMLElement;
        expect(box(input).width).withContext('typing area').toBeGreaterThanOrEqual(80);
      });
    }

    // why: trong ô sd-table (sm, maxVisible 2) hai chip + “+N” + vùng gõ 80px không vừa một dòng, nên dòng bảng cao lên
    // đúng điều B7 muốn tránh. Khi đang gộp thì không ai gõ: ô nhập chỉ lấp phần còn lại, không placeholder.
    it('keeps a folded table-cell field on one line and brings the typing area back on focus', async () => {
      await create({
        width: 280,
        label: '',
        size: 'sm',
        maxVisible: 2,
        model: ['angular', 'typescript', 'rxjs', 'https://sdcorejs.github.io/sdcorejs-angular/latest/forms/chip', 'material'],
      });
      const input = host().querySelector('input.sd-chip-input') as HTMLInputElement;
      expect(host().querySelector('.sd-chip__more')).withContext('+N').not.toBeNull();
      expect(box(wrapper()).height).withContext('folded field').toBeCloseTo(32, 0);
      expect(input.getAttribute('placeholder')).withContext('no placeholder while folded').toBeNull();

      input.focus();
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(rows().length).withContext('every chip').toBe(5);
      expect(box(input).width).withContext('typing area').toBeGreaterThanOrEqual(80);
      expect(input.getAttribute('placeholder')).withContext('placeholder back').toBeTruthy();
    });

    it('wraps the input to a new line before it gets narrower than 80px', async () => {
      await create({ model: ['một giá trị khá dài', 'một giá trị khá dài nữa', 'thêm một'] });
      const input = host().querySelector('input.sd-chip-input') as HTMLElement;
      expect(box(input).width).withContext('typing area').toBeGreaterThanOrEqual(80);
    });
  });

  describe('C2 · chip look', () => {
    it('draws a 6px-radius chip with a 1px border on the surface colour', async () => {
      await create();
      const row = rows()[0];
      expect(getComputedStyle(row).borderTopLeftRadius).withContext('radius').toBe('6px');
      expect(getComputedStyle(row).backgroundColor).withContext('background').toBe(colour('.probe-surface', 'backgroundColor'));
      const outline = getComputedStyle(row.querySelector('.mdc-evolution-chip__action--primary')!, '::before');
      expect(outline.borderTopWidth).withContext('border width').toBe('1px');
      expect(outline.borderTopColor).withContext('border colour').toBe(colour('.probe-border', 'borderTopColor'));
      expect(getComputedStyle(row.querySelector('.sd-chip__chip-text')!).fontVariantNumeric)
        .withContext('digits')
        .toBe('tabular-nums');
    });

    it('shares the chip classes with sd-chip-calendar: the field carries .sd-chip-field', async () => {
      await create();
      expect(host().querySelector('mat-form-field.sd-chip-field')).not.toBeNull();
    });
  });

  describe('C3 · locked chip', () => {
    it('gives a chip that removable keeps the locked background, a lock with a tooltip and a name that says so', async () => {
      await create({ model: ['alpha', 'beta'], removable: item => item !== 'alpha' });
      const i18n = TestBed.inject(I18nService);
      const [locked, free] = rows();
      expect(locked.classList).toContain('sd-chip__chip--locked');
      expect(free.classList).not.toContain('sd-chip__chip--locked');
      expect(getComputedStyle(locked).backgroundColor).withContext('locked background').toBe(colour('.probe-locked', 'backgroundColor'));
      expect(getComputedStyle(locked).backgroundColor)
        .withContext('differs from a removable chip')
        .not.toBe(getComputedStyle(free).backgroundColor);

      const lock = fixture.debugElement.query(By.css('.sd-chip__lock'));
      expect(lock.nativeElement.textContent.trim()).toBe('lock');
      expect(lock.injector.get(MatTooltip).message).toBe(i18n.t('core.form.chip.locked'));

      // why: Material 19 đặt tên chip lên ô role=gridcell của mat-chip-row; bản mới hơn lên nút primary action.
      const name = (row: Element) =>
        (row.querySelector('[role="gridcell"][aria-label], .mdc-evolution-chip__action--primary[aria-label]') ??
          row.querySelector('[role="gridcell"]'))!.getAttribute('aria-label');
      expect(name(locked)).toBe(`alpha, ${i18n.t('core.form.chip.locked')}`);
      expect(name(free)).withContext('a removable chip keeps its text as its name').toBeNull();
    });

    it('shows neither ✕ nor lock while disabled', async () => {
      await create({ model: ['alpha'], removable: false, disabled: true });
      expect(host().querySelector('.sd-chip__lock')).toBeNull();
      expect(host().querySelector('[matChipRemove]')).toBeNull();
    });
  });

  describe('D1 · cleanup', () => {
    const chip = () => fixture.debugElement.query(By.directive(SdChip)).componentInstance as SdChip;

    it('drops the unused autocomplete path', async () => {
      await create();
      expect('onSelect' in chip())
        .withContext('onSelect')
        .toBeFalse();
      expect('selectable' in chip())
        .withContext('selectable')
        .toBeFalse();
      expect('separatorKeysCodes' in chip())
        .withContext('separatorKeysCodes')
        .toBeFalse();
      expect(host().querySelector('mat-autocomplete')).toBeNull();
    });

    it('keeps the focus state in a signal', async () => {
      await create();
      expect(isSignal(chip().isFocused)).toBeTrue();
    });
  });
});
