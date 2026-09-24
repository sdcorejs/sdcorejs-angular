import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSideDrawer } from './side-drawer.component';

// ---------------------------------------------------------------------------
// Host component — standard usage
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
      [beforeClose]="beforeClose"
      (sdCloseError)="onCloseError($event)"
      (sdClosed)="onClosed()">
      <span id="body-content">drawer body</span>
      <div sdFooterRight id="footer-content">footer</div>
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
  beforeClose: (() => boolean | Promise<boolean>) | undefined;
  closedCount = 0;
  closeErrors: unknown[] = [];
  onCloseError(error: unknown): void {
    this.closeErrors.push(error);
  }
  onClosed(): void {
    this.closedCount++;
  }
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

    it('keeps the drawer open when beforeClose returns false', async () => {
      host.beforeClose = () => false;
      fixture.detectChanges();
      component.open();

      const closed = await component.requestClose();

      expect(closed).toBeFalse();
      expect(component.isOpened()).toBeTrue();
      expect(host.closedCount).toBe(0);
    });

    it('closes the drawer when async beforeClose resolves true', async () => {
      host.beforeClose = () => Promise.resolve(true);
      fixture.detectChanges();
      component.open();

      const closed = await component.requestClose();

      expect(closed).toBeTrue();
      expect(component.isOpened()).toBeFalse();
      expect(host.closedCount).toBe(1);
    });

    it('fails closed and emits sdCloseError when beforeClose throws', async () => {
      const error = new Error('confirmation failed');
      host.beforeClose = () => {
        throw error;
      };
      fixture.detectChanges();
      component.open();

      const closed = await component.requestClose();

      expect(closed).toBeFalse();
      expect(component.isOpened()).toBeTrue();
      expect(host.closeErrors).toEqual([error]);
    });

    it('coalesces concurrent guarded close requests', async () => {
      let resolveGuard!: (value: boolean) => void;
      host.beforeClose = () => new Promise<boolean>(resolve => (resolveGuard = resolve));
      fixture.detectChanges();
      component.open();

      const first = component.requestClose();
      const second = component.requestClose();

      expect(second).toBe(first);
      await Promise.resolve();
      resolveGuard(false);
      await first;
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

    it('keeps right-only footer actions aligned to the end when the left slot is empty', () => {
      const styles = ((SdSideDrawer as any).ɵcmp.styles as string[]).join('\n');

      expect(styles).toContain('margin-left: auto');
    });

    // ── A11y ────────────────────────────────────────────────────────────
    // why: "click backdrop để đóng" là hành vi CHỈ có ở chuột — drawer không hề có Escape. Và
    // backdrop dùng aria-hidden thay vì role="presentation" (khai báo đúng cho lớp phủ trang trí).

    it('marks the backdrop presentational instead of aria-hidden', fakeAsync(() => {
      fixture.detectChanges();
      component.open();
      fixture.detectChanges();
      tick();

      const backdrop = document.body.querySelector('.sd-side-drawer-backdrop') as HTMLElement;
      expect(backdrop).not.toBeNull();
      expect(backdrop.getAttribute('role')).toBe('presentation');
      expect(backdrop.hasAttribute('aria-hidden')).toBe(false);
    }));

    it('exposes the drawer as a labelled modal dialog', fakeAsync(() => {
      fixture.detectChanges();
      component.open();
      fixture.detectChanges();
      tick();

      const root = getDrawerRoot()!;
      expect(root.getAttribute('role')).toBe('dialog');
      expect(root.getAttribute('aria-modal')).toBe('true');
      expect(root.getAttribute('aria-label')).toBe('Test Drawer');
    }));

    it('Escape closes the drawer, mirroring the backdrop click', fakeAsync(() => {
      fixture.detectChanges();
      component.open();
      fixture.detectChanges();
      tick();

      getDrawerRoot()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      tick();

      expect(component.isOpened()).toBeFalse();
    }));

    it('Escape does nothing when backdrop dismissal is disabled', fakeAsync(() => {
      host.disableBackdropClose = true;
      fixture.detectChanges();
      component.open();
      fixture.detectChanges();
      tick();

      getDrawerRoot()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      tick();

      expect(component.isOpened()).toBeTrue();
      component.close();
      fixture.detectChanges();
      tick();
    }));
  });
});

// ---------------------------------------------------------------------------
// Khoá scroll body phải stack-safe khi có nhiều drawer chồng nhau
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSideDrawer],
  template: `
    <sd-side-drawer title="Outer"><span>outer body</span></sd-side-drawer>
    <sd-side-drawer title="Inner"><span>inner body</span></sd-side-drawer>
  `,
})
class StackedHostComponent {}

describe('SdSideDrawer — stacked body scroll lock', () => {
  let fixture: ComponentFixture<StackedHostComponent>;
  let outer: SdSideDrawer;
  let inner: SdSideDrawer;

  beforeEach(async () => {
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({
      imports: [StackedHostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(StackedHostComponent);
    fixture.detectChanges();
    const drawers = fixture.debugElement.queryAll(By.directive(SdSideDrawer));
    outer = drawers[0].componentInstance as SdSideDrawer;
    inner = drawers[1].componentInstance as SdSideDrawer;
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('keeps the page locked when the OUTER drawer closes first and the inner one is still open', () => {
    outer.open();
    inner.open();
    expect(document.body.style.overflow).toBe('hidden');

    outer.close();
    // Drawer trong vẫn mở → trang phải còn khoá
    expect(document.body.style.overflow).toBe('hidden');

    inner.close();
    // Drawer cuối cùng đóng → trả scroll về nguyên trạng
    expect(document.body.style.overflow).toBe('');
  });

  it('restores scroll after the last stacked drawer closes in LIFO order', () => {
    outer.open();
    inner.open();

    inner.close();
    expect(document.body.style.overflow).toBe('hidden');

    outer.close();
    expect(document.body.style.overflow).toBe('');
  });

  it('does not leave the page permanently locked when stacked drawers are destroyed while open', () => {
    outer.open();
    inner.open();

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });

  it('preserves an overflow value the app set before any drawer opened', () => {
    document.body.style.overflow = 'auto';

    outer.open();
    inner.open();
    outer.close();
    inner.close();

    expect(document.body.style.overflow).toBe('auto');
  });

  it('is idempotent — repeated open()/close() on the same drawer keeps the lock balanced', () => {
    outer.open();
    outer.open();
    inner.open();

    outer.close();
    outer.close();
    expect(document.body.style.overflow).toBe('hidden');

    inner.close();
    expect(document.body.style.overflow).toBe('');
  });
});

// ---------------------------------------------------------------------------
// [container]: drawer mở gọn trong một vùng thay vì phủ cả viewport
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSideDrawer],
  template: `
    <div #area class="area" [style.position]="areaPosition" style="width: 400px; height: 300px">
      <p>region content</p>
    </div>
    <sd-side-drawer title="Scoped" [container]="scoped ? (useRef ? areaRef : area) : null">
      <span id="scoped-body">scoped body</span>
      <button sdFooterRight type="button">Save</button>
    </sd-side-drawer>
  `,
})
class ContainedHostComponent {
  @ViewChild('area', { static: true, read: ElementRef }) areaRef!: ElementRef<HTMLElement>;
  scoped = true;
  useRef = false;
  areaPosition: string | null = null;
}

describe('SdSideDrawer — [container]', () => {
  let fixture: ComponentFixture<ContainedHostComponent>;
  let drawer: SdSideDrawer;

  const area = (): HTMLElement => fixture.nativeElement.querySelector('.area');
  const panel = (): HTMLElement => document.getElementById(drawer.id) as HTMLElement;

  function create(setup: (host: ContainedHostComponent) => void = () => undefined): void {
    fixture = TestBed.createComponent(ContainedHostComponent);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    tick();
    drawer = fixture.debugElement.query(By.directive(SdSideDrawer)).componentInstance as SdSideDrawer;
  }

  function open(): void {
    drawer.open();
    fixture.detectChanges();
    tick();
  }

  function close(): void {
    drawer.close();
    fixture.detectChanges();
    tick();
  }

  beforeEach(async () => {
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({
      imports: [ContainedHostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    document.body.style.overflow = '';
  });

  it('renders the panel and its backdrop inside the container, positioned against it', fakeAsync(() => {
    create();
    const layer = area().querySelector(':scope > .sd-side-drawer-layer') as HTMLElement;
    expect(layer).not.toBeNull();
    expect(panel().parentElement).toBe(layer);
    expect(panel().classList).toContain('sd-side-drawer-contained');
    expect(getComputedStyle(panel()).position).toBe('absolute');
    // why: lớp bọc cắt phần panel đang trượt và để click xuyên xuống vùng chứa khi drawer đóng.
    expect(getComputedStyle(layer).overflow).toBe('clip');
    expect(getComputedStyle(layer).pointerEvents).toBe('none');

    open();
    const backdrop = panel().nextElementSibling as HTMLElement;
    expect(backdrop.classList).toContain('sd-side-drawer-backdrop-contained');
    expect(getComputedStyle(backdrop).position).toBe('absolute');
    expect(getComputedStyle(backdrop).pointerEvents).toBe('auto');
    expect(layer.querySelector('#scoped-body')).not.toBeNull();
    close();
  }));

  it('slides in without scrolling its layer when focus enters the panel', fakeAsync(() => {
    create();
    open();
    const layer = panel().parentElement as HTMLElement;
    // why: CDK focuses the close button while the panel is still translated outside the layer. A layer
    // that can scroll (overflow: hidden) scrolls to reveal it, which shifts the backdrop from the left and
    // makes the panel jump instead of sliding in from the right.
    expect(panel().contains(document.activeElement)).toBeTrue();
    expect(layer.scrollLeft).toBe(0);
    expect((panel().nextElementSibling as HTMLElement).getBoundingClientRect().left).toBe(area().getBoundingClientRect().left);
    close();
  }));

  it('sizes the panel and its touch targets from the container width, not the viewport', fakeAsync(() => {
    create();
    open();
    // 400px container → narrow layout: 8px inset on both sides and 44px close button.
    expect(Math.round(panel().getBoundingClientRect().width)).toBe(400 - 16);
    const closeButton = panel().querySelector('.sd-side-drawer-close-btn') as HTMLElement;
    expect(closeButton.getBoundingClientRect().width).toBe(44);
    close();
  }));

  it('does not lock page scroll while open inside a container', fakeAsync(() => {
    create();
    open();
    expect(document.body.style.overflow).toBe('');
    close();
    expect(document.body.style.overflow).toBe('');
  }));

  it('closes from its backdrop and with Escape inside the container', fakeAsync(() => {
    create();
    open();
    (panel().nextElementSibling as HTMLElement).click();
    fixture.detectChanges();
    tick();
    expect(drawer.isOpened()).toBeFalse();

    open();
    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    tick();
    expect(drawer.isOpened()).toBeFalse();
  }));

  it('makes a static container its positioning context and restores it on destroy', fakeAsync(() => {
    create();
    const region = area();
    expect(region.style.position).toBe('relative');
    fixture.destroy();
    expect(region.style.position).toBe('');
    expect(region.querySelector('.sd-side-drawer-layer')).toBeNull();
  }));

  it('leaves an already positioned container untouched', fakeAsync(() => {
    create(host => (host.areaPosition = 'absolute'));
    const region = area();
    expect(region.style.position).toBe('absolute');
    fixture.destroy();
    expect(region.style.position).toBe('absolute');
  }));

  it('accepts an ElementRef', fakeAsync(() => {
    create(host => (host.useRef = true));
    expect(panel().parentElement?.parentElement).toBe(area());
  }));

  it('moves between the container and the viewport when [container] changes, locking scroll only in the viewport', fakeAsync(() => {
    create();
    open();
    const host = fixture.componentInstance;

    host.scoped = false;
    fixture.detectChanges();
    tick();
    expect(panel().parentElement).toBe(document.body);
    expect(panel().classList).not.toContain('sd-side-drawer-contained');
    expect(panel().nextElementSibling?.classList).toContain('sd-side-drawer-backdrop');
    expect(area().querySelector('.sd-side-drawer-layer')).toBeNull();
    expect(area().style.position).toBe('');
    expect(document.body.style.overflow).toBe('hidden');

    host.scoped = true;
    fixture.detectChanges();
    tick();
    expect(panel().parentElement?.parentElement).toBe(area());
    expect(document.body.style.overflow).toBe('');
    close();
  }));
});
