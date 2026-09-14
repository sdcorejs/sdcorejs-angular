import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckbox } from '@angular/material/checkbox';
import { Size } from '@sdcorejs/utils/models';
import { SdCheckbox } from '../index';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdCheckbox],
  template: `<sd-checkbox [size]="size" label="Accept" [(model)]="checked" (sdChange)="changes.push($event)" />`,
})
class SizeHost {
  size: Size = 'md';
  checked = true;
  changes: unknown[] = [];
}

describe('SdCheckbox size', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SizeHost, NoopAnimationsModule] }));

  it('defaults to md without an input binding', () => {
    const fixture = TestBed.createComponent(SdCheckbox);
    fixture.detectChanges();
    expect(fixture.componentInstance.size()).toBe('md');
    expect(fixture.nativeElement.getAttribute('data-size')).toBe('md');
  });

  it('resizes the box, icons and label gap without emitting or resetting Material state', () => {
    const fixture = TestBed.createComponent(SizeHost);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(SdCheckbox)).componentInstance as SdCheckbox;
    const material = fixture.debugElement.query(By.directive(MatCheckbox)).componentInstance as MatCheckbox;
    const element = fixture.nativeElement as HTMLElement;
    const rect = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
    material.indeterminate = true;
    control.formControl.markAsTouched();
    control.formControl.setErrors({ custom: true });
    for (const [size, box, layer, gap] of [
      ['sm', 14, 32, 2],
      ['md', 18, 40, 4],
      ['lg', 22, 48, 6],
    ] as const) {
      fixture.componentInstance.size = size;
      fixture.detectChanges();
      expect(element.querySelector('sd-checkbox')!.getAttribute('data-size')).toBe(size);
      expect(rect('.mdc-checkbox__background').width).toBe(box);
      expect(rect('.mdc-checkbox__background').height).toBe(box);
      // why: Material xoay checkmark 45deg khi indeterminate; đo width trước transform.
      expect(getComputedStyle(element.querySelector('.mdc-checkbox__checkmark')!).width).toBe(`${box - 4}px`);
      expect(rect('.mdc-checkbox__mixedmark').width).toBe(box - 4);
      expect(rect('.mdc-checkbox').width).toBe(layer);
      expect(rect('.mdc-checkbox__native-control').height).toBe(layer);
      expect(rect('.mat-mdc-checkbox-touch-target').height).toBeGreaterThanOrEqual(44);
      expect(getComputedStyle(element.querySelector('.mdc-label')!).paddingInlineStart).toBe(`${gap}px`);
      expect(material.indeterminate).toBeTrue();
      expect(material.checked).toBeTrue();
      expect(control.formControl.touched).toBeTrue();
      expect(control.formControl.hasError('custom')).toBeTrue();
    }
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  for (const size of ['sm', 'md', 'lg'] as const) {
    it(`preserves label interaction, binding and disabled behavior at ${size}`, () => {
      const fixture = TestBed.createComponent(SizeHost);
      fixture.componentInstance.size = size;
      fixture.detectChanges();
      const control = fixture.debugElement.query(By.directive(SdCheckbox)).componentInstance as SdCheckbox;
      const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
      label.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.checked).toBeFalse();
      expect(fixture.componentInstance.changes).toEqual([false]);
      control.formControl.disable();
      fixture.detectChanges();
      label.click();
      expect(fixture.componentInstance.changes).toEqual([false]);
    });
  }
});
