import { Component, DebugElement, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTab } from './tab.component';

// ---------------------------------------------------------------------------
// Host helpers
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdTab],
  template: `
    <sd-tab
      [label]="label"
      [icon]="icon"
      [badge]="badge"
      [disabled]="disabled"
      [closable]="closable"
      (close)="onClose()">
      <p class="tab-body">Body text</p>
    </sd-tab>
  `,
})
class HostComponent {
  label = 'Info';
  icon: string | null | undefined = undefined;
  badge: string | number | null | undefined = undefined;
  disabled: boolean | string = false;
  closable: boolean | string = false;
  closeCount = 0;
  onClose() {
    this.closeCount++;
  }
}

// Host without label — used to assert NG0950 throw
@Component({
  standalone: true,
  imports: [SdTab],
  template: `<sd-tab><p>nolabel</p></sd-tab>`,
})
class HostNoLabelComponent {}

function getSdTab(fixture: ComponentFixture<unknown>): SdTab {
  const de: DebugElement = fixture.debugElement.query(By.directive(SdTab));
  if (!de) throw new Error('SdTab not found in fixture');
  return de.componentInstance as SdTab;
}

// ---------------------------------------------------------------------------
// Suite: SdTab
// ---------------------------------------------------------------------------

describe('SdTab', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdTab;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getSdTab(fixture);
  });

  describe('creation', () => {
    it('creates the SdTab component', () => {
      expect(component).toBeTruthy();
    });

    it('renders the sd-tab host element', () => {
      const el = fixture.nativeElement.querySelector('sd-tab');
      expect(el).not.toBeNull();
    });
  });

  describe('required input: label', () => {
    it('reads the label signal value', () => {
      expect(component.label()).toBe('Info');
    });

    it('throws when label is read but not provided', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [HostNoLabelComponent, NoopAnimationsModule],
        })
        .compileComponents();
      const f = TestBed.createComponent(HostNoLabelComponent);
      f.detectChanges();
      const tab = f.debugElement.query(By.directive(SdTab)).componentInstance as SdTab;
      // required input throws on first read when no value was bound
      expect(() => tab.label()).toThrow();
    });
  });

  describe('optional inputs: defaults', () => {
    it('icon defaults to undefined', () => {
      expect(component.icon()).toBeUndefined();
    });

    it('badge defaults to undefined', () => {
      expect(component.badge()).toBeUndefined();
    });

    it('disabled defaults to false', () => {
      expect(component.disabled()).toBeFalse();
    });

    it('closable defaults to false', () => {
      expect(component.closable()).toBeFalse();
    });
  });

  describe('input coercion: disabled (booleanAttribute)', () => {
    it('accepts boolean true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(component.disabled()).toBeTrue();
    });

    it('coerces empty string to true', () => {
      host.disabled = '';
      fixture.detectChanges();
      expect(component.disabled()).toBeTrue();
    });

    it('coerces "false" string to true (per booleanAttribute semantics)', () => {
      // booleanAttribute treats any non-"false" string as true; "false" → false
      host.disabled = 'false';
      fixture.detectChanges();
      expect(component.disabled()).toBeFalse();
    });
  });

  describe('input coercion: closable (booleanAttribute)', () => {
    it('coerces empty string to true', () => {
      host.closable = '';
      fixture.detectChanges();
      expect(component.closable()).toBeTrue();
    });
  });

  describe('input: badge edge cases', () => {
    it('stores number 0 as-is (not coerced to falsy)', () => {
      host.badge = 0;
      fixture.detectChanges();
      expect(component.badge()).toBe(0);
    });

    it('stores string badge', () => {
      host.badge = 'NEW';
      fixture.detectChanges();
      expect(component.badge()).toBe('NEW');
    });

    it('stores null', () => {
      host.badge = null;
      fixture.detectChanges();
      expect(component.badge()).toBeNull();
    });
  });

  describe('input: icon', () => {
    it('stores icon name', () => {
      host.icon = 'info';
      fixture.detectChanges();
      expect(component.icon()).toBe('info');
    });
  });

  describe('output: close', () => {
    it('emits when close output is invoked', () => {
      component.close.emit();
      expect(host.closeCount).toBe(1);
    });
  });

  describe('bodyTpl viewChild', () => {
    it('resolves to a TemplateRef', () => {
      const tpl = component.bodyTpl();
      expect(tpl).toBeTruthy();
      expect(tpl instanceof TemplateRef).toBeTrue();
    });
  });
});
