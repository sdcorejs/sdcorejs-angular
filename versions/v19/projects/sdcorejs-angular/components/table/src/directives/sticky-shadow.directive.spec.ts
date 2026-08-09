import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StickyShadowDirective } from './sticky-shadow.directive';

/**
 * `#updateShadow` bắt đầu bằng `container.querySelector('tr.c-first-header')`, nên đếm
 * số lần gọi selector đó = đếm số lần directive quét lại bảng.
 */
const HEADER_SELECTOR = 'tr.c-first-header';

@Component({
  standalone: true,
  imports: [StickyShadowDirective],
  template: `
    <div #container class="c-table" stickyShadow>
      <table>
        <thead>
          <tr class="c-first-header">
            <th class="cdk-column-name mat-mdc-table-sticky-border-elem-left">Name</th>
          </tr>
        </thead>
        <tbody #body></tbody>
      </table>
    </div>
  `,
})
class HostComponent {
  container = viewChild.required<ElementRef<HTMLElement>>('container');
  body = viewChild.required<ElementRef<HTMLElement>>('body');
}

describe('StickyShadowDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    // afterNextRender chạy sau lần render đầu.
    await fixture.whenStable();
  });

  function appendRow(index: number) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.className = 'cdk-column-name';
    td.textContent = `row ${index}`;
    tr.appendChild(td);
    host.body().nativeElement.appendChild(tr);
  }

  const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  /**
   * Render N dòng, MỖI dòng ở một task riêng → MutationObserver bắn một callback cho
   * MỖI dòng (giống cách CDK render row + apply sticky style theo nhiều batch).
   * KHÔNG dùng vòng lặp đồng bộ hay microtask: cả hai đều bị chính MutationObserver
   * (và zone.js) gộp lại thành một callback duy nhất nên không phản ánh được lỗi.
   */
  async function appendRowsInSeparateBatches(count: number) {
    for (let i = 0; i < count; i++) {
      appendRow(i);
      await wait(0);
    }
  }

  const headerLookups = (spy: jasmine.Spy) => spy.calls.allArgs().filter(([selector]) => selector === HEADER_SELECTOR).length;

  function spyOnScans() {
    return spyOn(host.container().nativeElement, 'querySelector').and.callThrough();
  }

  it('gộp cụm mutation liên tiếp — số lần quét lại bảng KHÔNG tỉ lệ với số batch', async () => {
    const spy = spyOnScans();

    // why: bản cũ gọi #updateShadow NGAY trong callback của MutationObserver, mà
    // #updateShadow chạy querySelectorAll toàn bảng cho MỖI cột sticky → 12 batch là 12
    // lần quét lại cả bảng. Debounce gộp cụm về 1 (nới lỏng ngưỡng để không phụ thuộc
    // độ trễ timer của máy chạy CI).
    await appendRowsInSeparateBatches(12);
    await wait(80);

    expect(headerLookups(spy)).toBeLessThan(4);
  });

  it('vẫn cập nhật shadow sau khi rows được render (không nuốt update)', async () => {
    const spy = spyOnScans();

    await appendRowsInSeparateBatches(3);
    await wait(80);

    expect(headerLookups(spy)).toBeGreaterThan(0);
  });

  it('cụm mutation cách xa nhau vẫn được cập nhật lại', async () => {
    const spy = spyOnScans();

    await appendRowsInSeparateBatches(3);
    await wait(80);
    await appendRowsInSeparateBatches(3);
    await wait(80);

    expect(headerLookups(spy)).toBeGreaterThanOrEqual(2);
  });

  it('không cập nhật nữa sau khi directive bị destroy', async () => {
    const spy = spyOnScans();

    appendRow(0);
    fixture.destroy();
    await wait(80);

    expect(headerLookups(spy)).toBe(0);
  });
});
