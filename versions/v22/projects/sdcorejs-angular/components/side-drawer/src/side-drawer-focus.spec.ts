import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSideDrawer } from './side-drawer.component';
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdSideDrawer],
  template:
    '<button id="opener" (click)="drawer().open()">Open</button><sd-side-drawer title="Edit" [beforeClose]="guard"><input aria-label="Name"/><button sdFooterRight>Save</button></sd-side-drawer>',
})
class FocusHost {
  drawer = viewChild.required(SdSideDrawer);
  guard: (() => boolean) | undefined;
}
describe('Drawer focus lifecycle', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [FocusHost, NoopAnimationsModule] }));
  it('captures focus on open, wraps Tab with CDK anchors and restores on close', fakeAsync(() => {
    const f = TestBed.createComponent(FocusHost);
    f.detectChanges();
    tick();
    const opener = f.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    f.detectChanges();
    tick();
    const root = document.getElementById(f.componentInstance.drawer().id)!;
    expect(root.contains(document.activeElement)).toBeTrue();
    const anchors = root.querySelectorAll<HTMLElement>('.cdk-focus-trap-anchor');
    expect(anchors.length).toBe(2);
    if (anchors.length) {
      anchors[1].focus();
      expect(root.querySelector('.sd-side-drawer-focus')?.contains(document.activeElement)).toBeTrue();
    }
    const outerEscape = jasmine.createSpy('outerEscape');
    document.addEventListener('keydown', outerEscape);
    try {
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(outerEscape).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', outerEscape);
    }
    f.detectChanges();
    tick();
    expect(document.activeElement).toBe(opener);
    f.destroy();
  }));
  it('retains capture when close guard refuses, and releases on destroy', fakeAsync(() => {
    const f = TestBed.createComponent(FocusHost);
    f.componentInstance.guard = () => false;
    f.detectChanges();
    tick();
    const opener = f.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    f.detectChanges();
    tick();
    f.componentInstance.drawer().close();
    tick();
    f.detectChanges();
    const root = document.getElementById(f.componentInstance.drawer().id)!;
    expect(f.componentInstance.drawer().isOpened()).toBeTrue();
    expect(root.contains(document.activeElement)).toBeTrue();
    f.destroy();
    tick();
    expect(document.querySelector('.sd-side-drawer-focus')).toBeNull();
  }));
});
