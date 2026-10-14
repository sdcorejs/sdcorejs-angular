import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdEditorButtonDirective } from './editor-button.directive';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdButton, SdEditorButtonDirective],
  template: `
    <sd-button
      sdEditorButton="bold"
      title="Bold"
      [sdEditorPressed]="pressed"
      [sdEditorTabIndex]="tabIndex"
      [disabled]="disabled"
      (sdEditorActivate)="calls = calls + 1" />
  `,
})
class NativeButtonHost {
  pressed: boolean | 'mixed' = true;
  tabIndex = -1;
  disabled = false;
  calls = 0;
}

describe('editor native Core button adapter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NativeButtonHost, NoopAnimationsModule] }).compileComponents();
  });

  it('places toggle semantics and roving tabindex on the inner native button', async () => {
    const fixture = TestBed.createComponent(NativeButtonHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.tabIndex).toBe(-1);
    fixture.componentInstance.pressed = 'mixed';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('mixed');
    expect(fixture.nativeElement.querySelector('sd-button').getAttribute('aria-pressed')).toBeNull();
    fixture.destroy();
  });

  it('handles every deliberate native activation and respects disabled state', async () => {
    const fixture = TestBed.createComponent(NativeButtonHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    button.click();
    expect(fixture.componentInstance.calls).toBe(2);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    await fixture.whenStable();
    button.click();
    expect(fixture.componentInstance.calls).toBe(2);
    fixture.destroy();
  });

  it('detaches listeners when its view is destroyed', async () => {
    const fixture = TestBed.createComponent(NativeButtonHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const host = fixture.componentInstance;
    fixture.destroy();
    button.dispatchEvent(new MouseEvent('click'));
    expect(host.calls).toBe(0);
  });
});
