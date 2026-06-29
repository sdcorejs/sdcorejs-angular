import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SelectorActionComponent } from './selector-action.component';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableOption } from '../../models/table-option.model';

@Component({
  standalone: true,
  imports: [SelectorActionComponent],
  template: `<selector-action [autoId]="autoId()" [tableOption]="opt()" [selectedTableItems]="selected()"></selector-action>`,
})
class HostComponent {
  autoId = signal<string | undefined | null>('components-table-employees');
  opt = signal<SdTableOption>({ type: 'local', items: () => [], columns: [] } as any);
  // 1 selected row → quick-action opened → action bar (incl. clear button) renders.
  selected = signal<SdTableItem[]>([{ data: { id: 1 }, meta: { id: 'r1', display: {} } as any }]);
}

describe('SelectorActionComponent autoId propagation', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the clear-selection button autoId derived from the table base', () => {
    const btn = fixture.nativeElement.querySelector('[data-autoid="components-button-components-table-employees-clear-selection"]');
    expect(btn).toBeTruthy();
  });

  it('omits the autoId attribute when no base is provided', () => {
    fixture.componentInstance.autoId.set(undefined);
    fixture.detectChanges();
    const anyClear = fixture.nativeElement.querySelector('[data-autoid$="-clear-selection"]');
    expect(anyClear).toBeNull();
  });
});
