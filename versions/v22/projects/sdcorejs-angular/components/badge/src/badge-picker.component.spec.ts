import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Color, Size } from '@sdcorejs/utils/models';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdBadgePicker } from './badge-picker.component';
import { SD_BADGE_ICON_PRESET, SD_BADGE_TYPE_OPTIONS, SdBadgePickerValue } from './badge-picker.constants';
import { SdBadge, SdBadgeType } from './badge.component';

// sd-badge-picker (design handoff wave 3 · 1c): a control that picks a badge type, colour and icon in one panel. The
// panel edits a draft; closing it (Done, outside click, Tab out) writes the three models once, Esc discards.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadgePicker, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 360px">
      <sd-badge-picker
        label="Hiển thị trạng thái"
        previewTitle="Đã duyệt"
        autoId="status"
        [previewDescription]="previewDescription"
        [(type)]="type"
        [(color)]="color"
        [(icon)]="icon"
        [size]="size"
        [floatLabel]="floatLabel"
        [types]="types"
        [colors]="colors"
        [icons]="icons"
        [viewed]="viewed"
        (sdChange)="changes.push($event)" />
    </div>
    <button id="outside" type="button">outside</button>
  `,
})
class PickerHost {
  type: SdBadgeType | undefined = 'round';
  color: Color | undefined = 'success';
  icon: string | null = 'check_circle';
  size: Size = 'md';
  floatLabel: 'auto' | 'always' = 'auto';
  types: SdBadgeType[] | undefined;
  colors: Color[] | undefined;
  icons: string[] | undefined;
  viewed = false;
  previewDescription: string | null = null;
  changes: SdBadgePickerValue[] = [];
}

// Same size scale as sd-select: the picker is drawn by the same mat-form-field rules.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadgePicker, SdSelect, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 360px">
      <sd-badge-picker class="picker" label="Hiển thị trạng thái" type="round" color="success" [size]="size" />
      <sd-select class="select" label="Hiển thị trạng thái" [items]="['a', 'b']" model="a" [size]="size" />
    </div>
  `,
})
class SizeHost {
  size: Size = 'md';
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdBadgePicker, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="width: 360px">
      <sd-badge-picker [form]="form" name="statusBadge" label="Hiển thị trạng thái" required />
    </div>
  `,
})
class FormHost {
  form = new FormGroup({});
}

describe('SdBadgePicker', () => {
  let overlay: HTMLElement;

  const panel = () => overlay.querySelector('.sd-badge-picker-panel') as HTMLElement | null;
  const trigger = (fixture: ComponentFixture<unknown>) => fixture.nativeElement.querySelector('[data-badge-picker-trigger]') as HTMLElement;
  const tile = (type: SdBadgeType) => panel()!.querySelector(`[data-badge-picker-type="${type}"]`) as HTMLElement;
  const swatch = (color: Color) => panel()!.querySelector(`[data-badge-picker-color="${color}"]`) as HTMLElement;
  const iconCells = () => Array.from(panel()!.querySelectorAll<HTMLElement>('[data-badge-picker-icon]'));
  const noneCell = () => panel()!.querySelector('[data-badge-picker-icon-none]') as HTMLElement;
  const previewBadge = () => panel()!.querySelector('.sd-badge-picker-panel__preview sd-badge') as HTMLElement;
  const done = () => panel()!.querySelector('[data-badge-picker-done] button') as HTMLElement;
  const settle = (fixture: ComponentFixture<unknown>) => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };
  const open = (fixture: ComponentFixture<unknown>) => {
    trigger(fixture).click();
    settle(fixture);
  };
  const key = (target: Element, keyName: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true, ...init }));

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [PickerHost, FormHost, SizeHost, NoopAnimationsModule] }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => {
    overlay.innerHTML = '';
  });

  function createHost(patch: Partial<PickerHost> = {}): ComponentFixture<PickerHost> {
    const fixture = TestBed.createComponent(PickerHost);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
    return fixture;
  }

  describe('trigger', () => {
    it('shows the committed badge and a "type · colour · icon" summary', fakeAsync(() => {
      const fixture = createHost();
      const badge = fixture.debugElement.query(By.css('[data-badge-picker-trigger] sd-badge')).componentInstance as SdBadge;
      expect(badge.type()).toBe('round');
      expect(badge.effectiveColor()).toBe('success');
      expect(badge.title()).toBe('Đã duyệt');
      expect(trigger(fixture).querySelector('.sd-badge-picker__summary')!.textContent!.trim()).toBe('Round · Thành công · check_circle');
    }));

    it('floats the label only with a value or while open, and always with floatLabel="always"', fakeAsync(() => {
      const fixture = createHost({ type: undefined, color: undefined, icon: null });
      const label = () => fixture.nativeElement.querySelector('.mdc-floating-label') as HTMLElement;
      expect(label().classList).not.toContain('mdc-floating-label--float-above');
      expect(trigger(fixture).querySelector('.sd-badge-picker__placeholder')).toBeNull();
      open(fixture);
      expect(label().classList).toContain('mdc-floating-label--float-above');
      key(panel()!, 'Escape');
      settle(fixture);

      const always = createHost({ type: undefined, color: undefined, icon: null, floatLabel: 'always' });
      expect((always.nativeElement.querySelector('.mdc-floating-label') as HTMLElement).classList).toContain(
        'mdc-floating-label--float-above'
      );
      expect(trigger(always).querySelector('.sd-badge-picker__placeholder')!.textContent!.trim()).toBe('Chọn kiểu hiển thị');
    }));

    it('hides the summary at size sm and uses a md badge at size lg', fakeAsync(() => {
      const sm = createHost({ size: 'sm' });
      expect(trigger(sm).querySelector('.sd-badge-picker__summary')).toBeNull();
      expect((sm.debugElement.query(By.css('[data-badge-picker-trigger] sd-badge')).componentInstance as SdBadge).size()).toBe('sm');
      const lg = createHost({ size: 'lg' });
      expect((lg.debugElement.query(By.css('[data-badge-picker-trigger] sd-badge')).componentInstance as SdBadge).size()).toBe('md');
    }));

    // why: sm và md đi qua đúng rule của sd-select. lg không có rule riêng nên là chiều cao container của field
    // (sd-select lg còn cộng margin-top 10px cũ của mat-select, không phải chuẩn để so).
    it('is as tall as an sd-select at sm and md, and never taller than its field at any size', fakeAsync(() => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const fixture = TestBed.createComponent(SizeHost);
        fixture.componentInstance.size = size;
        settle(fixture);
        const wrapper = (selector: string) => fixture.nativeElement.querySelector(`${selector} .mat-mdc-text-field-wrapper`) as HTMLElement;
        const height = (selector: string) => wrapper(selector).getBoundingClientRect().height;
        // The badge never stretches the field: the field keeps the minimum height of its infix.
        const infix = fixture.nativeElement.querySelector('.picker .mat-mdc-form-field-infix') as HTMLElement;
        expect(height('.picker'))
          .withContext(`${size} infix`)
          .toBe(parseFloat(getComputedStyle(infix).minHeight));
        if (size !== 'lg') expect(height('.picker')).withContext(size).toBe(height('.select'));
        fixture.destroy();
      }
    }));

    it('centres the badge in the field and cuts the summary before the badge', fakeAsync(() => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const fixture = TestBed.createComponent(SizeHost);
        fixture.componentInstance.size = size;
        settle(fixture);
        const field = (fixture.nativeElement.querySelector('.picker .mat-mdc-text-field-wrapper') as HTMLElement).getBoundingClientRect();
        const badge = (
          fixture.nativeElement.querySelector('.picker [data-badge-picker-trigger] sd-badge') as HTMLElement
        ).getBoundingClientRect();
        expect(Math.abs(badge.top + badge.height / 2 - (field.top + field.height / 2)))
          .withContext(`${size} vertical centre`)
          .toBeLessThanOrEqual(1.5);
        const title = fixture.nativeElement.querySelector('.picker [data-badge-picker-trigger] .c-badge-title') as HTMLElement;
        expect(title.scrollWidth).withContext(`${size} badge title not cut`).toBeLessThanOrEqual(title.clientWidth);
        fixture.destroy();
      }
    }));

    it('is a combobox that opens a dialog', fakeAsync(() => {
      const fixture = createHost();
      const el = trigger(fixture);
      expect(el.getAttribute('role')).toBe('combobox');
      expect(el.getAttribute('aria-haspopup')).toBe('dialog');
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('aria-expanded')).toBe('false');
      expect(el.getAttribute('data-autoid')).toBe('components-badge-picker-status');
      open(fixture);
      expect(el.getAttribute('aria-expanded')).toBe('true');
      expect(el.getAttribute('aria-controls')).toBe(panel()!.id);
    }));
  });

  describe('panel', () => {
    it('opens a 400px dialog with the preview and three radio groups, focusing the chosen type', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      const el = panel()!;
      expect(el.getAttribute('role')).toBe('dialog');
      expect(el.getBoundingClientRect().width).toBe(400);
      expect(el.querySelectorAll('[role="radiogroup"]').length).toBe(3);
      expect(document.activeElement).toBe(tile('round'));
      expect(tile('round').getAttribute('aria-checked')).toBe('true');
      expect(swatch('success').getAttribute('aria-checked')).toBe('true');
    }));

    it('starts the first draft from round · secondary when nothing is chosen yet', fakeAsync(() => {
      const fixture = createHost({ type: undefined, color: undefined, icon: null });
      open(fixture);
      expect(tile('round').getAttribute('aria-checked')).toBe('true');
      expect(swatch('secondary').getAttribute('aria-checked')).toBe('true');
    }));

    it('changes only the draft and the preview until the panel closes', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      tile('tag').click();
      swatch('info').click();
      settle(fixture);
      expect(previewBadge().querySelector('.c-badge--tag.c-info')).not.toBeNull();
      expect(fixture.componentInstance.type).toBe('round');
      expect(fixture.componentInstance.color).toBe('success');
      expect(fixture.componentInstance.changes).toEqual([]);
    }));

    it('writes the draft and emits sdChange once on Done, then returns focus to the trigger', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      tile('tag').click();
      swatch('info').click();
      settle(fixture);
      done().click();
      settle(fixture);
      const host = fixture.componentInstance;
      expect(host.type).toBe('tag');
      expect(host.color).toBe('info');
      expect(host.icon).toBe('check_circle');
      expect(host.changes).toEqual([{ type: 'tag', color: 'info', icon: 'check_circle' }]);
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger(fixture));
    }));

    it('writes the draft on a click outside', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      tile('solid').click();
      settle(fixture);
      (fixture.nativeElement.querySelector('#outside') as HTMLElement).click();
      settle(fixture);
      expect(fixture.componentInstance.type).toBe('solid');
      expect(fixture.componentInstance.changes.length).toBe(1);
      expect(panel()).toBeNull();
    }));

    it('discards the draft on Esc without emitting', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      tile('tag').click();
      settle(fixture);
      key(document.activeElement!, 'Escape');
      settle(fixture);
      expect(fixture.componentInstance.type).toBe('round');
      expect(fixture.componentInstance.changes).toEqual([]);
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger(fixture));
    }));

    it('emits nothing when the panel closes without a change', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      done().click();
      settle(fixture);
      expect(fixture.componentInstance.changes).toEqual([]);
      const empty = createHost({ type: undefined, color: undefined, icon: null });
      open(empty);
      done().click();
      settle(empty);
      expect(empty.componentInstance.type).withContext('untouched first draft').toBeUndefined();
      expect(empty.componentInstance.changes).toEqual([]);
    }));

    it('writes the draft when Tab leaves the last control, and focus goes back to the trigger', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      tile('tag').click();
      settle(fixture);
      done().focus();
      key(done(), 'Tab');
      settle(fixture);
      expect(fixture.componentInstance.type).toBe('tag');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger(fixture));
    }));

    it('writes the draft when Shift+Tab leaves the first control, keeping focus on the trigger', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      tile('solid').click();
      settle(fixture);
      tile('solid').focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      tile('solid').dispatchEvent(event);
      settle(fixture);
      expect(event.defaultPrevented).toBeTrue();
      expect(fixture.componentInstance.type).toBe('solid');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger(fixture));
    }));

    it('marks the field focused while the trigger has focus or the panel is open', fakeAsync(() => {
      const fixture = createHost();
      const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;
      expect(field.classList).not.toContain('mat-focused');
      trigger(fixture).focus();
      settle(fixture);
      expect(field.classList).toContain('mat-focused');
      open(fixture);
      expect(document.activeElement).not.toBe(trigger(fixture));
      expect(field.classList).withContext('focus moved into the panel').toContain('mat-focused');
      key(document.activeElement!, 'Escape');
      settle(fixture);
    }));

    it('shows previewDescription on icon and tag, and a note under the preview for the other types', fakeAsync(() => {
      const fixture = createHost({ previewDescription: 'Bởi Nguyễn Văn A' });
      open(fixture);
      const hint = () => panel()!.querySelector('.sd-badge-picker-panel__hint');
      expect(hint()?.textContent?.trim()).toBe('Mô tả chỉ hiện ở kiểu icon và tag');
      tile('tag').click();
      settle(fixture);
      expect(hint()).toBeNull();
      expect(previewBadge().querySelector('.c-badge-description')?.textContent?.trim()).toBe('Bởi Nguyễn Văn A');
      const none = createHost();
      key(document.activeElement!, 'Escape');
      settle(fixture);
      open(none);
      expect(hint()).withContext('no description given').toBeNull();
    }));
  });

  describe('icons', () => {
    it('shows the icon group for icon, round, tag and solid only, and keeps the icon for dot and pair', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      expect(panel()!.querySelector('[data-badge-picker-icons]')).not.toBeNull();
      tile('dot').click();
      settle(fixture);
      expect(panel()!.querySelector('[data-badge-picker-icons]')).toBeNull();
      done().click();
      settle(fixture);
      expect(fixture.componentInstance.type).toBe('dot');
      expect(fixture.componentInstance.icon).toBe('check_circle');
      expect(fixture.componentInstance.changes).toEqual([{ type: 'dot', color: 'success', icon: 'check_circle' }]);
    }));

    it('names the first cell "Chấm (không icon)" for type icon and "Không icon" otherwise; it clears the icon', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      expect(noneCell().getAttribute('aria-label')).toBe('Không icon');
      tile('icon').click();
      settle(fixture);
      expect(noneCell().getAttribute('aria-label')).toBe('Chấm (không icon)');
      noneCell().click();
      settle(fixture);
      expect(previewBadge().querySelector('.c-badge-dot')).withContext('icon type without icon shows the dot').not.toBeNull();
      done().click();
      settle(fixture);
      expect(fixture.componentInstance.icon).toBeNull();
    }));

    it('filters the icon grid by name and says when nothing matches', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      expect(iconCells().length).toBe(23);
      const search = panel()!.querySelector('[data-badge-picker-icons] input') as HTMLInputElement;
      search.value = 'sch';
      search.dispatchEvent(new Event('input'));
      settle(fixture);
      expect(iconCells().map(cell => cell.getAttribute('data-badge-picker-icon'))).toEqual(['schedule']);
      search.value = 'zzz';
      search.dispatchEvent(new Event('input'));
      settle(fixture);
      expect(iconCells().length).toBe(0);
      expect(panel()!.textContent).toContain('Không có icon khớp');
    }));

    it('limits the choices with types, colors and icons', fakeAsync(() => {
      const fixture = createHost({ types: ['round', 'tag'], colors: ['success', 'error'], icons: ['star'] });
      open(fixture);
      expect(panel()!.querySelectorAll('[data-badge-picker-type]').length).toBe(2);
      expect(panel()!.querySelectorAll('[data-badge-picker-color]').length).toBe(2);
      expect(iconCells().map(cell => cell.getAttribute('data-badge-picker-icon'))).toEqual(['star']);
    }));
  });

  describe('keyboard', () => {
    it('moves between the radios of a group with the arrow keys', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      key(tile('round'), 'ArrowRight');
      expect(document.activeElement).toBe(tile('tag'));
      key(tile('tag'), 'ArrowDown');
      expect(document.activeElement).withContext('three columns').toBe(tile('pair'));
      key(tile('pair'), 'Home');
      expect(document.activeElement).toBe(tile('icon'));
      const first = iconCells()[0];
      first.focus();
      key(first, 'ArrowDown');
      expect(document.activeElement).withContext('eight columns').toBe(iconCells()[8]);
      expect(tile('round').getAttribute('aria-checked')).withContext('arrows move focus, not the choice').toBe('true');
    }));

    it('keeps one tab stop per group on the chosen radio', fakeAsync(() => {
      const fixture = createHost();
      open(fixture);
      const stops = (selector: string) => Array.from(panel()!.querySelectorAll(selector)).filter(el => el.getAttribute('tabindex') === '0');
      expect(stops('[data-badge-picker-type]')).toEqual([tile('round')]);
      expect(stops('[data-badge-picker-color]')).toEqual([swatch('success')]);
      expect(stops('[data-badge-picker-icon], [data-badge-picker-icon-none]').length).toBe(1);
    }));
  });

  describe('in a form', () => {
    const control = (fixture: ComponentFixture<FormHost>) => fixture.componentInstance.form.get('statusBadge') as AbstractControl;

    it('registers { type, color, icon } | null and writes it on close with dirty and touched', fakeAsync(() => {
      const fixture = TestBed.createComponent(FormHost);
      fixture.detectChanges();
      expect(control(fixture).value).toBeNull();
      open(fixture);
      tile('tag').click();
      swatch('info').click();
      settle(fixture);
      done().click();
      settle(fixture);
      expect(control(fixture).value).toEqual({ type: 'tag', color: 'info', icon: null });
      expect(control(fixture).dirty).toBeTrue();
      expect(control(fixture).touched).toBeTrue();
    }));

    it('keeps the value on Esc but marks the control touched, which shows the required error', fakeAsync(() => {
      const fixture = TestBed.createComponent(FormHost);
      fixture.detectChanges();
      open(fixture);
      key(document.activeElement!, 'Escape');
      settle(fixture);
      expect(control(fixture).value).toBeNull();
      expect(control(fixture).dirty).toBeFalse();
      expect(control(fixture).touched).toBeTrue();
      expect(fixture.nativeElement.querySelector('mat-error')?.textContent?.trim()).toBe('Vui lòng chọn kiểu hiển thị');
      expect(trigger(fixture).getAttribute('aria-invalid')).toBe('true');
    }));

    it('updates the three models from setValue and follows disable()', fakeAsync(() => {
      const fixture = TestBed.createComponent(FormHost);
      fixture.detectChanges();
      control(fixture).setValue({ type: 'solid', color: 'error', icon: 'bolt' });
      settle(fixture);
      const picker = fixture.debugElement.query(By.directive(SdBadgePicker)).componentInstance as SdBadgePicker;
      expect([picker.type(), picker.color(), picker.icon()]).toEqual(['solid', 'error', 'bolt']);
      control(fixture).disable();
      settle(fixture);
      expect(trigger(fixture).getAttribute('aria-disabled')).toBe('true');
      trigger(fixture).click();
      settle(fixture);
      expect(panel()).toBeNull();
    }));
  });

  it('shows only the label and the badge when viewed', fakeAsync(() => {
    const fixture = createHost({ viewed: true });
    expect(fixture.nativeElement.querySelector('mat-form-field')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-badge-picker__view sd-badge')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Hiển thị trạng thái');
  }));

  it('exports the six type options with i18n keys and the 23-icon preset', () => {
    const i18n = TestBed.inject(I18nService);
    expect(SD_BADGE_TYPE_OPTIONS.map(option => option.value)).toEqual(['icon', 'round', 'tag', 'solid', 'dot', 'pair']);
    for (const option of SD_BADGE_TYPE_OPTIONS) {
      expect(i18n.t(option.labelKey)).not.toBe(option.labelKey);
      expect(i18n.t(option.descriptionKey)).not.toBe(option.descriptionKey);
    }
    expect(SD_BADGE_ICON_PRESET.length).toBe(23);
    expect(SD_BADGE_ICON_PRESET[0]).toBe('check_circle');
    expect(SD_BADGE_ICON_PRESET[22]).toBe('pause_circle');
  });
});
