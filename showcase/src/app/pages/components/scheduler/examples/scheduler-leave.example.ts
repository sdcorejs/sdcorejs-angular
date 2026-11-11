import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdScheduler, type SdSchedulerEvent, type SdSchedulerMoveRequest, type SdSchedulerOption } from '@sdcorejs/angular/components/scheduler';
import { demoLeaves, demoPeople, type LeaveDto, type PersonDto } from './scheduler-demo.data';

@Component({
  selector: 'app-scheduler-leave-example',
  standalone: true,
  imports: [SdScheduler],
  templateUrl: './scheduler-leave.example.html',
  styleUrl: './scheduler-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerLeaveExampleComponent {
  readonly people = demoPeople();
  readonly leaves = signal<SdSchedulerEvent<LeaveDto>[]>(demoLeaves());

  readonly option: SdSchedulerOption<LeaveDto, PersonDto> = {
    dataSource: { onLoad: () => this.leaves() },
    // A leave belongs to one person: it moves along the days only.
    move: { axis: 'time', onMove: request => this.#onMove(request) },
  };

  #onMove(request: SdSchedulerMoveRequest<LeaveDto, PersonDto>): boolean {
    const { to } = request;
    this.leaves.update(leaves => leaves.map(leave => (leave.id === request.event.id ? { ...leave, start: to.start, end: to.end } : leave)));
    return true;
  }
}
