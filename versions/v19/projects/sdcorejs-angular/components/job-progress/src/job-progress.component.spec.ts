import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdTaskService } from '@sdcorejs/angular/services/task';
import { SdTaskState } from '@sdcorejs/angular/services/task';
import { SdJobProgress } from './job-progress.component';

@Component({
  standalone: true,
  imports: [SdJobProgress],
  template: `
    <sd-job-progress
      [taskId]="taskId()"
      [state]="state()"
      [mode]="mode()"
      [showActions]="showActions()"
      (sdCancel)="incrementCancelCount()"
      (sdRetry)="incrementRetryCount()" />
  `,
})
class HostComponent {
  readonly taskId = signal<string | undefined>(undefined);
  readonly state = signal<SdTaskState | undefined>({ id: 'direct', status: 'running', progress: 42, message: 'Processing rows' });
  readonly mode = signal<'bar' | 'compact' | 'details'>('bar');
  readonly showActions = signal(true);
  readonly cancelCount = signal(0);
  readonly retryCount = signal(0);

  incrementCancelCount(): void {
    this.cancelCount.update(value => value + 1);
  }

  incrementRetryCount(): void {
    this.retryCount.update(value => value + 1);
  }
}

describe('SdJobProgress', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let service: SdTaskService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    service = TestBed.inject(SdTaskService);
    fixture.detectChanges();
  });

  it('renders determinate progress with complete ARIA semantics', () => {
    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.getAttribute('aria-valuenow')).toBe('42');
    expect(progress.getAttribute('aria-label')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('42%');
  });

  it('renders indeterminate queued progress without aria-valuenow', () => {
    host.state.set({ id: 'direct', status: 'queued' });
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBeNull();
    expect(progress.getAttribute('data-indeterminate')).toBe('true');
  });

  it('renders all terminal states and exposes retry/cancel actions without backend wording', () => {
    host.state.set({ id: 'direct', status: 'failed', error: new Error('Archive rejected') });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Archive rejected');
    const retry = fixture.nativeElement.querySelector('[data-task-retry]') as HTMLButtonElement;
    retry.click();
    expect(host.retryCount()).toBe(1);

    host.state.set({ id: 'direct', status: 'cancelled' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-job-progress')?.getAttribute('data-status')).toBe('cancelled');

    host.state.set({ id: 'direct', status: 'succeeded', progress: 100 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-job-progress')?.getAttribute('data-status')).toBe('succeeded');
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('endpoint');
  });

  it('reads a live registry task by id and delegates cancel/retry actions to the service', async () => {
    const cancel = jasmine.createSpy('cancel').and.resolveTo(undefined);
    const ref = service.watch({
      id: 'registry-job',
      initialState: { id: 'registry-job', status: 'running', progress: 15 },
      source: { mode: 'manual', cancel },
    });
    host.state.set(undefined);
    host.taskId.set('registry-job');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('15');
    (fixture.nativeElement.querySelector('[data-task-cancel]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(host.cancelCount()).toBe(1);
    expect(ref.state().status).toBe('cancelled');
  });

  it('uses direct state and host actions consistently when taskId is also present', () => {
    service.watch({
      id: 'registry-job',
      initialState: { id: 'registry-job', status: 'running', progress: 15 },
      source: { mode: 'manual' },
    });
    const retry = spyOn(service, 'retry').and.callThrough();
    host.taskId.set('registry-job');
    host.state.set({ id: 'direct', status: 'failed', error: 'Direct failure' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-task-retry]') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();

    expect(host.retryCount()).toBe(1);
    expect(retry).not.toHaveBeenCalled();
  });

  it('supports bar, compact and details modes with details disclosed only in details mode', () => {
    const component = fixture.debugElement.query(By.directive(SdJobProgress)).componentInstance as SdJobProgress;
    expect(component.resolvedState()?.message).toBe('Processing rows');
    expect(fixture.nativeElement.querySelector('[data-task-details]')).toBeNull();

    host.mode.set('compact');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-job-progress')?.getAttribute('data-mode')).toBe('compact');

    host.mode.set('details');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-task-details]')?.textContent).toContain('Processing rows');
  });

  it('hides actions when showActions is false', () => {
    host.showActions.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-task-cancel]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-task-retry]')).toBeNull();
  });
});
