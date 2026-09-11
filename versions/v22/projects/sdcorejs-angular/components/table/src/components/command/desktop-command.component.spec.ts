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

    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    const content = menu.querySelector('.sd-command-menu-item__content') as HTMLElement;
    const icon = menu.querySelector('mat-icon') as HTMLElement;
    const title = menu.querySelector('.sd-command-menu-item__title') as HTMLElement;

    expect(content).not.toBeNull();
    expect(icon.classList).toContain('material-icons-outlined');
    expect(title.textContent?.trim()).toBe('Edit');
    expect(menu.classList).toContain('sd-table-action-menu');
    expect(menu.querySelector('button')!.getBoundingClientRect().height).toBeLessThanOrEqual(36);
  });

  it('keeps hidden/disabled child rules and restores the command trigger after Escape', async () => {
    const clicked = jasmine.createSpy('clicked');
    fixture.componentInstance.commands = [
      {
        title: 'More',
        children: [
          { title: 'Hidden', hidden: async () => true, click: clicked },
          { title: 'Disabled', disabled: true, click: clicked },
          { title: 'Allowed', click: clicked },
        ],
      },
    ];
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.textContent).not.toContain('Hidden');
    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('button'));
    expect(items[0].getAttribute('aria-disabled')).toBe('true');
    expect(getComputedStyle(items[0]).opacity).toBe('0.45');
    expect(menu.contains(document.activeElement)).toBeTrue();
    items[0].click();
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', keyCode: 32, bubbles: true }));
    expect(clicked).not.toHaveBeenCalled();
    // CDK 22 focuses disabled menu items; earlier CDK versions skip them. Both must reach the enabled action.
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true });
    items[1].dispatchEvent(escape);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('renders outside a clipped row and invokes the child once with its row data', async () => {
    const clicked = jasmine.createSpy('clicked');
    Object.assign(fixture.nativeElement.style, {
      position: 'fixed',
      top: '32px',
      left: '32px',
      width: '80px',
      height: '24px',
      overflow: 'hidden',
    });
    fixture.componentInstance.commands = [{ title: 'More', children: [{ title: 'Run', click: clicked }] }];
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    expect(fixture.nativeElement.contains(menu)).toBeFalse();
    const item = menu.querySelector('button')!;
    const bounds = item.getBoundingClientRect();
    expect(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)?.closest('button')).toBe(item);
    item.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(clicked).toHaveBeenCalledOnceWith(fixture.componentInstance.item.data);
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
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

  it('keeps adjacent command hit areas inside their buttons, including the menu trigger', async () => {
    // Hit testing needs a visible fixture regardless of scroll position or other suite fixtures.
    Object.assign((fixture.nativeElement as HTMLElement).style, {
      position: 'fixed',
      top: '24px',
      left: '24px',
      zIndex: '2147483647',
    });
    const clicked = jasmine.createSpy('command clicked');
    fixture.componentInstance.commands = [
      { icon: 'visibility', title: 'View', click: () => clicked('view') },
      { icon: 'edit', title: 'Edit', click: () => clicked('edit') },
      { title: 'More', children: [{ icon: 'history', title: 'History', click: () => clicked('history') }] },
    ];
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button[mat-icon-button]')) as HTMLButtonElement[];
    expect(buttons.length).toBe(3);
    for (const button of buttons) {
      const bounds = button.getBoundingClientRect();
      const target = button.querySelector('.mat-mdc-button-touch-target')!.getBoundingClientRect();
      expect(bounds.width).toBeGreaterThan(0);
      expect(target.left).withContext(button.ariaLabel!).toBeGreaterThanOrEqual(bounds.left);
      expect(target.right).withContext(button.ariaLabel!).toBeLessThanOrEqual(bounds.right);
      expect(target.top).withContext(button.ariaLabel!).toBeGreaterThanOrEqual(bounds.top);
      expect(target.bottom).withContext(button.ariaLabel!).toBeLessThanOrEqual(bounds.bottom);
      for (const fraction of [0.25, 0.5, 0.75]) {
        const hit = document.elementFromPoint(bounds.left + bounds.width * fraction, bounds.top + bounds.height / 2);
        expect(hit?.closest('button')).withContext(`${button.ariaLabel} at ${fraction}`).toBe(button);
      }
    }
    const middle = buttons[1].getBoundingClientRect();
    (document.elementFromPoint(middle.left + middle.width / 2, middle.top + middle.height / 2) as HTMLElement).click();
    expect(clicked).toHaveBeenCalledOnceWith('edit');
  });
});
