import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from './inform.component';
describe('Inform presentation refresh', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdInform, NoopAnimationsModule] }));
  it('keeps one native action button and emits its event once', () => {
    const f = TestBed.createComponent(SdInform);
    f.componentRef.setInput('actionLabel', 'Thử lại');
    f.detectChanges();
    const seen = jasmine.createSpy('action');
    f.componentInstance.sdAction.subscribe(seen);
    const action = f.debugElement.query(By.directive(SdButton));
    expect(action).not.toBeNull();
    if (!action) return;
    expect(action.componentInstance.size()).toBe('sm');
    const button = action.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
    button.click();
    expect(seen).toHaveBeenCalledTimes(1);
  });
  it('uses a decorative tile with fallback for a blank custom icon', () => {
    const f = TestBed.createComponent(SdInform);
    f.componentRef.setInput('icon', '  ');
    f.detectChanges();
    expect(f.componentInstance.effectiveIcon()).toBe('info');
    expect(f.nativeElement.querySelector('.c-inform-icon-tile')?.getAttribute('aria-hidden')).toBe('true');
    f.componentRef.setInput('hideIcon', true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.c-inform-icon-tile')).toBeNull();
  });
});
