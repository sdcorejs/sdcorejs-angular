import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SdQuickAction } from './quick-action.component';

// ---------------------------------------------------------------------------
// Host helpers
// ---------------------------------------------------------------------------
// NOTE: source-code drift — remote added this spec using the OLD `isOpened`
// input + imperative open()/close() methods. Local refactor renamed the input
// to `opened` (signal input with booleanAttribute transform) and removed the
// imperative methods. Tests below are updated to match the CURRENT source API.

@Component({
  standalone: true,
  imports: [SdQuickAction],
  template: `
    <sd-quick-action [opened]="opened">
      <span sdMessage>Test message</span>
      <button sdAction>Action</button>
    </sd-quick-action>
  `,
})
class HostComponent {
  opened: '' | boolean | undefined | null = false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getComponent(fixture: ComponentFixture<HostComponent>): SdQuickAction {
  const de: DebugElement = fixture.debugElement.query(
    By.directive(SdQuickAction),
  );
  if (!de) throw new Error('SdQuickAction not found in fixture');
  return de.componentInstance as SdQuickAction;
}

function getHostEl(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return fixture.debugElement.query(By.directive(SdQuickAction))
    .nativeElement as HTMLElement;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SdQuickAction', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdQuickAction;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getComponent(fixture);
  });

  // -------------------------------------------------------------------------
  // Creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders the inner div with class c-quick-action', () => {
      const el = getHostEl(fixture);
      const inner = el.querySelector('div.c-quick-action') as HTMLElement;
      expect(inner).toBeTruthy();
    });

    it('projects [sdMessage] content into the left slot', () => {
      const el = getHostEl(fixture);
      expect(el.textContent).toContain('Test message');
    });

    it('projects [sdAction] content into the right slot', () => {
      const el = getHostEl(fixture);
      expect(el.textContent).toContain('Action');
    });
  });

  // -------------------------------------------------------------------------
  // Input: opened (signal input with booleanAttribute transform)
  // -------------------------------------------------------------------------

  describe('input: opened', () => {
    it('defaults opened() to false', () => {
      expect(component.opened()).toBeFalse();
    });

    it('adds .active class on inner div when opened is true', () => {
      host.opened = true;
      fixture.detectChanges();
      const inner = getHostEl(fixture).querySelector('div.c-quick-action') as HTMLElement;
      expect(inner.classList.contains('active')).toBeTrue();
    });

    it('removes .active class on inner div when opened is false', () => {
      host.opened = true;
      fixture.detectChanges();
      host.opened = false;
      fixture.detectChanges();
      const inner = getHostEl(fixture).querySelector('div.c-quick-action') as HTMLElement;
      expect(inner.classList.contains('active')).toBeFalse();
    });

    it('coerces empty string via booleanAttribute (bare attribute = true)', () => {
      // booleanAttribute treats '' as true (bare attribute presence)
      host.opened = '';
      fixture.detectChanges();
      expect(component.opened()).toBeTrue();
    });

    it('coerces null to false', () => {
      host.opened = null;
      fixture.detectChanges();
      expect(component.opened()).toBeFalse();
    });

    it('coerces undefined to false', () => {
      host.opened = undefined;
      fixture.detectChanges();
      expect(component.opened()).toBeFalse();
    });
  });
});
