import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, DebugElement, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdStep } from './step.component';
import { SdStepper } from './stepper.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdStepper, SdStep, FormsModule, ReactiveFormsModule],
  template: `
    <sd-stepper
      [(selectedIndex)]="selectedIndex"
      [linear]="linear"
      [orientation]="orientation"
      [labelPosition]="labelPosition"
      [color]="color"
      [autoId]="autoId"
      (selectionChange)="onSelectionChange($event)">
      @for (s of stepDefs(); track s.id) {
        <sd-step
          [label]="s.label"
          [icon]="s.icon ?? ''"
          [optional]="s.optional ?? false"
          [editable]="s.editable ?? true"
          [stepControl]="s.ctrl ?? undefined">
          <div class="step-content" [attr.data-step]="s.id">Content {{ s.id }}</div>
        </sd-step>
      }
    </sd-stepper>
  `,
})
class HostComponent {
  @ViewChild(SdStepper) stepper!: SdStepper;

  ctrl1 = new FormControl('', Validators.required);
  ctrl2 = new FormControl('', Validators.required);

  stepDefs = signal<
    {
      id: string;
      label: string;
      icon?: string;
      optional?: boolean;
      editable?: boolean;
      ctrl?: FormControl | null;
    }[]
  >([
    { id: 'a', label: 'Bước 1', ctrl: this.ctrl1 },
    { id: 'b', label: 'Bước 2', ctrl: this.ctrl2 },
    { id: 'c', label: 'Hoàn tất' },
  ]);

  selectedIndex = 0;
  linear = false;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  labelPosition: 'end' | 'bottom' = 'end';
  color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'primary';
  autoId: string | undefined = undefined;
  changes: unknown[] = [];

  onSelectionChange(ev: unknown) {
    this.changes.push(ev);
  }
}

function getStepper(fixture: ComponentFixture<HostComponent>): SdStepper {
  return fixture.componentInstance.stepper;
}

function getHostEl(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return fixture.debugElement.query(By.directive(SdStepper)).nativeElement as HTMLElement;
}

function getMatStepper(fixture: ComponentFixture<HostComponent>): MatStepper {
  const de: DebugElement = fixture.debugElement.query(By.directive(MatStepper));
  if (!de) throw new Error('MatStepper not found');
  return de.componentInstance as MatStepper;
}

function getHeaders(fixture: ComponentFixture<HostComponent>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.mat-step-header')) as HTMLElement[];
}

describe('SdStepper', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let stepper: SdStepper;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    stepper = getStepper(fixture);
  });

  describe('creation & discovery', () => {
    it('creates SdStepper', () => {
      expect(stepper).toBeTruthy();
    });

    it('discovers projected <sd-step> via contentChildren', () => {
      expect(stepper.steps().length).toBe(3);
    });

    it('renders 3 mat-step-header elements', () => {
      expect(getHeaders(fixture).length).toBe(3);
    });

    it('renders labels for each step', () => {
      const labels = (Array.from(fixture.nativeElement.querySelectorAll('.sd-step__text')) as Element[]).map(el => el.textContent?.trim());
      expect(labels).toEqual(['Bước 1', 'Bước 2', 'Hoàn tất']);
    });
  });

  describe('selectedIndex two-way + goTo clamping', () => {
    it('defaults to 0', () => {
      expect(stepper.selectedIndex()).toBe(0);
    });

    it('forwards selectedIndex to MatStepper', () => {
      host.selectedIndex = 1;
      fixture.detectChanges();
      expect(getMatStepper(fixture).selectedIndex).toBe(1);
    });

    it('goTo(2) sets selectedIndex', () => {
      stepper.goTo(2);
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(2);
    });

    it('goTo clamps negative input to 0', () => {
      stepper.goTo(-5);
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(0);
    });

    it('goTo clamps over-range to last', () => {
      stepper.goTo(99);
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(2);
    });

    it('clamps selectedIndex when last step removed', fakeAsync(() => {
      stepper.goTo(2);
      fixture.detectChanges();
      flush();
      host.stepDefs.update(arr => arr.slice(0, 2));
      fixture.detectChanges();
      flush();
      expect(stepper.selectedIndex()).toBe(1);
    }));
  });

  describe('layout input forwarding', () => {
    it('defaults orientation horizontal', () => {
      expect(getMatStepper(fixture).orientation).toBe('horizontal');
    });

    it('forwards orientation vertical', () => {
      host.orientation = 'vertical';
      fixture.detectChanges();
      expect(getMatStepper(fixture).orientation).toBe('vertical');
    });

    it('forwards labelPosition', () => {
      host.labelPosition = 'bottom';
      fixture.detectChanges();
      expect(getMatStepper(fixture).labelPosition).toBe('bottom');
    });
  });

  describe('linear mode + stepControl gating', () => {
    beforeEach(() => {
      host.linear = true;
      fixture.detectChanges();
    });

    it('forwards linear to mat-stepper', () => {
      expect(getMatStepper(fixture).linear).toBeTrue();
    });

    it('does NOT advance past a step whose control is invalid', () => {
      // ctrl1 starts empty + required → invalid
      stepper.next();
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(0);
    });

    it('advances when step control becomes valid', () => {
      host.ctrl1.setValue('hoang');
      fixture.detectChanges();
      stepper.next();
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(1);
    });
  });

  describe('next / previous / reset', () => {
    it('next() moves to next step', () => {
      stepper.next();
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(1);
    });

    it('previous() moves to previous step', () => {
      stepper.goTo(2);
      fixture.detectChanges();
      stepper.previous();
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(1);
    });

    it('reset() returns to step 0', () => {
      stepper.goTo(2);
      fixture.detectChanges();
      stepper.reset();
      fixture.detectChanges();
      expect(stepper.selectedIndex()).toBe(0);
    });
  });

  describe('selectionChange output', () => {
    it('emits when user clicks a different header', () => {
      const headers = getHeaders(fixture);
      headers[1].click();
      fixture.detectChanges();
      expect(host.changes.length).toBeGreaterThan(0);
    });

    it('emits when goTo is called programmatically', fakeAsync(() => {
      stepper.goTo(1);
      fixture.detectChanges();
      flush();
      expect(host.changes.length).toBeGreaterThan(0);
    }));
  });

  describe('color', () => {
    it('uses a round filled active indicator and aligned connectors with bottom labels', () => {
      host.labelPosition = 'bottom';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      el.style.setProperty('--sd-primary', '#005cbb');
      el.style.setProperty('--sd-primary-light', '#d7e3ff');
      el.style.setProperty('--sd-primary-contrast', '#ffffff');
      const headers = el.querySelectorAll<HTMLElement>('.mat-horizontal-stepper-header');
      const selected = el.querySelector('.mat-step-icon-selected')!;
      expect(getComputedStyle(el.querySelector('.mat-step-label-selected .mat-step-text-label')!).fontWeight).toBe('600');
      expect(getComputedStyle(selected).backgroundColor).toBe('rgb(0, 92, 187)');
      expect(getComputedStyle(selected).color).toBe('rgb(255, 255, 255)');
      el.querySelectorAll('.mat-step-icon').forEach(icon => expect(getComputedStyle(icon).borderRadius).toBe('50%'));
      const line = el.querySelector<HTMLElement>('.mat-stepper-horizontal-line')!;
      for (const [header, pseudo] of [
        [headers[0], '::after'],
        [headers[1], '::before'],
      ] as const) {
        const style = getComputedStyle(header, pseudo);
        expect(style.borderTopColor).toBe(getComputedStyle(line).borderTopColor);
        const iconRect = header.querySelector('.mat-step-icon')!.getBoundingClientRect();
        const center = iconRect.top + iconRect.height / 2;
        expect(Math.abs(header.getBoundingClientRect().top + parseFloat(style.top) - center)).toBeLessThanOrEqual(1);
        expect(Math.abs(line.getBoundingClientRect().top - center)).toBeLessThanOrEqual(1);
      }
    });
    it('keeps completed steps light, prioritizes active on revisit, and preserves error colors', () => {
      const el = getHostEl(fixture);
      el.style.setProperty('--sd-primary', '#005cbb');
      el.style.setProperty('--sd-primary-light', '#d7e3ff');
      el.style.setProperty('--sd-primary-contrast', '#ffffff');
      el.style.setProperty('--sd-error', '#ba1a1a');
      el.style.setProperty('--sd-error-light', '#ffdad6');
      host.ctrl1.setValue('valid');
      stepper.next();
      fixture.detectChanges();
      const completed = el.querySelector('.mat-step-icon-state-edit')!;
      expect(completed).toBeTruthy();
      expect(getComputedStyle(completed).backgroundColor).toBe('rgb(215, 227, 255)');
      stepper.previous();
      fixture.detectChanges();
      const active = el.querySelector('.mat-step-icon-selected')!;
      expect(getComputedStyle(active).backgroundColor).toBe('rgb(0, 92, 187)');
      expect(getComputedStyle(active).color).toBe('rgb(255, 255, 255)');
      // Exercise overlapping Material state classes to guard the cascade priority.
      active.classList.add('mat-step-icon-state-edit');
      expect(getComputedStyle(active).backgroundColor).toBe('rgb(0, 92, 187)');
      active.classList.add('mat-step-icon-state-error');
      expect(getComputedStyle(active).backgroundColor).toBe('rgb(255, 218, 214)');
      expect(getComputedStyle(active).color).toBe('rgb(186, 26, 26)');
    });
    it('defaults color CSS vars to primary', () => {
      const el = getHostEl(fixture);
      expect(el.style.getPropertyValue('--sd-stepper-active-color')).toBe('var(--sd-primary)');
      expect(el.style.getPropertyValue('--sd-stepper-active-bg')).toBe('var(--sd-primary)');
      expect(el.style.getPropertyValue('--sd-stepper-completed-color')).toBe('var(--sd-primary)');
      expect(el.style.getPropertyValue('--sd-stepper-line-active-color')).toBe('var(--sd-primary)');
    });

    it('switches CSS vars on color change', () => {
      host.color = 'success';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.style.getPropertyValue('--sd-stepper-active-color')).toBe('var(--sd-success)');
    });

    it('supports each Core palette value', () => {
      const colors: ('primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error')[] = [
        'primary',
        'secondary',
        'info',
        'success',
        'warning',
        'error',
      ];
      const el = getHostEl(fixture);
      for (const c of colors) {
        host.color = c;
        fixture.detectChanges();
        expect(el.style.getPropertyValue('--sd-stepper-active-color')).toBe(`var(--sd-${c})`);
        expect(el.style.getPropertyValue('--sd-stepper-active-contrast')).toBe(`var(--sd-${c}-contrast)`);
        expect(el.style.getPropertyValue('--sd-stepper-completed-bg')).toBe(`var(--sd-${c}-light)`);
      }
    });
  });

  describe('autoId', () => {
    it('does not set data-autoId when undefined', () => {
      const el = getHostEl(fixture);
      expect(el.getAttribute('data-autoId')).toBeNull();
    });

    it('sets data-autoId on host when provided', () => {
      host.autoId = 'wizard';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.getAttribute('data-autoId')).toBe('wizard');
    });
  });
});
