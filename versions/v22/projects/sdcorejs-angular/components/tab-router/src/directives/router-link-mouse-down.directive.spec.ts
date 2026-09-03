import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { RouterLinkMouseDownDirective } from './router-link-mouse-down.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<div>target</div>',
})
class TargetComponent {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [RouterLinkMouseDownDirective],
  template: `<a routerLink="/target" id="link">go</a>`,
})
class HostComponent {}

describe('RouterLinkMouseDownDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let anchor: HTMLAnchorElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([{ path: 'target', component: TargetComponent }])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    anchor = fixture.nativeElement.querySelector('a#link') as HTMLAnchorElement;
  });

  it('attaches to anchor[routerLink]', () => {
    expect(anchor).not.toBeNull();
    expect(anchor.getAttribute('href')).toBe('/target');
  });

  it('mousedown with left button triggers router navigation (same as click)', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.callThrough();

    const ev = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
    anchor.dispatchEvent(ev);
    fixture.detectChanges();

    expect(navSpy).toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(true);
  });

  it('mousedown with middle button (button=1) does NOT navigate (returns true to let browser open new tab)', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.callThrough();

    const ev = new MouseEvent('mousedown', { button: 1, bubbles: true, cancelable: true });
    anchor.dispatchEvent(ev);

    expect(navSpy).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(false);
  });

  it('mousedown with ctrlKey skips router navigation (browser handles new tab)', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.callThrough();

    const ev = new MouseEvent('mousedown', { button: 0, ctrlKey: true, bubbles: true, cancelable: true });
    anchor.dispatchEvent(ev);

    expect(navSpy).not.toHaveBeenCalled();
  });

  it('mousedown with metaKey skips router navigation (mac cmd+click)', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.callThrough();

    const ev = new MouseEvent('mousedown', { button: 0, metaKey: true, bubbles: true, cancelable: true });
    anchor.dispatchEvent(ev);

    expect(navSpy).not.toHaveBeenCalled();
  });

  it('mousedown with shiftKey skips router navigation (browser opens new window)', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.callThrough();

    const ev = new MouseEvent('mousedown', { button: 0, shiftKey: true, bubbles: true, cancelable: true });
    anchor.dispatchEvent(ev);

    expect(navSpy).not.toHaveBeenCalled();
  });
});
