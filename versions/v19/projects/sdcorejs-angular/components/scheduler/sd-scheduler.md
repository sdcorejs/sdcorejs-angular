# `<sd-scheduler>`

Resource scheduler: one row per resource (a room, a vehicle, a person), the day on an hour axis or a week or a month on a day axis. It reuses the model, the configuration, the tokens and the move pipeline of [`sd-calendar`](../calendar/sd-calendar.md).

## Import

```ts
import { SdScheduler } from '@sdcorejs/angular/components/scheduler';
```

## Quick start

```ts
readonly rooms: SdSchedulerResource<Room>[] = [
  { id: 'hue', title: 'Phòng Huế', description: '8 seats', icon: 'meeting_room', group: 'Floor 3', data: { seats: 8 } },
];
readonly option: SdSchedulerOption<Booking, Room> = {
  dataSource: { onLoad: ({ from, to, resourceIds, signal }) => this.api.bookings({ from, to, resourceIds }, signal) },
};
```

```html
<sd-scheduler [option]="option" [resources]="rooms" view="day" />
```

The full reference (API, moving on two axes, keyboard, templates, limits) is completed with the component.
