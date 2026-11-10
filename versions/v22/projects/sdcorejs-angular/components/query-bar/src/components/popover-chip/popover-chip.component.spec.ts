import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdQueryPopoverChip } from './popover-chip.component';
import { SdQueryField } from '../../query-bar.model';
import { ɵSdQueryPanelDirective } from '../panel/query-panel';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdQueryPopoverChip, ɵSdQueryPanelDirective],
  template: `
    <ng-template sdQueryPanel="dialog" #m="sdQueryPanel">
      <div class="sd-query-panel sd-query-panel--form probe" role="dialog" aria-label="Edit"><input aria-label="Value" /></div>
    </ng-template>
    <sd-query-popover-chip
      [field]="field"
      [filter]="filter"
      [active]="active"
      [showOperator]="showOperator"
      [valueText]="valueText"
      [panel]="menu()!"
      (open)="opened = true"
      (remove)="removed = true" />
  `,
})
class Host {
  field: SdQueryField = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
  filter: any = { field: 'name', operator: 'CONTAIN', data: 'abc' };
  active = true;
  showOperator = false;
  valueText = 'abc';
  opened = false;
  removed = false;
  menu = viewChild<ɵSdQueryPanelDirective>('m');
}

describe('SdQueryPopoverChip', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders icon + label + value when active', () => {
    const chip = fixture.nativeElement.querySelector('.c-chip')!;
    expect(chip.querySelector('.c-chip-label')?.textContent).toContain('Name');
    expect(chip.querySelector('.c-chip-value')?.textContent).toContain('abc');
    expect(chip.classList.contains('c-chip-active')).toBe(true);
  });

  it('renders the : separator when active and operator is hidden', () => {
    expect(fixture.nativeElement.querySelector('.c-chip-sep')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('sd-operator')).toBeNull();
  });

  it('renders sd-operator when showOperator=true', () => {
    host.showOperator = true;
    fixture.detectChanges();
    const op = fixture.nativeElement.querySelector('sd-operator') as HTMLElement;
    expect(op).not.toBeNull();
    // Handoff sd-operator A2: a read-only xs glyph (14px) named after the operator, no button inside the chip.
    const glyph = op.querySelector('[role="img"]')!;
    expect(glyph.getAttribute('aria-label')).toBeTruthy();
    expect(glyph.querySelector('svg')!.getAttribute('width')).toBe('14');
    expect(op.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-chip-sep')).toBeNull();
  });

  it('inactive chip hides value + remove + sep', () => {
    host.active = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-chip-value')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-chip-remove')).toBeNull();
    expect(fixture.nativeElement.querySelector('.c-chip-sep')).toBeNull();
  });

  it('remove × emits (remove) and stops propagation', () => {
    const removeEl = fixture.nativeElement.querySelector('.c-chip-remove') as HTMLElement;
    const ev = new MouseEvent('click', { bubbles: true });
    spyOn(ev, 'stopPropagation');
    removeEl.dispatchEvent(ev);
    expect(host.removed).toBe(true);
    expect(ev.stopPropagation).toHaveBeenCalled();
  });
  afterEach(() => fixture.destroy());

  it('opens its dialog panel from Enter and tells the host (open) first', () => {
    const chip = fixture.nativeElement.querySelector('.c-chip') as HTMLElement;
    expect(chip.getAttribute('aria-haspopup')).toBe('dialog');
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.opened).toBeTrue();
    expect(document.querySelector('.probe')).not.toBeNull();
    expect(chip.getAttribute('aria-expanded')).toBe('true');
  });
});
