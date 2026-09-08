import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdDataState, SdDataStateKind, SdDataStateTemplateDirective } from './data-state.component';

@Component({
  standalone: true,
  imports: [SdDataState, SdDataStateTemplateDirective],
  template: `<sd-data-state [state]="state" (sdRetry)="retries = retries + 1" (sdAction)="actions = actions + 1">
    @if (custom) {
      <ng-template sdDataStateTemplate let-current let-state="state" let-retry="retry" let-action="action">
        <span class="custom">{{ current }} / {{ state }}</span>
        <button type="button" class="retry" (click)="retry()">Retry</button>
        <button type="button" class="action" (click)="action()">Action</button>
      </ng-template>
    }
    <article>Successful content</article>
  </sd-data-state>`,
})
class StateHost {
  state: SdDataStateKind = 'success';
  custom = false;
  retries = 0;
  actions = 0;
}

describe('SdDataState port contract', () => {
  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'en');
    TestBed.configureTestingModule({ imports: [SdDataState, StateHost] });
  });

  for (const state of ['loading', 'empty', 'error', 'forbidden'] as const) {
    it(`renders ${state} with icon, live region and semantic color`, () => {
      const fixture = TestBed.createComponent(SdDataState);
      fixture.componentRef.setInput('state', state);
      fixture.nativeElement.style.setProperty('--sd-error', 'rgb(200, 20, 30)');
      fixture.nativeElement.style.setProperty('--sd-black400', 'rgb(90, 90, 90)');
      fixture.nativeElement.style.setProperty('--sd-primary', 'rgb(42, 102, 244)');
      fixture.nativeElement.style.setProperty('--sd-warning-dark', 'rgb(191, 112, 0)');
      fixture.detectChanges();
      const section: HTMLElement = fixture.nativeElement.querySelector('section');
      const icon: HTMLElement = section.querySelector('sd-icon')!;
      const alert = state === 'error' || state === 'forbidden';
      expect(section.getAttribute('role')).toBe(alert ? 'alert' : 'status');
      expect(section.getAttribute('aria-live')).toBe(alert ? 'assertive' : 'polite');
      expect(section.getAttribute('aria-busy')).toBe(state === 'loading' ? 'true' : null);
      expect(icon.querySelector('mat-icon')?.textContent?.trim()).toBe(
        { loading: 'autorenew', empty: 'inbox', error: 'error', forbidden: 'lock' }[state]
      );
      expect(getComputedStyle(icon).color).toBe(
        alert ? 'rgb(200, 20, 30)' : state === 'loading' ? 'rgb(42, 102, 244)' : 'rgb(191, 112, 0)'
      );
      const animated = state === 'loading' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (animated) {
        expect(getComputedStyle(icon).animationName).toContain('sd-data-state-spin');
      } else {
        expect(getComputedStyle(icon).animationName).toBe('none');
      }
      expect(section.textContent).not.toContain('core.component.data-state.');
    });
  }

  it('keeps source defaults, layout, fullPage and loading cleanup', () => {
    const f = TestBed.createComponent(SdDataState);
    expect(f.componentInstance.state()).toBe('success');
    expect(f.componentInstance.fontSet()).toBeUndefined();
    f.componentRef.setInput('state', 'loading');
    f.detectChanges();
    const section: HTMLElement = f.nativeElement.querySelector('section');
    expect(getComputedStyle(f.nativeElement).display).toBe('contents');
    expect(getComputedStyle(section).minHeight).toBe('240px');
    expect(getComputedStyle(section).padding).toBe('32px');
    f.componentRef.setInput('compact', '');
    f.componentRef.setInput('state', 'empty');
    f.detectChanges();
    expect(getComputedStyle(section).minHeight).toBe('120px');
    expect(getComputedStyle(section).padding).toBe('16px');
    expect(section.hasAttribute('aria-busy')).toBeFalse();
    f.componentRef.setInput('fullPage', true);
    f.detectChanges();
    expect(parseFloat(getComputedStyle(section).minHeight)).toBe(window.innerHeight);
  });

  it('preserves nullish text semantics and explicit icon/fontSet', () => {
    const f = TestBed.createComponent(SdDataState);
    f.componentRef.setInput('state', 'error');
    f.componentRef.setInput('title', 'Direct title');
    f.componentRef.setInput('message', '');
    f.componentRef.setInput('icon', 'home');
    f.componentRef.setInput('fontSet', 'material-icons');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.sd-data-state__title').textContent).toBe('Direct title');
    expect(f.nativeElement.querySelector('.sd-data-state__message').textContent).toBe('');
    expect(f.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('home');
    expect(f.nativeElement.querySelector('mat-icon').classList).toContain('material-icons');
  });

  it('emits void retry/action once and never submits a form', () => {
    const f = TestBed.createComponent(SdDataState);
    f.componentRef.setInput('state', 'error');
    f.componentRef.setInput('retryable', true);
    f.componentRef.setInput('actionLabel', 'Action');
    const retry = jasmine.createSpy('retry');
    const action = jasmine.createSpy('action');
    f.componentInstance.sdRetry.subscribe(retry);
    f.componentInstance.sdAction.subscribe(action);
    f.detectChanges();
    for (const selector of ['sd-button[data-state-retry] button', 'sd-button[data-state-action] button']) {
      const button: HTMLButtonElement = f.nativeElement.querySelector(selector);
      expect(button.type).toBe('button');
      button.click();
    }
    expect(retry).toHaveBeenCalledOnceWith(undefined);
    expect(action).toHaveBeenCalledOnceWith(undefined);
  });

  for (const state of ['loading', 'empty', 'error', 'forbidden', 'success'] as const) {
    it(`forwards typed custom context and callbacks for ${state}`, () => {
      const f = TestBed.createComponent(StateHost);
      Object.assign(f.componentInstance, { state, custom: true });
      f.detectChanges();
      expect(f.nativeElement.querySelector('.custom').textContent).toBe(`${state} / ${state}`);
      expect(f.nativeElement.querySelector('section')).toBeNull();
      expect(f.nativeElement.querySelector('article')).toBeNull();
      f.nativeElement.querySelector('.retry').click();
      f.nativeElement.querySelector('.action').click();
      expect(f.componentInstance.retries).toBe(1);
      expect(f.componentInstance.actions).toBe(1);
    });
    it(`projects successful content only for success (${state})`, () => {
      const f = TestBed.createComponent(StateHost);
      f.componentInstance.state = state;
      f.detectChanges();
      expect(!!f.nativeElement.querySelector('article')).toBe(state === 'success');
    });
  }
});
