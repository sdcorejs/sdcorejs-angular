import { TestBed } from '@angular/core/testing';
import { JobProgressDemoComponent } from './job-progress-demo.component';

describe('JobProgressDemoComponent', () => {
  it('renders determinate, indeterminate, details and registry examples', async () => {
    await TestBed.configureTestingModule({ imports: [JobProgressDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(JobProgressDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(element.querySelectorAll('sd-job-progress')).toHaveSize(4);
    expect(element.querySelector('[data-indeterminate="true"]')).not.toBeNull();
    expect(element.querySelector('[data-task-details]')?.textContent).toContain('context');
    fixture.destroy();
  });
});
