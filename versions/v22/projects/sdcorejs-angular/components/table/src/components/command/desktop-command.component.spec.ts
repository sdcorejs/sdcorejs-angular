import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DesktopCommand } from './desktop-command.component';
import { SdTableCommand } from '../../models/table-command.model';
import { MapToSdTableItem, SdTableItem } from '../../models/table-item.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [DesktopCommand],
  template: ` <desktop-command autoId="orders" [item]="item" [itemIndex]="0" [commands]="commands"> </desktop-command> `,
})
class HostComponent {
  item: SdTableItem<{ id: string; status: string }> = MapToSdTableItem({ id: 'row-1', status: 'DRAFT' });
  commands: SdTableCommand<{ id: string; status: string }>[] = [
    {
      title: 'More',
      children: [
        {
          icon: 'edit',
          title: 'Edit',
          click: () => undefined,
        },
      ],
    },
  ];
}

describe('DesktopCommand', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach(element => element.remove());
  });

  it('renders child command menu items with aligned icon/text content and outlined icons by default', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(trigger).not.toBeNull();

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const menu = document.body.querySelector('.mat-mdc-menu-panel') as HTMLElement;
    const content = menu.querySelector('.sd-command-menu-item__content') as HTMLElement;
    const icon = menu.querySelector('mat-icon') as HTMLElement;
    const title = menu.querySelector('.sd-command-menu-item__title') as HTMLElement;

    expect(content).not.toBeNull();
    expect(icon.classList).toContain('material-icons-outlined');
    expect(title.textContent?.trim()).toBe('Edit');
  });

  // why: hai nút command từng mang aria-hidden="true" — chúng là <button> THẬT, vẫn nhận tab focus
  // nhưng screen reader không đọc được gì (nút chỉ có icon, không có text).
  it('does not hide the menu-trigger button from the accessibility tree', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(trigger.hasAttribute('aria-hidden')).toBe(false);
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('aria-label')).toBe('More');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('names the plain command button from its command title', async () => {
    fixture.componentInstance.commands = [{ type: 'normal', icon: 'edit', title: 'Sửa', click: () => undefined }] as any;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.hasAttribute('aria-hidden')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Sửa');
  });
});
