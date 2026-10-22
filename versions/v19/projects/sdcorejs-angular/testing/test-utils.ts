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
export function queryByCss<T extends HTMLElement = HTMLElement>(fixture: ComponentFixture<unknown>, selector: string): T {
  const debugEl = fixture.debugElement.query(By.css(selector));
  if (!debugEl) {
    throw new Error(`queryByCss: no element matches "${selector}"`);
  }
  return debugEl.nativeElement as T;
}

/**
 * Query nhiều element bằng By.css.
 */
export function queryAllByCss<T extends HTMLElement = HTMLElement>(fixture: ComponentFixture<unknown>, selector: string): T[] {
  return fixture.debugElement.queryAll(By.css(selector)).map(de => de.nativeElement as T);
}

/**
 * Bắn DOM event lên element và chạy detectChanges.
 */
export function dispatch(fixture: ComponentFixture<unknown>, element: HTMLElement, eventName: string, init?: EventInit): void {
  element.dispatchEvent(new Event(eventName, { bubbles: true, ...init }));
  fixture.detectChanges();
}

/**
 * Set signal input qua componentRef.setInput + detectChanges.
 * Dùng cho component standalone test (không qua host).
 */
export function setInput<TComponent>(fixture: ComponentFixture<TComponent>, key: string, value: unknown): void {
  fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
}

/**
 * Rule CSS đầu tiên có selector (đã bỏ thuộc tính `[_ngcontent…]` / `[_nghost…]` của emulated encapsulation) khớp
 * `selector`, chỉ tìm trong `@media` khớp `media` khi có. Dùng cho trạng thái trình duyệt test không giả lập được
 * (vd `forced-colors: active`): kiểm rule có mặt và giá trị của nó.
 */
export function findCssRule(selector: RegExp, media?: RegExp): CSSStyleDeclaration | undefined {
  const strip = (text: string) => text.replace(/\[_ng(content|host)-[^\]]*\]/g, '');
  const walk = (rules: CSSRuleList, inMedia: boolean): CSSStyleDeclaration | undefined => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        if (media?.test(rule.conditionText)) {
          const found = walk(rule.cssRules, true);
          if (found) return found;
        }
      } else if (rule instanceof CSSStyleRule && inMedia === !!media && selector.test(strip(rule.selectorText))) {
        return rule.style;
      }
    }
    return undefined;
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const found = walk(rules, false);
    if (found) return found;
  }
  return undefined;
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
