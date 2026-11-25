import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '../index';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdButton, SdButtonItem, SdButtonItemDivider],
  template: `<sd-button tooltip="Actions">
    Actions
    <sd-button-item prefixIcon="check">Approve</sd-button-item>
    <sd-button-item-divider title="More" />
    <sd-button-item disabled>Disabled</sd-button-item>
  </sd-button>`,
})
class Host {}

describe('SdButton Action Popover frame (QB-P-01)', () => {
  let fixture: ComponentFixture<Host>;
  const panel = () => document.querySelector<HTMLElement>('.sd-action-popover')!;
  const style = (element: Element) => getComputedStyle(element);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('sd-button button') as HTMLButtonElement).click();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('DP-01 / QB-P-01 uses the shared theme frame and preserves the list size limits', () => {
    const surface = panel();
    surface.style.setProperty('--sd-border', 'rgb(128, 128, 128)');
    surface.style.setProperty('--sd-surface', 'white');
    surface.style.setProperty('--sd-select-panel-bg', 'rgb(250, 250, 250)');
    surface.style.setProperty('--sd-shadow-md', '0px 2px 8px rgb(0 0 0 / 20%)');
    const css = style(surface);
    expect(css.boxSizing).toBe('border-box');
    expect(css.paddingTop).toBe('4px');
    expect(css.paddingRight).toBe('4px');
    expect(css.borderTopWidth).toBe('1px');
    expect(css.borderTopStyle).toBe('solid');
    expect(css.borderTopLeftRadius).toBe('10px');
    expect(css.backgroundColor).toBe('rgb(250, 250, 250)');
    expect(css.borderTopColor).toBe('color(srgb 0.701176 0.701176 0.701176)');
    expect(css.overflowY).toBe('auto');
    expect(css.minWidth).toBe('160px');
    expect(css.maxWidth).toBe('320px');
    expect(css.maxHeight).toBe('360px');
    expect(css.boxShadow).toBe('rgba(0, 0, 0, 0.2) 0px 2px 8px 0px');
  });

  it('DP-02 / QB-P-01 keeps the item row: 40px, 8px 12px padding, 6px radius, 14/20 text, 8px gap, 18px icon slot', () => {
    const item = panel().querySelector('.sd-action-item')!;
    const css = style(item);
    expect(css.display).toBe('flex');
    expect(css.minHeight).toBe('40px');
    expect(css.paddingTop).toBe('8px');
    expect(css.paddingLeft).toBe('12px');
    expect(css.borderTopLeftRadius).toBe('6px');
    expect(css.fontSize).toBe('14px');
    expect(css.lineHeight).toBe('20px');
    expect(css.columnGap).toBe('8px');
    expect(css.textAlign).toBe('start');
    const icon = style(item.querySelector('sd-icon')!);
    // why: đo trên action-popover.scss gốc (trước khi tách mixin): sd-icon tự đặt cỡ hộp 20px, rule của popover chỉ
    // giữ khe flex 18px — giữ nguyên cả hai.
    expect(icon.flexBasis).toBe('18px');
    expect(icon.flexShrink).toBe('0');
    expect(icon.width).toBe('20px');
    expect(style(panel().querySelector('.sd-action-item:disabled')!).opacity).toBe('0.45');
  });

  it('QB-P-01 keeps the heading and divider', () => {
    const heading = style(panel().querySelector('.sd-action-heading')!);
    expect(heading.paddingTop).toBe('4px');
    expect(heading.paddingLeft).toBe('12px');
    expect(heading.fontSize).toBe('12px');
    panel().style.setProperty('--sd-select-panel-divider', 'silver');
    const divider = style(panel().querySelector('.sd-action-divider')!);
    expect(divider.borderTopWidth).toBe('1px');
    expect(divider.borderTopStyle).toBe('solid');
    expect(divider.marginTop).toBe('4px');
    expect(divider.marginLeft).toBe('8px');
  });
});
