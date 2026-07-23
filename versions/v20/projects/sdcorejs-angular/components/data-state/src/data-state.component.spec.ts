import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdDataState, SdDataStateKind, SdDataStateTemplateDirective } from './data-state.component';

describe('SdDataState', () => {
  let fixture: ComponentFixture<SdDataState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdDataState] }).compileComponents();
    fixture = TestBed.createComponent(SdDataState);
  });

  (['loading', 'empty', 'error', 'forbidden'] as const).forEach(state => {
    it(`renders the default ${state} presentation with accessible state metadata`, () => {
      fixture.componentRef.setInput('state', state);
      fixture.detectChanges();

      const root = fixture.nativeElement.querySelector(`[data-state="${state}"]`) as HTMLElement;
      expect(root).not.toBeNull();
      expect(root.querySelector('.sd-data-state__title')?.textContent?.trim()).not.toBe('');
      expect(root.querySelector('sd-icon')).not.toBeNull();
      expect(root.getAttribute('role')).toBe(state === 'error' || state === 'forbidden' ? 'alert' : 'status');
      expect(root.getAttribute('aria-busy')).toBe(state === 'loading' ? 'true' : null);
    });
  });

  it('emits retry and action events from native buttons', () => {
    let retries = 0;
    let actions = 0;
    fixture.componentRef.setInput('state', 'error');
    fixture.componentRef.setInput('retryable', true);
    fixture.componentRef.setInput('actionLabel', 'Open logs');
    fixture.componentInstance.sdRetry.subscribe(() => (retries += 1));
    fixture.componentInstance.sdAction.subscribe(() => (actions += 1));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-state-retry]') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('[data-state-action]') as HTMLButtonElement).click();

    expect(retries).toBe(1);
    expect(actions).toBe(1);
  });

  it('applies compact and full-page presentation modes', () => {
    fixture.componentRef.setInput('state', 'empty');
    fixture.componentRef.setInput('compact', true);
    fixture.componentRef.setInput('fullPage', true);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('[data-state="empty"]') as HTMLElement;
    expect(root.classList).toContain('sd-data-state--compact');
    expect(root.classList).toContain('sd-data-state--full-page');
  });

  it('preserves intentional empty title and message overrides', () => {
    fixture.componentRef.setInput('state', 'empty');
    fixture.componentRef.setInput('title', '');
    fixture.componentRef.setInput('message', '');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sd-data-state__title')?.textContent).toBe('');
    expect(fixture.nativeElement.querySelector('.sd-data-state__message')?.textContent).toBe('');
  });
});

@Component({
  standalone: true,
  imports: [SdDataState, SdDataStateTemplateDirective],
  template: `
    <sd-data-state [state]="state">
      <ng-template sdDataStateTemplate let-current let-retry="retry">
        <button class="custom-state" type="button" (click)="retry()">Custom {{ current }}</button>
      </ng-template>
    </sd-data-state>
  `,
})
class DataStateTemplateHost {
  state: SdDataStateKind = 'error';
}

describe('SdDataState custom templates', () => {
  it('provides state and retry context to the custom template', async () => {
    await TestBed.configureTestingModule({ imports: [DataStateTemplateHost] }).compileComponents();
    const fixture = TestBed.createComponent(DataStateTemplateHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.custom-state')?.textContent).toContain('Custom error');
  });
});

@Component({
  standalone: true,
  imports: [SdDataState],
  template: `<sd-data-state state="success"><article data-success>Loaded content</article></sd-data-state>`,
})
class DataStateSuccessHost {}

describe('SdDataState success projection', () => {
  it('projects successful content without an extra presentation wrapper', async () => {
    await TestBed.configureTestingModule({ imports: [DataStateSuccessHost] }).compileComponents();
    const fixture = TestBed.createComponent(DataStateSuccessHost);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('sd-data-state') as HTMLElement;
    expect(host.querySelector('[data-success]')?.textContent).toContain('Loaded content');
    expect(host.querySelector('.sd-data-state')).toBeNull();
  });
});
