import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ViewComponent } from './view.component';
import { SdTableColumn } from '../../../models/table-column.model';
import { MapToSdTableItem, SdTableItem } from '../../../models/table-item.model';

// why: ô HTML clickable của bảng từng là `<div (click)> + aria-hidden="true"` — vừa xoá nội dung ô
// khỏi accessibility tree vừa để lại một vùng bấm chuột "câm" mà bàn phím không tới được.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [ViewComponent],
  template: `<view autoId="cell-1" [column]="column" [item]="item"></view>`,
})
class HostComponent {
  clickSpy = jasmine.createSpy('cellClick');

  column = { field: 'name', title: 'Name' } as SdTableColumn;

  item: SdTableItem<{ name: string }> = (() => {
    const created = MapToSdTableItem({ name: 'Alpha' });
    created.meta.display['name'] = {
      data: '<b>Alpha</b>',
      isHtml: true,
      click: () => this.clickSpy(),
    };
    return created;
  })();
}

describe('ViewComponent — clickable HTML cell accessibility', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const getCell = () => fixture.nativeElement.querySelector('.text-break.cursor-pointer') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not hide the clickable cell from the accessibility tree', () => {
    const cell = getCell();

    expect(cell).not.toBeNull();
    expect(cell.hasAttribute('aria-hidden')).toBe(false);
  });

  it('exposes the clickable cell as a focusable button', () => {
    const cell = getCell();

    expect(cell.getAttribute('role')).toBe('button');
    expect(cell.getAttribute('tabindex')).toBe('0');
  });

  it('Enter runs the cell click handler, same as a mouse click', () => {
    const cell = getCell();

    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(host.clickSpy).toHaveBeenCalledTimes(1);
  });

  it('Space runs the cell click handler and blocks the page scroll', () => {
    const cell = getCell();

    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    cell.dispatchEvent(ev);

    expect(host.clickSpy).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });

  // why: `view.data` là HTML do consumer cung cấp và có thể chứa control riêng — phím bấm phát ra
  // từ đó KHÔNG được kích hoạt handler của ô (nếu không sẽ chạy hai lần).
  it('ignores keyboard events bubbling from consumer markup inside the cell', () => {
    const cell = getCell();
    const inner = document.createElement('button');
    cell.appendChild(inner);

    inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(host.clickSpy).not.toHaveBeenCalled();
  });
});
