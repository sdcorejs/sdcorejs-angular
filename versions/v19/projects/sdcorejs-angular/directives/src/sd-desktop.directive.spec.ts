import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdDesktopDirective } from './sd-desktop.directive';

@Component({
  standalone: true,
  imports: [SdDesktopDirective],
  template: `<div *sdDesktop data-testid="desktop-content">desktop only</div>`,
})
class HostComponent {}

describe('SdDesktopDirective', () => {
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

  describe('when isMobile() returns false (desktop)', () => {
    beforeEach(() => {
      spyOn(SdUtilities, 'isMobile').and.returnValue(false);
      fixture = createFixture();
    });

    it('renders the template content', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="desktop-content"]');
      expect(el).not.toBeNull();
      expect(el?.textContent?.trim()).toBe('desktop only');
    });
  });

  describe('when isMobile() returns true (mobile)', () => {
    beforeEach(() => {
      spyOn(SdUtilities, 'isMobile').and.returnValue(true);
      fixture = createFixture();
    });

    it('does NOT render the template content', () => {
      const el = fixture.nativeElement.querySelector('[data-testid="desktop-content"]');
      expect(el).toBeNull();
    });
  });

  describe('constructor evaluation', () => {
    it('calls isMobile() exactly once per construction', () => {
      const spy = spyOn(SdUtilities, 'isMobile').and.returnValue(false);
      fixture = createFixture();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

