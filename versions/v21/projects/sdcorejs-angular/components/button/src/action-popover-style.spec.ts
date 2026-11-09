import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '../index';

// QB-P-01: the Action Popover frame moved into the shared `_popover-panel.scss` mixins (query bar handoff, section 2.1).
// The values below are the ones `action-popover.scss` declared before the move; not a single pixel may change.
@Component({
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

  it('QB-P-01 keeps the panel frame: size limits, padding, border, radius, shadow', () => {
    const css = style(panel());
    expect(css.boxSizing).toBe('border-box');
    expect(css.paddingTop).toBe('4px');
    expect(css.paddingRight).toBe('4px');
    expect(css.borderTopWidth).toBe('1px');
    expect(css.borderTopStyle).toBe('solid');
    expect(css.borderTopLeftRadius).toBe('8px');
    expect(css.overflowY).toBe('auto');
    expect(css.minWidth).toBe('160px');
    expect(css.maxWidth).toBe('320px');
    expect(css.maxHeight).toBe('360px');
    expect(css.boxShadow).toBe('rgba(15, 23, 42, 0.14) 0px 4px 12px 0px, rgba(15, 23, 42, 0.1) 0px 1px 3px 0px');
  });

  it('QB-P-01 keeps the item row: 40px, 8px 12px padding, 4px radius, 14/20 text, 8px gap, 18px icon slot', () => {
    const item = panel().querySelector('.sd-action-item')!;
    const css = style(item);
    expect(css.display).toBe('flex');
    expect(css.minHeight).toBe('40px');
    expect(css.paddingTop).toBe('8px');
    expect(css.paddingLeft).toBe('12px');
    expect(css.borderTopLeftRadius).toBe('4px');
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
    const divider = style(panel().querySelector('.sd-action-divider')!);
    expect(divider.borderTopWidth).toBe('1px');
    expect(divider.borderTopStyle).toBe('solid');
    expect(divider.marginTop).toBe('4px');
    expect(divider.marginLeft).toBe('8px');
  });
});
