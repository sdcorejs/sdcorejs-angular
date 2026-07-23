import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdTimeRange } from './time-range.component';
import { SdTimeRangeValue } from './time-range-value';

@Component({
  standalone: true,
  imports: [SdTimeRange],
  template: `<sd-time-range
    [form]="form"
    name="period"
    label="Working period"
    [required]="required"
    [allowOpenEnded]="allowOpenEnded"
    [clearable]="clearable"
    [viewed]="viewed"
    min="08:00"
    max="18:00"
    [step]="15"
    [(model)]="value"></sd-time-range>`,
})
class TimeRangeHostComponent {
  readonly form = new FormGroup({});
  required = false;
  allowOpenEnded = false;
  clearable = true;
  viewed: boolean | 'inline' = false;
  value: SdTimeRangeValue | null | undefined = undefined;
}

describe('SdTimeRange', () => {
  let fixture: ComponentFixture<TimeRangeHostComponent>;
  let host: TimeRangeHostComponent;
  let component: SdTimeRange;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimeRangeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeRangeHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(SdTimeRange)).componentInstance as SdTimeRange;
  });

  function typeEndpoint(index: 0 | 1, value: string): void {
    const inputs = fixture.nativeElement.querySelectorAll('sd-time input[matInput]') as NodeListOf<HTMLInputElement>;
    inputs[index].value = value;
    inputs[index].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('registers the aggregate range control with the parent form', () => {
    expect(host.form.get('period')).toBe(component.formControl);
  });

  it('writes canonical endpoint changes to one range model', () => {
    typeEndpoint(0, '8:15');
    typeEndpoint(1, '17:45');

    expect(host.value).toEqual({ from: '08:15', to: '17:45' });
  });

  it('keeps invalid endpoint text visible and makes the parent form invalid', () => {
    host.value = { from: '08:30', to: '17:30' };
    fixture.detectChanges();

    typeEndpoint(0, '25:10');

    const firstInput = fixture.nativeElement.querySelector('sd-time input[matInput]') as HTMLInputElement;
    expect(firstInput.value).toBe('25:10');
    expect(host.value).toEqual({ from: '08:30', to: '17:30' });
    expect(host.form.invalid).toBeTrue();
  });

  it('surfaces endpoint validation through the aggregate group state and message', () => {
    typeEndpoint(0, '25:10');

    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    const error = fixture.nativeElement.querySelector('.sd-time-range-error') as HTMLElement | null;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('data-invalid')).toBe('true');
    expect(group.getAttribute('data-error-message')).toBeTruthy();
    expect(error?.textContent?.trim()).toBeTruthy();
  });

  it('clears invalid endpoint text even when no valid range model exists', () => {
    typeEndpoint(0, '25:10');

    component.clear();
    fixture.detectChanges();

    const firstInput = fixture.nativeElement.querySelector('sd-time input[matInput]') as HTMLInputElement;
    expect(firstInput.value).toBe('');
    expect(host.form.valid).toBeTrue();
  });

  it('rejects a start time after the end time', () => {
    typeEndpoint(0, '17:00');
    typeEndpoint(1, '09:00');

    expect(component.formControl.hasError('range')).toBeTrue();
  });

  it('allows one missing endpoint only when open-ended mode is enabled', () => {
    typeEndpoint(0, '09:00');
    expect(component.formControl.hasError('incomplete')).toBeTrue();

    host.allowOpenEnded = true;
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();
  });

  it('requires both endpoints when required is enabled', () => {
    host.required = true;
    host.allowOpenEnded = true;
    fixture.detectChanges();
    typeEndpoint(0, '09:00');

    expect(component.formControl.hasError('required')).toBeTrue();
  });

  it('clears both endpoints to explicit null values', () => {
    host.value = { from: '09:00', to: '17:00' };
    fixture.detectChanges();

    component.clear();
    fixture.detectChanges();

    expect(host.value).toEqual({ from: null, to: null });
  });

  it('allows programmatic clear even when the clear affordance is hidden', () => {
    host.clearable = false;
    host.value = { from: '09:00', to: '17:00' };
    fixture.detectChanges();

    component.clear();
    fixture.detectChanges();

    expect(host.value).toEqual({ from: null, to: null });
  });

  it('renders a labelled accessible group with two endpoint inputs', () => {
    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    const inputs = group.querySelectorAll('input[matInput]');

    expect(group.getAttribute('aria-label')).toBe('Working period');
    expect(inputs.length).toBe(2);
    expect(inputs[0].getAttribute('aria-label')).toBeTruthy();
    expect(inputs[1].getAttribute('aria-label')).toBeTruthy();
    expect(inputs[0].getAttribute('aria-label')).not.toBe(inputs[1].getAttribute('aria-label'));
  });

  it('passes inline viewed policy to both endpoint controls', () => {
    host.viewed = 'inline';
    fixture.detectChanges();

    const endpoints = fixture.nativeElement.querySelectorAll('sd-time') as NodeListOf<HTMLElement>;
    expect(endpoints.length).toBe(2);
    expect(endpoints[0].classList).toContain('sd-bare');
    expect(endpoints[1].classList).toContain('sd-bare');
  });
});
