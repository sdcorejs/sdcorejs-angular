import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Operator } from '@sdcorejs/utils/models';
import { ɵSdOperatorChip } from './operator-chip.component';

// Chip operator trong ô của control (thiết kế đợt 2 · G).
@Component({
  imports: [ɵSdOperatorChip],
  template: `
    <div
      class="mat-mdc-text-field-wrapper"
      [style.width.px]="width()"
      style="display: flex; align-items: center; height: 40px; box-sizing: border-box">
      <sd-operator-chip
        [operators]="operators()"
        [(operator)]="operator"
        [size]="size()"
        [hasValue]="hasValue()"
        [disabled]="disabled()"
        autoId="price-op"
        (chosen)="chosenValue = $event" />
      <input class="next" aria-label="Giá" />
    </div>
  `,
})
class ChipHost {
  readonly operators = signal<Operator[]>(['EQUAL', 'GREATER_THAN', 'LESS_THAN']);
  readonly operator = signal<Operator | undefined>('EQUAL');
  readonly size = signal<'sm' | 'md'>('md');
  readonly hasValue = signal(false);
  readonly disabled = signal(false);
  readonly width = signal(280);
  chosenValue: Operator | undefined;
}

describe('ɵSdOperatorChip', () => {
  let fixture: ComponentFixture<ChipHost>;
  let host: ChipHost;
  let overlay: HTMLElement;

  const chip = (): HTMLElement => fixture.nativeElement.querySelector('sd-operator-chip');
  const button = (): HTMLButtonElement => chip().querySelector('button.sd-operator-chip__trigger')!;
  const rows = (): HTMLButtonElement[] => Array.from(overlay.querySelectorAll<HTMLButtonElement>('.c-op-menu .c-op-row'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  // why: Material menu đọc keyCode (ESCAPE = 27), không đọc key.
  const KEY_CODES: Record<string, number> = { Escape: 27, ArrowDown: 40 };
  const press = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] ?? 0 });
    target.dispatchEvent(event);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChipHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ChipHost);
    host = fixture.componentInstance;
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const style = (fixture.nativeElement as HTMLElement).style;
    style.setProperty('--sd-primary', 'rgb(0, 0, 200)');
    style.setProperty('--sd-primary-contrast', 'rgb(255, 255, 255)');
    style.setProperty('--sd-primary-light', 'rgb(220, 230, 250)');
    style.setProperty('--sd-primary-dark', 'rgb(0, 40, 120)');
    style.setProperty('--sd-text-secondary', 'rgb(70, 70, 70)');
    await settle();
  });

  afterEach(() => overlay.querySelectorAll('.cdk-overlay-pane').forEach(pane => pane.remove()));

  it('is a real button named after the current operator, with its autoId', () => {
    const t = TestBed.inject(I18nService);
    expect(button().type).toBe('button');
    expect(button().getAttribute('aria-label')).toBe(
      t.t('core.component.operator.current', { operator: t.t('core.operator.equal.display') })
    );
    expect(button().getAttribute('data-autoid')).toBe('price-op');
    expect(button().getAttribute('aria-haspopup')).toBe('menu');
    host.operator.set(undefined);
    fixture.detectChanges();
    expect(button().getAttribute('aria-label')).toBe(t.t('core.component.operator.choose'));
  });

  it('is 28px high at md and 24px high at sm, with the control corner minus 3px', () => {
    expect(button().getBoundingClientRect().height).toBe(28);
    expect(getComputedStyle(button()).paddingLeft).toBe('8px');
    expect(getComputedStyle(button()).borderTopLeftRadius).toBe('5px');
    expect(getComputedStyle(chip()).marginLeft).toBe('6px');
    host.size.set('sm');
    fixture.detectChanges();
    expect(button().getBoundingClientRect().height).toBe(24);
    expect(getComputedStyle(button()).paddingLeft).toBe('6px');
    expect(getComputedStyle(chip()).marginLeft).toBe('4px');
  });

  it('uses the muted tone without a value, the primary tint with one and solid primary while open', async () => {
    expect(getComputedStyle(button()).color).toBe('rgb(70, 70, 70)');
    host.hasValue.set(true);
    fixture.detectChanges();
    expect(getComputedStyle(button()).backgroundColor).toBe('rgb(220, 230, 250)');
    expect(getComputedStyle(button()).color).toBe('rgb(0, 40, 120)');
    button().click();
    await settle();
    expect(getComputedStyle(button()).backgroundColor).toBe('rgb(0, 0, 200)');
    expect(getComputedStyle(button()).color).toBe('rgb(255, 255, 255)');
  });

  // Review 2026-10-22: the highlight marks the current operator; no tick.
  it('lists the operators with their label and code, and highlights the current one without a tick', async () => {
    button().click();
    await settle();
    expect(rows().map(row => row.querySelector('.c-op-code')!.textContent?.trim())).toEqual(['EQUAL', 'GREATER_THAN', 'LESS_THAN']);
    expect(rows()[0].classList).toContain('c-op-active');
    expect(rows()[1].classList).not.toContain('c-op-active');
    expect(overlay.querySelector('.c-op-check')).toBeNull();
  });

  // Like the sd-select panel: 6px from the field box on the side it opens, lined up with the field start.
  it('opens its menu 6px away from the field and lines it up with the field start', async () => {
    button().click();
    await settle();
    const field = (fixture.nativeElement as HTMLElement).querySelector('.mat-mdc-text-field-wrapper')!.getBoundingClientRect();
    const panel = overlay.querySelector<HTMLElement>('.mat-mdc-menu-panel.c-op-menu')!;
    const box = panel.getBoundingClientRect();
    const gap = panel.classList.contains('mat-menu-above') ? field.top - box.bottom : box.top - field.bottom;
    expect(gap).toBeCloseTo(6, 0);
    if (panel.classList.contains('mat-menu-after')) expect(box.left).toBeCloseTo(field.left, 0);
  });

  it('opens with Alt+ArrowDown', async () => {
    press(button(), 'ArrowDown', { altKey: true });
    await settle();
    expect(rows().length).toBe(3);
  });

  it('sets the operator and emits chosen when a row is picked', async () => {
    button().click();
    await settle();
    rows()[1].click();
    await settle();
    expect(host.operator()).toBe('GREATER_THAN');
    expect(host.chosenValue).toBe('GREATER_THAN');
    expect(rows().length).withContext('menu closed').toBe(0);
  });

  it('gives focus back to the chip when Escape closes the menu', async () => {
    button().click();
    await settle();
    press(rows()[0], 'Escape');
    await settle();
    expect(document.activeElement).toBe(button());
    expect(host.chosenValue).toBeUndefined();
  });

  it('does not let a click reach the field around it', () => {
    const spy = jasmine.createSpy('field click');
    chip().parentElement!.addEventListener('click', spy);
    button().click();
    expect(spy).not.toHaveBeenCalled();
  });

  // Review 2026-10-22: every chip shows its arrow, also in a narrow table filter cell.
  it('keeps its arrow in a field narrower than 120px', async () => {
    host.width.set(100);
    fixture.detectChanges();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    fixture.detectChanges();
    expect(getComputedStyle(chip().querySelector('.sd-operator-chip__arrow')!).display).not.toBe('none');
  });

  it('cannot open while disabled', async () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(button().disabled).toBeTrue();
  });
});
