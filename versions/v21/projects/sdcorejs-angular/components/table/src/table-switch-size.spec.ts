import { Component } from '@angular/core';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTable } from './table.component';
import { SdTableCellDefDirective } from './directives/sd-table-cell-def.directive';
import { SdTableOption } from './models/table-option.model';

@Component({
  imports: [SdTable, SdTableCellDefDirective, SdSwitch],
  template: `
    <sd-switch label="Outside table" />
    <sd-table [option]="option">
      <ng-template sdTableCellDef="active" let-item="item">
        <sd-switch label="Active" [(model)]="item.active" hideInlineError />
        <sd-switch size="lg" label="Also compact" [model]="item.active" hideInlineError />
      </ng-template>
    </sd-table>
  `,
})
class SwitchTableHost {
  row = { id: 1, active: false };
  option: SdTableOption<typeof this.row> = {
    type: 'local',
    items: () => [this.row],
    columns: [{ field: 'active', title: 'Active', type: 'boolean' }],
  };
}

describe('SdTable switch sizing', () => {
  it('compacts a consumer cell switch to sm without affecting an outside switch or its model binding', fakeAsync(() => {
    TestBed.configureTestingModule({ imports: [SwitchTableHost, NoopAnimationsModule] });
    const fixture = TestBed.createComponent(SwitchTableHost);
    fixture.detectChanges();
    tick(800);
    flush();
    fixture.detectChanges();
    const inside = fixture.nativeElement.querySelector('sd-table sd-switch') as HTMLElement;
    const outside = fixture.nativeElement.querySelector('sd-switch') as HTMLElement;
    expect(inside).not.toBeNull();
    expect(inside.querySelector('.mdc-switch__track')!.getBoundingClientRect().width).toBe(36);
    expect(inside.querySelector('.mdc-switch__track')!.getBoundingClientRect().height).toBe(20);
    const explicitLarge = fixture.nativeElement.querySelector('sd-table sd-switch[size="lg"]') as HTMLElement;
    expect(explicitLarge.querySelector('.mdc-switch__track')!.getBoundingClientRect().width).toBe(36);
    expect(outside.querySelector('.mdc-switch__track')!.getBoundingClientRect().width).toBe(52);
    inside.querySelector<HTMLButtonElement>('button[role="switch"]')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.row.active).toBeTrue();
    fixture.destroy();
    flush();
  }));
});
