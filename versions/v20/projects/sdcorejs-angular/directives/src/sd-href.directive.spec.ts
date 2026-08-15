import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { SdHrefDirective } from './sd-href.directive';

@Component({
  standalone: true,
  imports: [SdHrefDirective],
  template: `<a [sdHref]="href" data-testid="link">Link</a>`,
})
class HostComponent {
  href = '/internal';
}

describe('SdHrefDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let anchor: HTMLAnchorElement;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let openSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    // Prevent actual navigation (page reload) during tests
    navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    // Prevent window.open from opening actual windows in the test runner
    openSpy = spyOn(window, 'open').and.returnValue(null);

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    anchor = fixture.nativeElement.querySelector('[data-testid="link"]') as HTMLAnchorElement;
  });

  describe('creation', () => {
    it('should create the host component', () => {
      expect(host).toBeTruthy();
    });

    it('should find the anchor element', () => {
      expect(anchor).not.toBeNull();
    });
  });

  describe('href binding', () => {
    it('should bind the url to href attribute for internal links', () => {
      host.href = '/orders/list';
      fixture.detectChanges();
      expect(anchor.getAttribute('href')).toBe('/orders/list');
    });

    it('should bind the url to href attribute for external links', () => {
      host.href = 'https://example.com';
      fixture.detectChanges();
      expect(anchor.getAttribute('href')).toBe('https://example.com');
    });

    it('should fall back to "#" when href is empty string so the anchor stays keyboard-operable', () => {
      host.href = '';
      fixture.detectChanges();

      // why: fallback cũ `'javascript:;'` bị DomSanitizer chặn thành `unsafe:javascript:;` (cảnh báo
      // mỗi lần render); còn bỏ hẳn attribute thì `<a>` mất focus bằng Tab và mất Enter. `'#'` an
      // toàn với sanitizer VÀ giữ nguyên ngữ nghĩa link.
      expect(anchor.getAttribute('href')).toBe('#');
      expect(anchor.getAttribute('href')).not.toContain('unsafe:');
    });

    it('should keep the empty-href anchor focusable via Tab (implicit link semantics)', () => {
      host.href = '';
      fixture.detectChanges();

      anchor.focus();
      expect(document.activeElement).toBe(anchor);
    });
  });

  describe('click — internal URL', () => {
    it('should call Router.navigate with path for internal URL', () => {
      host.href = '/orders/list';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(navigateSpy).toHaveBeenCalledWith(['/orders/list'], { queryParams: {} });
    });

    it('should parse query params from internal URL and pass to Router.navigate', () => {
      host.href = '/orders/detail?id=42&tab=history';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(navigateSpy).toHaveBeenCalledWith(['/orders/detail'], {
        queryParams: { id: '42', tab: 'history' },
      });
    });

    it('should call preventDefault for internal URL clicks', () => {
      host.href = '/some/route';
      fixture.detectChanges();

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();
      anchor.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should NOT call window.open for internal URLs', () => {
      host.href = '/some/route';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('click — external URL', () => {
    // why: `window.open(url, '_blank')` không có `noopener` để lại `window.opener` cho trang đích →
    // reverse tabnabbing (trang mở ra tự đổi được URL của tab gốc). `sdOpenExternal` luôn truyền
    // `'noopener,noreferrer'` làm tham số thứ ba.
    it('should call window.open with _blank and noopener for http:// URLs', () => {
      host.href = 'http://example.com';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(openSpy).toHaveBeenCalledWith('http://example.com', '_blank', 'noopener,noreferrer');
    });

    it('should call window.open with _blank and noopener for https:// URLs', () => {
      host.href = 'https://docs.example.com/api';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(openSpy).toHaveBeenCalledWith('https://docs.example.com/api', '_blank', 'noopener,noreferrer');
    });

    it('should pass noopener,noreferrer as the third window.open argument', () => {
      host.href = 'https://docs.example.com/api';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      const features = openSpy.calls.mostRecent().args[2] as string;
      expect(features).toContain('noopener');
      expect(features).toContain('noreferrer');
    });

    it('should call preventDefault for external URL clicks', () => {
      host.href = 'https://external.com';
      fixture.detectChanges();

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();
      anchor.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should NOT call Router.navigate for external URLs', () => {
      host.href = 'https://external.com';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('click — refused scheme', () => {
    it('should NOT open a new tab for a non-http(s) scheme', () => {
      // why: `url.startsWith('http')` cũ nhận cả `'httpfoo'`, và biến thể `includes('http')` nhận
      // cả payload `javascript:...//http` — cả hai đều dẫn tới `window.open` một URL thực thi
      // script trong origin của app. `sdIsExternalHttpUrl` parse URL nên chỉ http:/https: lọt qua.
      const directive = fixture.debugElement.query(By.directive(SdHrefDirective)).injector.get(SdHrefDirective);
      const refused = ['javascript:fetch("//evil.example.com")//http', 'httpfoo', 'data:text/html,<script>alert(1)</script>'];

      for (const value of refused) {
        host.href = value;
        fixture.detectChanges();
        // Gọi thẳng onClick để trình duyệt không đi theo href đã bị sanitizer đổi thành `unsafe:…`.
        directive.onClick(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('click — empty href', () => {
    it('should be a no-op when href is empty (no navigate, no window.open)', () => {
      host.href = '';
      fixture.detectChanges();

      const directive = fixture.debugElement.query(By.directive(SdHrefDirective)).injector.get(SdHrefDirective);
      const fakeEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      directive.onClick(fakeEvent);

      expect(openSpy).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should preventDefault so the "#" fallback never appends a history entry', () => {
      host.href = '';
      fixture.detectChanges();

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();
      anchor.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
