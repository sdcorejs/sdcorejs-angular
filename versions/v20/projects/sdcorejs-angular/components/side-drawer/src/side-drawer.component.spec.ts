import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSideDrawer } from './side-drawer.component';
import { setInput } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host component — standard usage
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdSideDrawer],
  template: `
    <sd-side-drawer
      [title]="title"
      [width]="width"
      [hideClose]="hideClose"
      [disableBackdropClose]="disableBackdropClose"
      [drawerClass]="drawerClass"
      [autoId]="autoId"
      (sdClosed)="onClosed()"
    >
      <span id="body-content">drawer body</span>
      <div sdFooter id="footer-content">footer</div>
    </sd-side-drawer>
  `,
})
class HostComponent {
  title = 'Test Drawer';
  width = '480px';
  hideClose = false;
  disableBackdropClose = false;
  drawerClass: any = '';
  autoId: string | undefined = undefined;
  closedCount = 0;
  onClosed(): void { this.closedCount++; }
}

// ---------------------------------------------------------------------------
// Helper: get SdSideDrawer instance from fixture
// ---------------------------------------------------------------------------

function getDrawer(fixture: ComponentFixture<HostComponent>): SdSideDrawer {
  return fixture.debugElement.query(By.directive(SdSideDrawer)).componentInstance as SdSideDrawer;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SdSideDrawer', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdSideDrawer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getDrawer(fixture);
  });

  afterEach(() => {
    // Restore body overflow in case a test left it in "hidden" state
    document.body.style.overflow = '';
  });

  // -------------------------------------------------------------------------
  // 1. Creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('starts with isOpened = false', () => {
      expect(component.isOpened()).toBeFalse();
    });

    it('starts with isLoading = false', () => {
      expect(component.isLoading()).toBeFalse();
    });

    it('generates a unique id starting with "I"', () => {
      expect(component.id).toMatch(/^I[0-9a-f-]+$/i);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Input: title
  // -------------------------------------------------------------------------

  describe('input: title', () => {
    it('reads title input from host', () => {
      expect(component.title()).toBe('Test Drawer');
    });

    it('defaults title to empty string', () => {
      const bare = TestBed.createComponent(SdSideDrawer);
      bare.detectChanges();
      expect(bare.componentInstance.title()).toBe('');
    });

    it('reflects updated title input', () => {
      host.title = 'Updated Title';
      fixture.detectChanges();
      expect(component.title()).toBe('Updated Title');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Input: width
  // -------------------------------------------------------------------------

  describe('input: width', () => {
    it('reads width input (default 480px)', () => {
      expect(component.width()).toBe('480px');
    });

    it('reflects custom CSS width string', () => {
      host.width = '640px';
      fixture.detectChanges();
      expect(component.width()).toBe('640px');
    });

    it('accepts viewport-relative width "40vw"', () => {
      host.width = '40vw';
      fixture.detectChanges();
      expect(component.width()).toBe('40vw');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Input: hideClose
  // -------------------------------------------------------------------------

  describe('input: hideClose', () => {
    it('defaults hideClose to false', () => {
      expect(component.hideClose()).toBeFalse();
    });

    it('reflects hideClose = true', () => {
      host.hideClose = true;
      fixture.detectChanges();
      expect(component.hideClose()).toBeTrue();
    });

    it('coerces empty string (bare attribute) to true via booleanAttribute', () => {
      const bare = TestBed.createComponent(SdSideDrawer);
      bare.componentRef.setInput('hideClose', '');
      bare.detectChanges();
      expect(bare.componentInstance.hideClose()).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Input: disableBackdropClose
  // -------------------------------------------------------------------------

  describe('input: disableBackdropClose', () => {
    it('defaults disableBackdropClose to false', () => {
      expect(component.disableBackdropClose()).toBeFalse();
    });

    it('reflects disableBackdropClose = true', () => {
      host.disableBackdropClose = true;
      fixture.detectChanges();
      expect(component.disableBackdropClose()).toBeTrue();
    });

    it('coerces empty string (bare attribute) to true via booleanAttribute', () => {
      const bare = TestBed.createComponent(SdSideDrawer);
      bare.componentRef.setInput('disableBackdropClose', '');
      bare.detectChanges();
      expect(bare.componentInstance.disableBackdropClose()).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Input: drawerClass
  // -------------------------------------------------------------------------

  describe('input: drawerClass', () => {
    it('defaults drawerClass to empty string', () => {
      expect(component.drawerClass()).toBe('');
    });

    it('reflects a custom class string', () => {
      host.drawerClass = 'my-custom-class';
      fixture.detectChanges();
      expect(component.drawerClass()).toBe('my-custom-class');
    });

    it('accepts an array of classes', () => {
      host.drawerClass = ['class-a', 'class-b'];
      fixture.detectChanges();
      expect(component.drawerClass()).toEqual(['class-a', 'class-b']);
    });
  });

  // -------------------------------------------------------------------------
  // 7. open() — lifecycle
  // -------------------------------------------------------------------------

  describe('open() — lifecycle', () => {
    it('sets isOpened to true after open()', () => {
      component.open();
      expect(component.isOpened()).toBeTrue();
    });

    it('sets document.body.overflow to "hidden" after open()', () => {
      component.open();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('open() is idempotent — calling twice keeps isOpened true', () => {
      component.open();
      component.open();
      expect(component.isOpened()).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // 8. close() — lifecycle
  // -------------------------------------------------------------------------

  describe('close() — lifecycle', () => {
    it('sets isOpened to false after close()', () => {
      component.open();
      component.close();
      expect(component.isOpened()).toBeFalse();
    });

    it('restores document.body.overflow after close()', () => {
      document.body.style.overflow = '';
      component.open();
      component.close();
      expect(document.body.style.overflow).toBe('');
    });

    it('sets isLoading to false after close()', () => {
      component.open();
      component.startLoading();
      expect(component.isLoading()).toBeTrue();
      component.close();
      expect(component.isLoading()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // 9. startLoading() / stopLoading()
  // -------------------------------------------------------------------------

  describe('startLoading() / stopLoading()', () => {
    it('sets isLoading to true on startLoading()', () => {
      component.startLoading();
      expect(component.isLoading()).toBeTrue();
    });

    it('sets isLoading to false on stopLoading()', () => {
      component.startLoading();
      component.stopLoading();
      expect(component.isLoading()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // 10. Output: sdClosed
  // -------------------------------------------------------------------------

  describe('output: sdClosed', () => {
    it('emits sdClosed when close() is called', () => {
      let emitCount = 0;
      component.sdClosed.subscribe(() => emitCount++);

      component.open();
      component.close();

      expect(emitCount).toBe(1);
    });

    it('does NOT emit sdClosed before close() is called', () => {
      let emitCount = 0;
      component.sdClosed.subscribe(() => emitCount++);

      component.open();

      expect(emitCount).toBe(0);
    });

    it('increments host closedCount on each close()', () => {
      component.open();
      component.close();
      component.open();
      component.close();
      expect(host.closedCount).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // 11. preventScroll helper
  // -------------------------------------------------------------------------

  describe('preventScroll()', () => {
    it('calls event.preventDefault() when preventScroll is invoked', () => {
      const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.preventScroll(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 12. Destroy cleanup
  // -------------------------------------------------------------------------

  describe('destroy cleanup', () => {
    it('restores body overflow on destroy when drawer was open', () => {
      component.open();
      expect(document.body.style.overflow).toBe('hidden');
      fixture.destroy();
      expect(document.body.style.overflow).toBe('');
    });

    it('does not throw on destroy when drawer was never opened', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 13. E2E attributes
  // -------------------------------------------------------------------------

  describe('E2E attributes', () => {
    /**
     * Helper: get the .sd-side-drawer root element from document.body
     * (the drawer is mounted via CdkPortal into document.body, so it does
     *  not live inside the fixture's native element).
     */
    function getDrawerRoot(): HTMLElement | null {
      return document.body.querySelector('.sd-side-drawer');
    }

    it('renders data-autoid on .sd-side-drawer root when autoId input is set', fakeAsync(() => {
      host.autoId = 'filters';
      fixture.detectChanges();
      tick(); // flush any micro-tasks from afterNextRender

      const root = getDrawerRoot();
      // Browsers lowercase HTML attribute names, so data-autoId → data-autoid
      expect(root?.getAttribute('data-autoid')).toBe('components-side-drawer-filters');
    }));

    it('does NOT render data-autoid when autoId is not set', fakeAsync(() => {
      host.autoId = undefined;
      fixture.detectChanges();
      tick();

      const root = getDrawerRoot();
      // autoId() returns undefined → Angular renders no attribute (null)
      expect(root?.getAttribute('data-autoid')).toBeNull();
    }));

    it('renders data-opened toggling with open() / close()', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const root = getDrawerRoot();
      // Initial state: closed → 'false'
      expect(root?.getAttribute('data-opened')).toBe('false');

      component.open();
      fixture.detectChanges();
      tick();
      expect(root?.getAttribute('data-opened')).toBe('true');

      component.close();
      fixture.detectChanges();
      tick();
      expect(root?.getAttribute('data-opened')).toBe('false');
    }));

    it('renders data-loading toggling with startLoading() / stopLoading()', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const root = getDrawerRoot();
      // Initial state: not loading → 'false'
      expect(root?.getAttribute('data-loading')).toBe('false');

      component.open();
      component.startLoading();
      fixture.detectChanges();
      tick();
      expect(root?.getAttribute('data-loading')).toBe('true');

      component.stopLoading();
      fixture.detectChanges();
      tick();
      expect(root?.getAttribute('data-loading')).toBe('false');
    }));

    it('renders a compact close button with a Material close icon while open', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.open();
      fixture.detectChanges();
      tick();

      const closeButton = getDrawerRoot()?.querySelector('button.sd-side-drawer-close-btn') as HTMLButtonElement | null;
      expect(closeButton).not.toBeNull();
      expect(closeButton?.querySelector('mat-icon')?.textContent?.trim()).toBe('close');
    }));
  });
});
