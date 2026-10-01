import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { resolveSdIconConfig, SD_ICON_CONFIGURATION, type SdIconShape } from '@sdcorejs/angular/modules/icon';
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

  it('emits retry and action once through small SdButton controls without submitting a form', () => {
    let retries = 0;
    let actions = 0;
    fixture.componentRef.setInput('state', 'error');
    fixture.componentRef.setInput('retryable', true);
    fixture.componentRef.setInput('actionLabel', 'Open logs');
    fixture.componentInstance.sdRetry.subscribe(() => (retries += 1));
    fixture.componentInstance.sdAction.subscribe(() => (actions += 1));
    fixture.detectChanges();

    for (const selector of ['sd-button[data-state-retry] button', 'sd-button[data-state-action] button']) {
      const button = fixture.nativeElement.querySelector(selector) as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.type).toBe('button');
      button.click();
    }

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
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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

describe('SdDataState icon shape', () => {
  const STATES: SdDataStateKind[] = ['loading', 'empty', 'error', 'forbidden'];

  function create(defaultShape?: SdIconShape): ComponentFixture<SdDataState> {
    TestBed.configureTestingModule({
      imports: [SdDataState],
      providers: defaultShape ? [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultShape }) }] : [],
    });
    const fixture = TestBed.createComponent(SdDataState);
    // why: the isolated test runner does not load the app-level theme, so give every state a visible background.
    const host = fixture.nativeElement as HTMLElement;
    host.style.setProperty('--sd-surface-muted', 'rgb(11, 20, 30)');
    host.style.setProperty('--sd-error-light', 'rgb(12, 20, 30)');
    host.style.setProperty('--sd-primary-light', 'rgb(13, 20, 30)');
    fixture.componentRef.setInput('state', 'empty');
    fixture.detectChanges();
    return fixture;
  }

  const symbol = (fixture: ComponentFixture<SdDataState>) =>
    (fixture.nativeElement as HTMLElement).querySelector('.sd-data-state__symbol') as HTMLElement;

  it('follows square default, app default and instance input in both layouts', () => {
    for (const compact of [false, true]) {
      TestBed.resetTestingModule();
      const plain = create();
      plain.componentRef.setInput('compact', compact);
      plain.detectChanges();
      expect(symbol(plain).getAttribute('data-icon-shape')).withContext(`compact=${compact}`).toBe('square');

      TestBed.resetTestingModule();
      const configured = create('circle');
      configured.componentRef.setInput('compact', compact);
      configured.detectChanges();
      expect(symbol(configured).getAttribute('data-icon-shape')).withContext(`compact=${compact}`).toBe('circle');
      configured.componentRef.setInput('iconShape', 'none');
      configured.detectChanges();
      expect(symbol(configured).getAttribute('data-icon-shape')).withContext(`compact=${compact}`).toBe('none');
    }
  });

  it('renders square with an 8px radius that the token can change', () => {
    const fixture = create();
    expect(getComputedStyle(symbol(fixture)).borderTopLeftRadius).toBe('8px');
    expect(getComputedStyle(symbol(fixture)).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    (fixture.nativeElement as HTMLElement).style.setProperty('--sd-icon-shape-radius', '4px');
    expect(getComputedStyle(symbol(fixture)).borderTopLeftRadius).toBe('4px');
  });

  it('renders circle like before and none without a background at the same size, for every state', () => {
    const fixture = create();
    for (const compact of [false, true]) {
      fixture.componentRef.setInput('compact', compact);
      for (const state of STATES) {
        const context = `${state} compact=${compact}`;
        fixture.componentRef.setInput('state', state);
        fixture.componentRef.setInput('iconShape', 'square');
        fixture.detectChanges();
        const squareBackground = getComputedStyle(symbol(fixture)).backgroundColor;
        const squareSize = [getComputedStyle(symbol(fixture)).width, getComputedStyle(symbol(fixture)).height];

        fixture.componentRef.setInput('iconShape', 'circle');
        fixture.detectChanges();
        expect(getComputedStyle(symbol(fixture)).borderTopLeftRadius)
          .withContext(context)
          .toBe('50%');
        expect(getComputedStyle(symbol(fixture)).backgroundColor)
          .withContext(context)
          .toBe(squareBackground);

        fixture.componentRef.setInput('iconShape', 'none');
        fixture.detectChanges();
        expect(getComputedStyle(symbol(fixture)).backgroundColor)
          .withContext(context)
          .toBe('rgba(0, 0, 0, 0)');
        expect([getComputedStyle(symbol(fixture)).width, getComputedStyle(symbol(fixture)).height])
          .withContext(context)
          .toEqual(squareSize);
      }
    }
  });
});
