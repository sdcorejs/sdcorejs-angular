import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntityPickerDemoComponent } from './entity-picker-demo.component';

describe('EntityPickerDemoComponent', () => {
  it('renders server, hydration, template and error/create examples', async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, EntityPickerDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(EntityPickerDemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(element.querySelectorAll('sd-entity-picker')).toHaveSize(4);
    expect(element.textContent).toContain('2 nhân viên · keys 1, 42');
    expect(element.querySelector('[data-add-count]')?.textContent).toContain('0');
  });
});
