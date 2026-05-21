import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SdView } from './view.component';

// ---------------------------------------------------------------------------
// Host component (default usage)
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdView],
  template: `
    <sd-view [label]="label" [display]="display" [value]="value" [hyperlink]="hyperlink"></sd-view>
  `,
})
class HostComponent {
  label: string | null | undefined = undefined;
  display: string | null | undefined = 'test value';
  value: any = undefined;
  hyperlink: string | null | undefined = undefined;
}

// ---------------------------------------------------------------------------
// Host component with #sdLabel and #sdValue content projection
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdView],
  template: `
    <sd-view [display]="display">
      <ng-template #sdLabel>
        <span class="custom-label">Custom Label</span>
      </ng-template>
      <ng-template #sdValue let-d let-v="value">
        <span class="custom-value">{{ d }}-{{ v }}</span>
      </ng-template>
    </sd-view>
  `,
})
class HostWithTemplatesComponent {
  display: string | null | undefined = 'display-text';
  value: any = 'raw-value';
}

// ---------------------------------------------------------------------------
// Host component with [valueTemplate] input binding
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdView],
  template: `
    <ng-template #myValueTpl let-d>
      <span class="injected-value">{{ d }}</span>
    </ng-template>
    <sd-view [display]="display" [valueTemplate]="myValueTpl"></sd-view>
  `,
})
class HostWithValueTemplateInputComponent {
  @ViewChild('myValueTpl') myValueTpl!: TemplateRef<any>;
  display: string | null | undefined = 'injected-display';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSdView(fixture: ComponentFixture<any>): SdView {
  const de = fixture.debugElement.query(By.directive(SdView));
  if (!de) throw new Error('SdView not found in fixture');
  return de.componentInstance as SdView;
}

function getHostEl(fixture: ComponentFixture<any>): HTMLElement {
  return fixture.debugElement.query(By.directive(SdView)).nativeElement as HTMLElement;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SdView', () => {
  // -------------------------------------------------------------------------
  // Default suite (HostComponent)
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates the component', () => {
      expect(getSdView(fixture)).toBeTruthy();
    });

    it('renders the host element sd-view in the DOM', () => {
      const el = fixture.nativeElement.querySelector('sd-view');
      expect(el).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Value display
  // -------------------------------------------------------------------------

  describe('value display', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders display text inside T14M div', () => {
      host.display = 'Hello World';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      const div = el.querySelector('div.T14M') as HTMLElement;
      expect(div).not.toBeNull();
      expect(div.textContent?.trim()).toBe('Hello World');
    });

    it('renders "--" placeholder when display is null (via sdEmpty pipe)', () => {
      host.display = null;
      fixture.detectChanges();
      const el = getHostEl(fixture);
      const div = el.querySelector('div.T14M') as HTMLElement;
      expect(div.textContent?.trim()).toBe('--');
    });

    it('renders "--" placeholder when display is empty string (via sdEmpty pipe)', () => {
      host.display = '';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      const div = el.querySelector('div.T14M') as HTMLElement;
      expect(div.textContent?.trim()).toBe('--');
    });

    it('renders hyperlink anchor when hyperlink input is set', () => {
      host.display = 'Click me';
      host.hyperlink = '/some/path';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      const anchor = el.querySelector('a') as HTMLAnchorElement;
      expect(anchor).not.toBeNull();
      expect(anchor.textContent?.trim()).toBe('Click me');
    });

    it('does NOT render anchor when hyperlink is not set', () => {
      host.display = 'Plain text';
      host.hyperlink = undefined;
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.querySelector('a')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Input: label
  // -------------------------------------------------------------------------

  describe('input: label', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders label text in T14R div when label is provided', () => {
      host.label = 'Mã nhân viên';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      const labelDiv = el.querySelector('div.T14R') as HTMLElement;
      expect(labelDiv).not.toBeNull();
      expect(labelDiv.textContent?.trim()).toBe('Mã nhân viên');
    });

    it('does NOT render label div when label is null', () => {
      host.label = null;
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.querySelector('div.T14R')).toBeNull();
    });

    it('does NOT render label div when label is undefined', () => {
      host.label = undefined;
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.querySelector('div.T14R')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Content projection: #sdLabel and #sdValue
  // -------------------------------------------------------------------------

  describe('content projection via #sdLabel and #sdValue', () => {
    let fixture: ComponentFixture<HostWithTemplatesComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithTemplatesComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithTemplatesComponent);
      fixture.detectChanges();
    });

    it('renders custom label via #sdLabel content template', () => {
      const el = getHostEl(fixture);
      const span = el.querySelector('span.custom-label') as HTMLElement;
      expect(span).not.toBeNull();
      expect(span.textContent?.trim()).toBe('Custom Label');
    });

    it('renders custom value via #sdValue content template with $implicit context', () => {
      const el = getHostEl(fixture);
      const span = el.querySelector('span.custom-value') as HTMLElement;
      expect(span).not.toBeNull();
      expect(span.textContent?.trim()).toContain('display-text');
    });

    it('does NOT render default T14M div when #sdValue is provided', () => {
      const el = getHostEl(fixture);
      expect(el.querySelector('div.T14M')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Input: [valueTemplate] wins over content #sdValue
  // -------------------------------------------------------------------------

  describe('input: [valueTemplate] takes priority over content #sdValue', () => {
    let fixture: ComponentFixture<HostWithValueTemplateInputComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithValueTemplateInputComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithValueTemplateInputComponent);
      fixture.detectChanges();
    });

    it('renders value from [valueTemplate] input binding', () => {
      const el = getHostEl(fixture);
      const span = el.querySelector('span.injected-value') as HTMLElement;
      expect(span).not.toBeNull();
      expect(span.textContent?.trim()).toBe('injected-display');
    });
  });
});
