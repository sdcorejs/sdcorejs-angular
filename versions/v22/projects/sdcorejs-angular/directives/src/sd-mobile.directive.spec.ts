import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { SdMobileDirective } from './sd-mobile.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdMobileDirective],
  template: `<div *sdMobile data-testid="mobile-content">mobile only</div>`,
})
class HostComponent {}

describe('SdMobileDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  function createFixture(): ComponentFixture<HostComponent> {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    return f;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('when isMobile() returns true', () => {
    beforeEach(() => {
      spyOn(BrowserUtilities, 'isMobile').and.returnValue(true);
      fixture = createFixture();
    });

    it('renders the template content', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="mobile-content"]');
      expect(el).not.toBeNull();
      expect(el?.textContent?.trim()).toBe('mobile only');
    });
  });

  describe('when isMobile() returns false', () => {
    beforeEach(() => {
      spyOn(BrowserUtilities, 'isMobile').and.returnValue(false);
      fixture = createFixture();
    });

    it('does NOT render the template content', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="mobile-content"]');
      expect(el).toBeNull();
    });
  });
});
