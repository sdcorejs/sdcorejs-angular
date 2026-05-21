import { Component, DebugElement, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export interface HostFixtureResult<THost> {
  fixture: ComponentFixture<THost>;
  host: THost;
  debugElement: DebugElement;
  nativeElement: HTMLElement;
}

/**
 * Tạo fixture từ một host component được khai báo inline.
 * Dùng khi cần test directive hoặc component qua template wrapper.
 *
 * @example
 * @Component({ template: '<sd-button title="X"></sd-button>', imports: [SdButton], standalone: true })
 * class Host {}
 *
 * const { fixture, nativeElement } = createHostFixture(Host);
 */
export function createHostFixture<THost>(hostType: Type<THost>): HostFixtureResult<THost> {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    debugElement: fixture.debugElement,
    nativeElement: fixture.nativeElement as HTMLElement,
  };
}

/**
 * Query 1 element bằng By.css. Throw với message rõ ràng nếu không tìm thấy.
 */
export function queryByCss<T extends HTMLElement = HTMLElement>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): T {
  const debugEl = fixture.debugElement.query(By.css(selector));
  if (!debugEl) {
    throw new Error(`queryByCss: no element matches "${selector}"`);
  }
  return debugEl.nativeElement as T;
}

/**
 * Query nhiều element bằng By.css.
 */
export function queryAllByCss<T extends HTMLElement = HTMLElement>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): T[] {
  return fixture.debugElement.queryAll(By.css(selector)).map(de => de.nativeElement as T);
}

/**
 * Bắn DOM event lên element và chạy detectChanges.
 */
export function dispatch(
  fixture: ComponentFixture<unknown>,
  element: HTMLElement,
  eventName: string,
  init?: EventInit,
): void {
  element.dispatchEvent(new Event(eventName, { bubbles: true, ...init }));
  fixture.detectChanges();
}

/**
 * Set signal input qua componentRef.setInput + detectChanges.
 * Dùng cho component standalone test (không qua host).
 */
export function setInput<TComponent>(
  fixture: ComponentFixture<TComponent>,
  key: string,
  value: unknown,
): void {
  fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
}

/**
 * Component test wrapper rỗng — dùng làm anchor cho TestBed khi cần Module-only config.
 */
@Component({
  selector: 'sd-test-empty-host',
  standalone: true,
  template: '',
})
export class TestEmptyHost {}
