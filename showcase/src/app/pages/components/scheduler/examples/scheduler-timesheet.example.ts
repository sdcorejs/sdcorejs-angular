import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SdScheduler,
  SdSchedulerCellTemplateDirective,
  SdSchedulerResourceTemplateDirective,
  type SdSchedulerCellSelect,
  type SdSchedulerEvent,
  type SdSchedulerOption,
} from '@sdcorejs/angular/components/scheduler';
import { demoShifts, demoStaff, type PersonDto, type ShiftDto } from './scheduler-demo.data';

@Component({
  selector: 'app-scheduler-timesheet-example',
  standalone: true,
  imports: [SdScheduler, SdSchedulerCellTemplateDirective, SdSchedulerResourceTemplateDirective],
  templateUrl: './scheduler-timesheet.example.html',
  styleUrl: './scheduler-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerTimesheetExampleComponent {
  readonly staff = demoStaff();
  readonly shifts = demoShifts();
  /** Days worked per person for the total column of the resource template. */
  readonly totals = new Map(this.staff.map(person => [person.id, this.shifts.filter(shift => shift.resourceId === person.id && shift.data?.code !== 'P').length]));
  readonly option: SdSchedulerOption<ShiftDto, PersonDto> = { dataSource: { onLoad: () => this.shifts } };
  readonly picked = signal<string | null>(null);

  codeOf(events: readonly SdSchedulerEvent<unknown>[]): string {
    return (events[0]?.data as ShiftDto | undefined)?.code ?? '';
  }

  pick(cell: SdSchedulerCellSelect<ShiftDto, PersonDto>): void {
    this.picked.set(`${cell.resource.title} · ${cell.date} · ${this.codeOf(cell.events)}`);
  }
}
