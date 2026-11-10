import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdScheduler, type SdSchedulerEvent, type SdSchedulerMoveRequest, type SdSchedulerOption } from '@sdcorejs/angular/components/scheduler';
import { demoTrips, demoVehicles, type TripDto, type VehicleDto } from './scheduler-demo.data';

@Component({
  selector: 'app-scheduler-vehicles-example',
  standalone: true,
  imports: [SdScheduler],
  templateUrl: './scheduler-vehicles.example.html',
  styleUrl: './scheduler-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerVehiclesExampleComponent {
  readonly resources = demoVehicles();
  readonly trips = signal<SdSchedulerEvent<TripDto>[]>(demoTrips());

  readonly option: SdSchedulerOption<TripDto, VehicleDto> = {
    dataSource: { onLoad: () => this.trips() },
    move: { onMove: request => this.#onMove(request) },
  };

  #onMove(request: SdSchedulerMoveRequest<TripDto, VehicleDto>): boolean {
    const { to } = request;
    this.trips.update(trips =>
      trips.map(trip => (trip.id === request.event.id ? { ...trip, start: to.start, end: to.end, allDay: to.allDay, resourceId: to.resourceId } : trip))
    );
    return true;
  }
}
