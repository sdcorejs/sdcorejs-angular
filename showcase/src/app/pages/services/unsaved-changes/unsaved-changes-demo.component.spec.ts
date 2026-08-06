import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UnsavedChangesDemoComponent } from './unsaved-changes-demo.component';

describe('UnsavedChangesDemoComponent', () => {
  it('renders registry, form, confirmation and close-hook examples', async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, UnsavedChangesDemoComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(UnsavedChangesDemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(element.querySelector('[data-registry-state]')?.textContent).toContain('any=false');
    expect(element.querySelector('[data-form-state]')?.textContent).toContain('Nguyễn An');
    expect(element.querySelector('[data-confirm-state]')?.textContent).toContain('Chưa xác nhận');
    expect(element.querySelector('sd-side-drawer')).not.toBeNull();
  });
});
