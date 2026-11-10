import type { SdSchedulerEvent, SdSchedulerResource } from '@sdcorejs/angular/components/scheduler';

// Sample data of the Scheduler page: the rooms, vehicles, people and timesheet of the design file (Monday 09/11/2026).

export interface RoomDto {
  readonly seats: number;
}

export interface BookingDto {
  readonly people: number;
  readonly host: string;
}

export type RoomResource = SdSchedulerResource<RoomDto>;
export type BookingEvent = SdSchedulerEvent<BookingDto>;

export const DEMO_DAY = '2026/11/09';

export function demoRooms(): RoomResource[] {
  return [
    { id: 'hall', title: 'Hội trường A', description: '120 chỗ · Sân khấu', icon: 'groups', data: { seats: 120 } },
    { id: 'hue', title: 'Phòng Huế', description: '8 chỗ · Máy chiếu', icon: 'meeting_room', group: 'Tầng 3', data: { seats: 8 } },
    { id: 'hoi-an', title: 'Phòng Hội An', description: '6 chỗ · TV', icon: 'meeting_room', group: 'Tầng 3', data: { seats: 6 } },
    { id: 'sa-pa', title: 'Phòng Sa Pa', description: '12 chỗ · Họp trực tuyến', icon: 'videocam', group: 'Tầng 3', data: { seats: 12 } },
    { id: 'can-tho', title: 'Phòng Cần Thơ', description: '4 chỗ', icon: 'meeting_room', group: 'Tầng 5', data: { seats: 4 } },
    { id: 'da-lat', title: 'Phòng Đà Lạt', description: '10 chỗ · Bảng trắng', icon: 'meeting_room', group: 'Tầng 5', data: { seats: 10 } },
  ];
}

const at = (day: string, time: string): string => `${day} ${time}:00`;

export function demoBookings(day = DEMO_DAY): BookingEvent[] {
  return [
    { id: 'standup', title: 'Giao ban sáng', resourceId: 'hue', start: at(day, '08:00'), end: at(day, '08:30'), data: { people: 6, host: 'Lan' } },
    {
      id: 'budget',
      title: 'Review ngân sách Q4',
      resourceId: 'hue',
      start: at(day, '09:00'),
      end: at(day, '10:30'),
      color: 'warning',
      data: { people: 6, host: 'Minh' },
    },
    {
      id: 'client',
      title: 'Hẹn khách: Công ty An Phát',
      resourceId: 'hoi-an',
      start: at(day, '10:00'),
      end: at(day, '11:30'),
      color: 'success',
      data: { people: 5, host: 'Hà' },
    },
    { id: 'design', title: 'Thiết kế màn hình đặt phòng', resourceId: 'sa-pa', start: at(day, '13:30'), end: at(day, '15:00'), data: { people: 9, host: 'Tú' } },
    { id: 'one-on-one', title: '1:1 với Minh', resourceId: 'can-tho', start: at(day, '14:00'), end: at(day, '14:30'), color: 'info', data: { people: 2, host: 'Lan' } },
    { id: 'training', title: 'Đào tạo nhân viên mới', resourceId: 'da-lat', start: at(day, '13:00'), end: at(day, '17:00'), color: 'secondary', data: { people: 10, host: 'Phong' } },
    { id: 'town-hall', title: 'Họp toàn công ty', resourceId: 'hall', start: at(day, '15:30'), end: at(day, '17:00'), color: 'error', data: { people: 90, host: 'CEO' } },
  ];
}

/** 150 resources in 10 groups, three events each over a 31-day month: the load of TESTING §10. */
export function perfResources(): RoomResource[] {
  return Array.from({ length: 150 }, (_, index) => ({
    id: `r${index}`,
    title: `Tài nguyên ${index + 1}`,
    description: `Mô tả ${index + 1}`,
    icon: 'inventory_2',
    group: `Nhóm ${Math.floor(index / 15) + 1}`,
    data: { seats: 4 + (index % 10) },
  }));
}

export function perfEvents(month = '2026/12'): BookingEvent[] {
  const events: BookingEvent[] = [];
  const day = (n: number): string => `${month}/${String(1 + (n % 31)).padStart(2, '0')}`;
  const date = (n: number): string => `${month}/${String(n).padStart(2, '0')}`;
  for (let index = 0; index < 150; index++) {
    const id = `r${index}`;
    const trip = 1 + ((index + 17) % 29);
    events.push(
      { id: `${id}-a`, title: `Ca sáng ${index + 1}`, resourceId: id, start: at(day(index), '08:00'), end: at(day(index), '11:00'), data: { people: 2, host: '' } },
      {
        id: `${id}-b`,
        title: `Ca chiều ${index + 1}`,
        resourceId: id,
        start: at(day(index + 9), '13:00'),
        end: at(day(index + 9), '17:00'),
        color: 'success',
        data: { people: 2, host: '' },
      },
      {
        id: `${id}-c`,
        title: `Công tác ${index + 1}`,
        resourceId: id,
        start: date(trip),
        end: date(trip + 2),
        allDay: true,
        color: 'secondary',
        data: { people: 1, host: '' },
      }
    );
  }
  return events;
}
