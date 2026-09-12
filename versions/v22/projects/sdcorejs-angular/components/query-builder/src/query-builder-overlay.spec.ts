import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdQueryBuilder } from './query-builder.component';
import { SdQbGroup } from './query-builder.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdQueryBuilder, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div data-clip style="position: relative; overflow: hidden; height: 90px; width: 500px; margin: 80px 24px">
      <sd-query-builder [disabled]="disabled" />
    </div>
  `,
})
class ClippedBuilderHost {
  disabled = false;
}

describe('SdQueryBuilder add-menu overlay', () => {
  let fixture: ComponentFixture<ClippedBuilderHost>;
  let builder: SdQueryBuilder;
  let overlays: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ClippedBuilderHost, NoopAnimationsModule] });
    fixture = TestBed.createComponent(ClippedBuilderHost);
    fixture.detectChanges();
    builder = fixture.debugElement.query(By.directive(SdQueryBuilder)).componentInstance;
    overlays = TestBed.inject(OverlayContainer).getContainerElement();
  });

  function open(index = 0): HTMLButtonElement {
    const trigger = fixture.nativeElement.querySelectorAll('.qb-btn-add')[index] as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    tick();
    return trigger;
  }

  it('renders both actions outside the clipped container and keeps the lower action clickable', fakeAsync(() => {
    // why: giữ chỗ cho menu phía dưới, không phụ thuộc vị trí host trong trang runner hoặc scroll từ spec trước.
    const clip = fixture.nativeElement.querySelector('[data-clip]') as HTMLElement;
    Object.assign(clip.style, { position: 'fixed', top: '80px', left: '24px', margin: '0' });
    open();
    const menu = overlays.querySelector('.qb-dropdown');
    expect(menu).not.toBeNull();
    if (!menu) return;
    const actions = menu.querySelectorAll('button');
    expect(actions.length).toBe(2);
    const lower = actions[1].getBoundingClientRect();
    expect(lower.height).toBeGreaterThan(0);
    expect(lower.bottom).toBeGreaterThan(fixture.nativeElement.querySelector('[data-clip]').getBoundingClientRect().bottom);
    expect(actions[1].contains(document.elementFromPoint(lower.x + lower.width / 2, lower.y + lower.height / 2))).toBeTrue();
    actions[1].click();
    fixture.detectChanges();
    tick();
    expect(builder.tree().children[0].kind).toBe('group');
    expect(overlays.querySelector('.qb-dropdown')).toBeNull();
  }));

  it('adds a condition to the selected nested group and allows only one open menu', fakeAsync(() => {
    builder.addGroup(builder.tree());
    fixture.detectChanges();
    open(0);
    builder.toggleDropdown(builder.tree().children[0] as SdQbGroup, new Event('click'));
    fixture.detectChanges();
    tick();
    const menus = overlays.querySelectorAll('.qb-dropdown');
    expect(menus.length).toBe(1);
    if (!menus.length) return;
    (menus[0].querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((builder.tree().children[0] as SdQbGroup).children.length).toBe(2);
    expect(builder.tree().children.length).toBe(1);
  }));

  it('closes on Escape without bubbling to the modal and restores focus to the trigger', fakeAsync(() => {
    const trigger = open();
    const action = overlays.querySelector('.qb-dropdown button') as HTMLButtonElement | null;
    expect(action).not.toBeNull();
    if (!action) return;
    expect(document.activeElement).toBe(action);
    const escaped = jasmine.createSpy('document escape');
    document.addEventListener('keydown', escaped);
    try {
      action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      tick();
      expect(overlays.querySelector('.qb-dropdown')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(escaped).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', escaped);
    }
  }));

  it('closes on backdrop click and removes the overlay when disabled or destroyed', fakeAsync(() => {
    open();
    const backdrop = overlays.querySelector('.cdk-overlay-backdrop') as HTMLElement | null;
    expect(backdrop).not.toBeNull();
    if (!backdrop) return;
    backdrop.click();
    fixture.detectChanges();
    tick(500);
    expect(builder.tree().open).toBeFalse();
    expect(overlays.querySelector('.qb-dropdown')).toBeNull();
    open();
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    tick(500);
    expect(overlays.querySelector('.qb-dropdown')).toBeNull();
    expect(builder.tree().open).toBeFalse();
    fixture.componentInstance.disabled = false;
    fixture.detectChanges();
    expect(overlays.querySelector('.qb-dropdown')).toBeNull();
    open();
    fixture.destroy();
    flush();
    expect(overlays.querySelector('.cdk-overlay-pane')).toBeNull();
  }));

  it('flips above the trigger near the bottom of the viewport', fakeAsync(() => {
    const clip = fixture.nativeElement.querySelector('[data-clip]') as HTMLElement;
    Object.assign(clip.style, { position: 'fixed', bottom: '0', margin: '0' });
    const trigger = open();
    const menu = overlays.querySelector('.qb-dropdown');
    expect(menu).not.toBeNull();
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    expect(rect.bottom).toBeLessThanOrEqual(trigger.getBoundingClientRect().top);
    expect(rect.top).toBeGreaterThanOrEqual(8);
  }));
});
