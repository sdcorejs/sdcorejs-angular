import { TestBed } from '@angular/core/testing';
import { TaskDemoComponent } from './task-demo.component';

describe('TaskDemoComponent', () => {
  it('renders lifecycle, shared registry, polling and action examples', async () => {
    await TestBed.configureTestingModule({ imports: [TaskDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TaskDemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(element.querySelector('[data-shared-task-count]')?.textContent).toContain('2');
    expect(element.querySelectorAll('sd-job-progress')).toHaveSize(3);
    expect(fixture.componentInstance.pollLoadCount).toBe(1);

    fixture.componentInstance.releaseDuplicateLease();
    fixture.detectChanges();
    expect(fixture.componentInstance.sharedTask.subscriberCount()).toBe(1);
    fixture.destroy();
  });
});
