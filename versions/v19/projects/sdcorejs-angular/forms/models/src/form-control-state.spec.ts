import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { sdFormControlState } from './form-control-state';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: '',
})
class HostCmp {
  controlSig = signal<FormControl<string | null>>(new FormControl<string | null>(''));
  state = sdFormControlState(this.controlSig);
}

describe('sdFormControlState', () => {
  it('emits initial snapshot with disabled=false, invalid=false, value=""', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const snap = fixture.componentInstance.state();
    expect(snap.value).toBe('');
    expect(snap.disabled).toBe(false);
    expect(snap.invalid).toBe(false);
    expect(snap.touched).toBe(false);
  });

  it('reflects disabled state', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentInstance.controlSig().disable();
    fixture.detectChanges();
    expect(fixture.componentInstance.state().disabled).toBe(true);
  });

  it('reflects value changes', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentInstance.controlSig().setValue('hi');
    fixture.detectChanges();
    expect(fixture.componentInstance.state().value).toBe('hi');
  });

  it('only flags invalid after touched or dirty', () => {
    const fixture = TestBed.createComponent(HostCmp);
    const c = fixture.componentInstance.controlSig();
    c.setValidators(Validators.required);
    c.updateValueAndValidity();
    fixture.detectChanges();
    expect(fixture.componentInstance.state().invalid).toBe(false); // not touched yet

    c.markAsTouched();
    fixture.detectChanges();
    expect(fixture.componentInstance.state().invalid).toBe(true);
  });

  it('returns inert snapshot when control signal yields undefined', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentInstance.controlSig.set(undefined as unknown as FormControl<string | null>);
    fixture.detectChanges();
    expect(fixture.componentInstance.state()).toEqual({
      value: undefined, disabled: false, invalid: false, touched: false,
    });
  });

  it('stops tracking the old control after a swap', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const oldControl = fixture.componentInstance.controlSig();
    const newControl = new FormControl<string | null>('new');
    fixture.componentInstance.controlSig.set(newControl);
    fixture.detectChanges();
    // Mutate the old control — snapshot should NOT reflect it.
    oldControl.setValue('stale');
    fixture.detectChanges();
    expect(fixture.componentInstance.state().value).toBe('new');
  });
});
