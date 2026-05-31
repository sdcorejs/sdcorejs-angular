import { SecurityContext } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DomSanitizer } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OPERATORS } from '@sdcorejs/utils/constants';

import { SdOperator } from './operator.component';

/** Unwrap a SafeHtml produced via bypassSecurityTrustHtml back to its raw string. */
function html(sanitizer: DomSanitizer, safe: unknown): string {
  return sanitizer.sanitize(SecurityContext.HTML, safe as any) ?? '';
}

describe('SdOperator', () => {
  let fixture: ComponentFixture<SdOperator>;
  let component: SdOperator;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdOperator, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SdOperator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('items()', () => {
    it('maps each allowed operator to value + svg icon + i18n display, preserving order', () => {
      fixture.componentRef.setInput('operators', ['CONTAIN', 'EQUAL']);
      fixture.detectChanges();
      const sanitizer = TestBed.inject(DomSanitizer);

      const items = component.items();
      expect(items.map((i) => i.value)).toEqual(['CONTAIN', 'EQUAL']);

      const containEntry = OPERATORS.find((o) => o.value === 'CONTAIN')!;
      expect(html(sanitizer, items[0].icon)).toContain('<svg');
      expect(html(sanitizer, items[0].icon)).toContain(containEntry.icon.slice(0, 12));
      expect(items[0].display).toBeTruthy();
    });

    it('skips operators not present in OPERATORS', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'NOT_A_REAL_OP' as any]);
      fixture.detectChanges();
      expect(component.items().map((i) => i.value)).toEqual(['EQUAL']);
    });
  });

  describe('currentIcon / currentLabel', () => {
    it('uses the selected operator icon + label', () => {
      fixture.componentRef.setInput('operators', ['EQUAL']);
      fixture.componentRef.setInput('model', 'EQUAL');
      fixture.detectChanges();
      const sanitizer = TestBed.inject(DomSanitizer);

      const equal = OPERATORS.find((o) => o.value === 'EQUAL')!;
      expect(html(sanitizer, component.currentIcon())).toContain(equal.icon.slice(0, 12));
      expect(component.currentLabel()).toBe(component.items()[0].display);
    });

    it('falls back to the funnel icon and empty label when model is undefined', () => {
      const sanitizer = TestBed.inject(DomSanitizer);
      expect(html(sanitizer, component.currentIcon())).toContain(SdOperator.FALLBACK_ICON.slice(0, 12));
      expect(component.currentLabel()).toBe('');
    });
  });

  describe('select()', () => {
    it('sets model and emits modelChange', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      const spy = jasmine.createSpy('modelChange');
      component.model.subscribe(spy);

      component.select('CONTAIN');

      expect(component.model()).toBe('CONTAIN');
      expect(spy).toHaveBeenCalledWith('CONTAIN');
    });
  });

  describe('trigger DOM', () => {
    it('renders the current icon svg inside the trigger button', () => {
      fixture.componentRef.setInput('operators', ['EQUAL']);
      fixture.componentRef.setInput('model', 'EQUAL');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('.c-op-trigger .c-op-icon svg');
      expect(svg).not.toBeNull();
    });

    it('disables the trigger button when [disabled] is set', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.c-op-trigger') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe('menu (opened)', () => {
    let overlayContainer: OverlayContainer;

    function openMenu(): HTMLElement {
      const trigger = fixture.nativeElement.querySelector('.c-op-trigger') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      overlayContainer = TestBed.inject(OverlayContainer);
      return overlayContainer.getContainerElement();
    }

    afterEach(() => {
      overlayContainer?.getContainerElement().remove();
    });

    it('lists exactly the allowed operators in order, each with label + code', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'NOT_EQUAL', 'CONTAIN']);
      fixture.detectChanges();

      const panel = openMenu();
      const rows = panel.querySelectorAll('.c-op-row');
      expect(rows.length).toBe(3);

      const codes = Array.from(panel.querySelectorAll('.c-op-code')).map((n) => n.textContent?.trim());
      expect(codes).toEqual(['EQUAL', 'NOT_EQUAL', 'CONTAIN']);
    });

    it('marks the row matching model as active', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      fixture.componentRef.setInput('model', 'CONTAIN');
      fixture.detectChanges();

      const panel = openMenu();
      const active = panel.querySelectorAll('.c-op-row.c-op-active');
      expect(active.length).toBe(1);
      expect(active[0].querySelector('.c-op-code')?.textContent?.trim()).toBe('CONTAIN');
    });

    it('clicking a row sets the model', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      fixture.detectChanges();

      const panel = openMenu();
      const rows = panel.querySelectorAll('.c-op-row');
      (rows[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.model()).toBe('CONTAIN');
    });
  });

  describe('open()', () => {
    it('opens the operator menu programmatically', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      fixture.detectChanges();

      component.open();
      fixture.detectChanges();

      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      expect(overlay.querySelectorAll('.c-op-row').length).toBe(2);
      overlay.remove();
    });
  });
});
