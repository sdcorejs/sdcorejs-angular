import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenu, MatMenuModule } from '@angular/material/menu';

import { SdQueryPopoverChip } from './popover-chip.component';
import { SdQueryField } from '../../query-bar.model';

@Component({
  standalone: true,
  imports: [SdQueryPopoverChip, MatMenuModule],
  template: `
    <mat-menu #m="matMenu"><button mat-menu-item>x</button></mat-menu>
    <sd-query-popover-chip
      [field]="field"
      [filter]="filter"
      [active]="active"
      [showOperator]="showOperator"
      [valueText]="valueText"
      [menu]="menu()!"
      (sdOpen)="opened = true"
      (sdRemove)="removed = true" />
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
  menu = viewChild<MatMenu>('m');
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
    expect(fixture.nativeElement.querySelector('sd-operator')).not.toBeNull();
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
});
