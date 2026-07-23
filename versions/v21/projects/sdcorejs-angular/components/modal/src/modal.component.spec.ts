import { Component, Injector, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Subject } from 'rxjs';
import { SdModal } from './modal.component';

// ---------------------------------------------------------------------------
// Host helpers
// ---------------------------------------------------------------------------

/** Force dialog mode via view="dialog" to bypass isMobile detection in tests. */
@Component({
  standalone: true,
  imports: [SdModal],
  template: `
    <sd-modal
      view="dialog"
      [title]="title"
      [width]="width"
      [hideClose]="hideClose"
      [modalClass]="modalClass"
      [disableBackdropClose]="disableBackdropClose"
      [beforeClose]="beforeClose"
      (sdCloseError)="onCloseError($event)"
      (sdClosed)="onClosed()">
      <span id="body-content">modal body</span>
      <span sdFooterRight id="footer-content">footer</span>
    </sd-modal>
  `,
})
class HostComponent {
  title = 'Test Modal';
  width = 'md';
  hideClose = false;
  modalClass: string | string[] | Record<string, boolean> = '';
  disableBackdropClose = true;
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
// Fake dialog / bottom-sheet refs
// ---------------------------------------------------------------------------

function makeFakeDialogRef(): {
  ref: MatDialogRef<any>;
  afterClosed$: Subject<void>;
  backdropClick$: Subject<MouseEvent>;
  keydownEvents$: Subject<KeyboardEvent>;
} {
  const afterClosed$ = new Subject<void>();
  const backdropClick$ = new Subject<MouseEvent>();
  const keydownEvents$ = new Subject<KeyboardEvent>();
  const ref = {
    afterClosed: () => afterClosed$.asObservable(),
    backdropClick: () => backdropClick$.asObservable(),
    keydownEvents: () => keydownEvents$.asObservable(),
    close: jasmine.createSpy('dialogRef.close'),
  } as unknown as MatDialogRef<any>;
  return { ref, afterClosed$, backdropClick$, keydownEvents$ };
}

function makeFakeBottomSheetRef(): { ref: MatBottomSheetRef<any>; afterDismissed$: Subject<void> } {
  const afterDismissed$ = new Subject<void>();
  const ref = {
    afterDismissed: () => afterDismissed$.asObservable(),
    dismiss: jasmine.createSpy('bottomSheetRef.dismiss'),
  } as unknown as MatBottomSheetRef<any>;
  return { ref, afterDismissed$ };
}

// ---------------------------------------------------------------------------
// Helper: get SdModal debugElement and component instance
// ---------------------------------------------------------------------------

function getModalDe(fixture: ComponentFixture<HostComponent>) {
  return fixture.debugElement.query(By.directive(SdModal));
}

function getModal(fixture: ComponentFixture<HostComponent>): SdModal {
  return getModalDe(fixture).componentInstance as SdModal;
}

/**
 * Get MatDialog from the component's own injector (not TestBed root).
 * SdModal imports MatDialogModule standalone — its injector may provide a
 * scoped MatDialog instance rather than the root one.
 */
function getDialogFromComponent(fixture: ComponentFixture<HostComponent>): MatDialog {
  const injector: Injector = getModalDe(fixture).injector;
  return injector.get(MatDialog);
}

function getBottomSheetFromComponent(fixture: ComponentFixture<HostComponent>): MatBottomSheet {
  const injector: Injector = getModalDe(fixture).injector;
  return injector.get(MatBottomSheet);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SdModal', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdModal;
  let dialogOpenSpy: jasmine.Spy;
  let bottomSheetOpenSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getModal(fixture);

    // Get service from the component's own injector to ensure same instance
    const dialog = getDialogFromComponent(fixture);
    const bottomSheet = getBottomSheetFromComponent(fixture);

    const { ref: defaultDialogRef } = makeFakeDialogRef();
    dialogOpenSpy = spyOn(dialog, 'open').and.returnValue(defaultDialogRef);

    const { ref: defaultBsRef } = makeFakeBottomSheetRef();
    bottomSheetOpenSpy = spyOn(bottomSheet, 'open').and.returnValue(defaultBsRef);
  });

  // -------------------------------------------------------------------------
  // Creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('starts with isOpened = false', () => {
      expect(component.isOpened()).toBeFalse();
    });

    it('starts with alreadyOpened = false', () => {
      expect(component.alreadyOpened()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  describe('input: title', () => {
    it('reads title input from host', () => {
      expect(component.title()).toBe('Test Modal');
    });

    it('coerces null title to empty string', () => {
      host.title = null as any;
      fixture.detectChanges();
      expect(component.title()).toBe('');
    });

    it('coerces undefined title to empty string', () => {
      host.title = undefined as any;
      fixture.detectChanges();
      expect(component.title()).toBe('');
    });
  });

  describe('input: width', () => {
    it('reads width default value "md"', () => {
      expect(component.width()).toBe('md');
    });

    it('accepts custom CSS width string', () => {
      host.width = '600px';
      fixture.detectChanges();
      expect(component.width()).toBe('600px');
    });

    it('accepts token "lg"', () => {
      host.width = 'lg';
      fixture.detectChanges();
      expect(component.width()).toBe('lg');
    });
  });

  describe('input: hideClose', () => {
    it('defaults hideClose to false', () => {
      expect(component.hideClose()).toBeFalse();
    });

    it('reflects hideClose = true', () => {
      host.hideClose = true;
      fixture.detectChanges();
      expect(component.hideClose()).toBeTrue();
    });
  });

  describe('input: disableBackdropClose', () => {
    it('defaults disableBackdropClose to true', () => {
      expect(component.disableBackdropClose()).toBeTrue();
    });

    it('reflects disableBackdropClose = false', () => {
      host.disableBackdropClose = false;
      fixture.detectChanges();
      expect(component.disableBackdropClose()).toBeFalse();
    });
  });

  describe('input: lazyLoadContent', () => {
    it('defaults lazyLoadContent to true', () => {
      expect(component.lazyLoadContent()).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // open() — lifecycle (view="dialog" enforced in host to bypass isMobile)
  // -------------------------------------------------------------------------

  describe('open() — lifecycle', () => {
    it('sets isOpened to true', () => {
      component.open();
      expect(component.isOpened()).toBeTrue();
    });

    it('sets alreadyOpened to true after first open()', () => {
      component.open();
      expect(component.alreadyOpened()).toBeTrue();
    });

    it('is a no-op when already opened (second call skipped)', () => {
      component.open();
      component.open();
      expect(dialogOpenSpy).toHaveBeenCalledTimes(1);
    });

    it('calls MatDialog.open() when view="dialog"', () => {
      component.open();
      expect(dialogOpenSpy).toHaveBeenCalledTimes(1);
      expect(bottomSheetOpenSpy).not.toHaveBeenCalled();
    });

    it('passes disableClose=true when disableBackdropClose is true', () => {
      component.open();
      const opts = dialogOpenSpy.calls.mostRecent().args[1] as any;
      expect(opts.disableClose).toBeTrue();
    });

    it('passes disableClose=false when disableBackdropClose is false', () => {
      host.disableBackdropClose = false;
      fixture.detectChanges();
      component.open();
      const opts = dialogOpenSpy.calls.mostRecent().args[1] as any;
      expect(opts.disableClose).toBeFalse();
    });

    it('adds the default dialog panel class and preserves custom classes', () => {
      host.modalClass = 'custom-a custom-b';
      fixture.detectChanges();

      component.open();
      const opts = dialogOpenSpy.calls.mostRecent().args[1] as any;

      expect(opts.panelClass).toEqual(['sd-modal-panel', 'custom-a', 'custom-b']);
    });
  });

  // -------------------------------------------------------------------------
  // close() — lifecycle
  // -------------------------------------------------------------------------

  describe('close() — lifecycle', () => {
    it('calls dialogRef.close() on close()', () => {
      const { ref } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);

      component.open();
      component.close();

      expect(ref.close as jasmine.Spy).toHaveBeenCalled();
    });

    it('sets isOpened to false when afterClosed$ emits', () => {
      const { ref, afterClosed$ } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);

      component.open();
      expect(component.isOpened()).toBeTrue();

      afterClosed$.next();
      expect(component.isOpened()).toBeFalse();
    });

    it('keeps the dialog open when beforeClose returns false', async () => {
      const { ref } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);
      host.beforeClose = () => false;
      fixture.detectChanges();

      component.open();
      const closed = await component.requestClose();

      expect(closed).toBeFalse();
      expect(ref.close as jasmine.Spy).not.toHaveBeenCalled();
    });

    it('closes the dialog when async beforeClose resolves true', async () => {
      const { ref } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);
      host.beforeClose = () => Promise.resolve(true);
      fixture.detectChanges();

      component.open();
      const closed = await component.requestClose();

      expect(closed).toBeTrue();
      expect(ref.close as jasmine.Spy).toHaveBeenCalledTimes(1);
    });

    it('fails closed and emits sdCloseError when beforeClose rejects', async () => {
      const error = new Error('confirmation failed');
      host.beforeClose = () => Promise.reject(error);
      fixture.detectChanges();

      component.open();
      const closed = await component.requestClose();

      expect(closed).toBeFalse();
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

    it('keeps Material automatic close disabled while beforeClose owns the decision', () => {
      host.disableBackdropClose = false;
      host.beforeClose = () => true;
      fixture.detectChanges();

      component.open();

      const opts = dialogOpenSpy.calls.mostRecent().args[1] as any;
      expect(opts.disableClose).toBeTrue();
    });

    it('routes backdrop clicks through beforeClose when automatic close is enabled', async () => {
      const { ref, backdropClick$ } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);
      host.disableBackdropClose = false;
      host.beforeClose = () => false;
      fixture.detectChanges();
      component.open();

      backdropClick$.next(new MouseEvent('click'));
      await fixture.whenStable();

      expect(ref.close as jasmine.Spy).not.toHaveBeenCalled();
    });

    it('routes Escape through beforeClose when automatic close is enabled', async () => {
      const { ref, keydownEvents$ } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);
      host.disableBackdropClose = false;
      host.beforeClose = () => true;
      fixture.detectChanges();
      component.open();

      keydownEvents$.next(new KeyboardEvent('keydown', { key: 'Escape' }));
      await fixture.whenStable();

      expect(ref.close as jasmine.Spy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Output: sdClosed
  // -------------------------------------------------------------------------

  describe('output: sdClosed', () => {
    it('emits sdClosed after afterClosed$ fires', () => {
      const { ref, afterClosed$ } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);

      let emitCount = 0;
      component.sdClosed.subscribe(() => emitCount++);

      component.open();
      afterClosed$.next();

      expect(emitCount).toBe(1);
    });

    it('does NOT emit sdClosed before dialog is closed', () => {
      const { ref } = makeFakeDialogRef();
      dialogOpenSpy.and.returnValue(ref);

      let emitCount = 0;
      component.sdClosed.subscribe(() => emitCount++);

      component.open();
      expect(emitCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // view="bottom-sheet"
  // -------------------------------------------------------------------------

  describe('view="bottom-sheet"', () => {
    @Component({
      standalone: true,
      imports: [SdModal],
      template: `<sd-modal view="bottom-sheet" title="BS Modal"></sd-modal>`,
    })
    class BsHostComponent {}

    let bsFixture: ComponentFixture<BsHostComponent>;
    let bsComponent: SdModal;
    let bsBottomSheetSpy: jasmine.Spy;

    beforeEach(() => {
      bsFixture = TestBed.createComponent(BsHostComponent);
      bsFixture.detectChanges();
      bsComponent = bsFixture.debugElement.query(By.directive(SdModal)).componentInstance as SdModal;

      // Get services from the bs component's own injector
      const bsInjector: Injector = bsFixture.debugElement.query(By.directive(SdModal)).injector;
      const bsDialog = bsInjector.get(MatDialog);
      const bsBottomSheet = bsInjector.get(MatBottomSheet);

      const { ref: bsDefaultDialogRef } = makeFakeDialogRef();
      spyOn(bsDialog, 'open').and.returnValue(bsDefaultDialogRef);

      const { ref: bsDefaultBsRef } = makeFakeBottomSheetRef();
      bsBottomSheetSpy = spyOn(bsBottomSheet, 'open').and.returnValue(bsDefaultBsRef);
    });

    it('calls MatBottomSheet.open() when view="bottom-sheet"', () => {
      bsComponent.open();
      expect(bsBottomSheetSpy).toHaveBeenCalledTimes(1);
      const opts = bsBottomSheetSpy.calls.mostRecent().args[1] as any;
      expect(opts.panelClass).toEqual(['sd-modal-bottom-sheet-panel']);
    });

    it('sets isOpened to true after bottom-sheet open()', () => {
      bsComponent.open();
      expect(bsComponent.isOpened()).toBeTrue();
    });

    it('emits sdClosed after afterDismissed$ fires', () => {
      const { ref, afterDismissed$ } = makeFakeBottomSheetRef();
      bsBottomSheetSpy.and.returnValue(ref);

      let emitCount = 0;
      bsComponent.sdClosed.subscribe(() => emitCount++);

      bsComponent.open();
      afterDismissed$.next();
      expect(emitCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // autoId — namespaced prefix + derived child IDs
  // (merged in from local branch's autoId refactor work)
  // -------------------------------------------------------------------------

  describe('autoId', () => {
    @Component({
      standalone: true,
      imports: [SdModal],
      template: `<sd-modal [autoId]="autoId" [title]="'Test'"></sd-modal>`,
    })
    class AutoIdHost {
      autoId: string | null | undefined = undefined;
    }

    let aFixture: ComponentFixture<AutoIdHost>;
    let aModal: SdModal;

    beforeEach(() => {
      aFixture = TestBed.createComponent(AutoIdHost);
      aFixture.detectChanges();
      aModal = aFixture.debugElement.query(By.directive(SdModal)).componentInstance as SdModal;
    });

    it('autoId() returns undefined when not provided', () => {
      expect(aModal.autoId()).toBeUndefined();
      expect(aModal.closeButtonAutoId()).toBeUndefined();
    });

    it('prefixes autoId with "components-modal-"', () => {
      aFixture.componentInstance.autoId = 'dialog1';
      aFixture.detectChanges();
      expect(aModal.autoId()).toBe('components-modal-dialog1');
    });

    it('derives closeButtonAutoId with "-close" suffix', () => {
      aFixture.componentInstance.autoId = 'dialog1';
      aFixture.detectChanges();
      expect(aModal.closeButtonAutoId()).toBe('components-modal-dialog1-close');
    });
  });

  // -------------------------------------------------------------------------
  // E2E attributes — .sd-modal-root wrapper with data-autoId + data-opened
  // -------------------------------------------------------------------------
  //
  // NOTE: The fake MatDialog.open() spy does NOT render the <ng-template> into
  // the real CDK overlay, so document.querySelector('.sd-modal-root') returns
  // null in unit tests. Instead we exercise the template via a host that sets
  // [lazyLoadContent]="false" so the @if block renders immediately, and we
  // read the TemplateRef's embedded view via ViewContainerRef to confirm the
  // wrapper element and its attributes. isOpened / dataOpened are verified
  // directly via the SdModal instance.
  // -------------------------------------------------------------------------

  describe('E2E attributes', () => {
    @Component({
      standalone: true,
      imports: [SdModal],
      template: `
        <sd-modal view="dialog" [autoId]="autoId" [title]="'E2E Test'" [lazyLoadContent]="false">
          <span sdHeaderRight id="header-action">Header action</span>
          <span id="body-slot">Body content</span>
          <span id="body-extra">Additional body content</span>
          <span sdFooterLeft id="footer-left">Secondary</span>
          <span sdFooterRight id="footer-right">Primary</span>
        </sd-modal>
      `,
    })
    class E2EHost {
      autoId = 'confirm';
    }

    let eFixture: ComponentFixture<E2EHost>;
    let eModal: SdModal;
    let eDialogSpy: jasmine.Spy;
    let eAfterClosed$: Subject<void>;

    beforeEach(() => {
      eFixture = TestBed.createComponent(E2EHost);
      eFixture.detectChanges();
      eModal = eFixture.debugElement.query(By.directive(SdModal)).componentInstance as SdModal;

      const eDialog = eFixture.debugElement.query(By.directive(SdModal)).injector.get(MatDialog);
      const { ref, afterClosed$ } = makeFakeDialogRef();
      eAfterClosed$ = afterClosed$;
      eDialogSpy = spyOn(eDialog, 'open').and.returnValue(ref);
    });

    it('dataOpened() returns "false" before open()', () => {
      expect(eModal.dataOpened()).toBe('false');
    });

    it('dataOpened() returns "true" after open()', () => {
      eModal.open();
      expect(eModal.dataOpened()).toBe('true');
    });

    it('dataOpened() returns "false" again after afterClosed$ emits', () => {
      eModal.open();
      expect(eModal.dataOpened()).toBe('true');

      eAfterClosed$.next();
      expect(eModal.dataOpened()).toBe('false');
    });

    it('renders .sd-modal-root wrapper element inside the TemplateRef', () => {
      // Create an embedded view from the templateRef so we can inspect the DOM
      // without needing a real CDK overlay. This is equivalent to what MatDialog
      // does when it opens the template — it calls templateRef.createEmbeddedView().
      const vcr = eFixture.debugElement.query(By.directive(SdModal)).injector.get(ViewContainerRef);
      const view = eModal.templateRef().createEmbeddedView({});
      vcr.insert(view);
      eFixture.detectChanges();

      const root = view.rootNodes[0] as HTMLElement;
      expect(root).toBeTruthy();
      expect(root.classList.contains('sd-modal-root')).toBeTrue();
    });

    it('renders default body content without legacy horizontal padding class', () => {
      const vcr = eFixture.debugElement.query(By.directive(SdModal)).injector.get(ViewContainerRef);
      const view = eModal.templateRef().createEmbeddedView({});
      vcr.insert(view);
      eFixture.detectChanges();

      const root = view.rootNodes[0] as HTMLElement;
      const body = root.querySelector('.sd-modal-body') as HTMLElement | null;

      expect(body).not.toBeNull();
      expect(body?.querySelector('#body-slot')?.textContent?.trim()).toBe('Body content');
      expect(body?.classList.contains('px-16')).toBeFalse();
      expect(body?.classList.contains('p-16')).toBeFalse();
    });

    it('projects header and footer slots into the normalized left/right containers', () => {
      const vcr = eFixture.debugElement.query(By.directive(SdModal)).injector.get(ViewContainerRef);
      const view = eModal.templateRef().createEmbeddedView({});
      vcr.insert(view);
      eFixture.detectChanges();

      const root = view.rootNodes[0] as HTMLElement;

      expect(root.querySelector('.sd-modal-header-right #header-action')?.textContent?.trim()).toBe('Header action');
      expect(root.querySelector('.sd-modal-footer-left #footer-left')?.textContent?.trim()).toBe('Secondary');
      expect(root.querySelector('.sd-modal-footer-right #footer-right')?.textContent?.trim()).toBe('Primary');
      expect(root.querySelector('.sd-modal-body #body-extra')?.textContent?.trim()).toBe('Additional body content');
    });

    it('limits the dialog surface to viewport height so body scroll does not hide footer actions', () => {
      const styles = ((SdModal as any).ɵcmp.styles as string[]).join('\n');

      expect(styles).toContain('max-height: calc(100vh - 32px)');
    });

    it('keeps right-only footer actions aligned to the end when the left slot is empty', () => {
      const styles = ((SdModal as any).ɵcmp.styles as string[]).join('\n');

      expect(styles).toContain('margin-left: auto');
    });

    it('renders a compact close button with the derived autoId', () => {
      const vcr = eFixture.debugElement.query(By.directive(SdModal)).injector.get(ViewContainerRef);
      const view = eModal.templateRef().createEmbeddedView({});
      vcr.insert(view);
      eFixture.detectChanges();

      const root = view.rootNodes[0] as HTMLElement;
      const closeButton = root.querySelector('button.sd-modal-close-btn') as HTMLButtonElement | null;

      expect(closeButton).not.toBeNull();
      expect(closeButton?.getAttribute('data-autoid')).toBe('components-modal-confirm-close');
      expect(closeButton?.querySelector('mat-icon')?.textContent?.trim()).toBe('close');
    });

    it('autoId() computes to "components-modal-confirm"', () => {
      expect(eModal.autoId()).toBe('components-modal-confirm');
    });
  });
});
