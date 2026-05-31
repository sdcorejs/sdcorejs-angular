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

    it('should fall back to unsafe:javascript:; when href is empty string', () => {
      host.href = '';
      fixture.detectChanges();
      // Angular DomSanitizer prefixes javascript: URLs with "unsafe:" in the DOM
      expect(anchor.getAttribute('href')).toBe('unsafe:javascript:;');
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
    it('should call window.open with _blank for http:// URLs', () => {
      host.href = 'http://example.com';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(openSpy).toHaveBeenCalledWith('http://example.com', '_blank');
    });

    it('should call window.open with _blank for https:// URLs', () => {
      host.href = 'https://docs.example.com/api';
      fixture.detectChanges();

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(openSpy).toHaveBeenCalledWith('https://docs.example.com/api', '_blank');
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

  describe('click — empty href', () => {
    it('should be a no-op when href is empty (no navigate, no window.open)', () => {
      host.href = '';
      fixture.detectChanges();

      // Dispatch via the directive instance to avoid the browser following
      // the fallback href="unsafe:javascript:;" which causes a Karma page reload
      const directive = fixture.debugElement
        .query(By.directive(SdHrefDirective))
        .injector.get(SdHrefDirective);
      const fakeEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      directive.onClick(fakeEvent);

      expect(openSpy).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
