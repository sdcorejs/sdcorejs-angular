import type { SdCalendarHoliday } from '@sdcorejs/angular/components/calendar';
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
      resourceId: 'sa-pa',
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
    { id: 'one-on-one', title: '1:1 với Minh', resourceId: 'sa-pa', start: at(day, '11:00'), end: at(day, '11:30'), color: 'info', data: { people: 2, host: 'Lan' } },
    { id: 'interview', title: 'Phỏng vấn ứng viên', resourceId: 'can-tho', start: at(day, '14:00'), end: at(day, '15:00'), data: { people: 3, host: 'Hà' } },
    { id: 'training', title: 'Đào tạo nhân viên mới', resourceId: 'da-lat', start: at(day, '13:00'), end: at(day, '17:00'), color: 'secondary', data: { people: 10, host: 'Phong' } },
    { id: 'town-hall', title: 'Họp toàn công ty', resourceId: 'hall', start: at(day, '15:30'), end: at(day, '17:00'), color: 'error', data: { people: 90, host: 'CEO' } },
  ];
}

export const DEMO_HOLIDAYS: readonly SdCalendarHoliday[] = [
  { date: '2026/11/20', label: 'Ngày Nhà giáo Việt Nam', type: 'observance' },
  { date: '2026/11/13', label: 'Nghỉ bù (demo)', type: 'off' },
];

/** Resolves after `ms`, rejects when `signal` aborts. */
export const delay = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

// ---- vehicles: week view, grouped by depot ----

export interface VehicleDto {
  readonly plate: string;
}

export interface TripDto {
  readonly stops: number;
}

export function demoVehicles(): SdSchedulerResource<VehicleDto>[] {
  return [
    { id: 'truck-1', title: 'Xe tải 51C-123.45', description: '2,5 tấn', icon: 'local_shipping', group: 'Kho Thủ Đức', data: { plate: '51C-123.45' } },
    { id: 'truck-2', title: 'Xe tải 51C-678.90', description: '5 tấn', icon: 'local_shipping', group: 'Kho Thủ Đức', data: { plate: '51C-678.90' } },
    { id: 'van-1', title: 'Xe van 51D-246.80', description: '900 kg', icon: 'airport_shuttle', group: 'Kho Thủ Đức', data: { plate: '51D-246.80' } },
    { id: 'truck-3', title: 'Xe tải 51C-135.79', description: '2,5 tấn', icon: 'local_shipping', group: 'Kho Bình Tân', data: { plate: '51C-135.79' } },
    { id: 'bike-1', title: 'Xe máy 59X-111.22', description: 'Giao nhanh', icon: 'two_wheeler', group: 'Kho Bình Tân', data: { plate: '59X-111.22' } },
  ];
}

export function demoTrips(): SdSchedulerEvent<TripDto>[] {
  return [
    { id: 'trip-1', title: 'Giao Quận 1', resourceId: 'truck-1', start: at('2026/11/09', '07:30'), end: at('2026/11/09', '11:00'), data: { stops: 12 } },
    { id: 'trip-2', title: 'Giao Quận 7', resourceId: 'truck-1', start: at('2026/11/10', '13:00'), end: at('2026/11/10', '17:00'), color: 'info', data: { stops: 9 } },
    { id: 'trip-3', title: 'Chuyến Đà Lạt', resourceId: 'truck-2', start: '2026/11/10', end: '2026/11/12', allDay: true, color: 'warning', data: { stops: 4 } },
    { id: 'trip-4', title: 'Bảo dưỡng', resourceId: 'van-1', start: '2026/11/12', end: '2026/11/12', allDay: true, color: 'secondary', data: { stops: 0 } },
    { id: 'trip-5', title: 'Giao Thủ Đức', resourceId: 'van-1', start: at('2026/11/09', '08:00'), end: at('2026/11/09', '12:00'), color: 'success', data: { stops: 15 } },
    { id: 'trip-6', title: 'Chuyến Cần Thơ', resourceId: 'truck-3', start: '2026/11/11', end: '2026/11/14', allDay: true, color: 'warning', data: { stops: 6 } },
    { id: 'trip-7', title: 'Giao Bình Chánh', resourceId: 'truck-3', start: at('2026/11/09', '09:00'), end: at('2026/11/09', '15:00'), data: { stops: 10 } },
    { id: 'trip-8', title: 'Đơn hoả tốc', resourceId: 'bike-1', start: at('2026/11/10', '10:00'), end: at('2026/11/10', '11:00'), color: 'error', data: { stops: 3 } },
  ];
}

// ---- leave: month view, avatars, axis 'time' ----

export interface PersonDto {
  readonly role: string;
}

export interface LeaveDto {
  readonly kind: 'annual' | 'sick' | 'remote';
}

export function demoPeople(): SdSchedulerResource<PersonDto>[] {
  const person = (id: string, title: string, role: string, group: string): SdSchedulerResource<PersonDto> => ({
    id,
    title,
    description: role,
    // sd-avatar draws the initials of a name.
    avatar: title,
    group,
    data: { role },
  });
  return [
    person('an', 'Nguyễn Văn An', 'Trưởng nhóm', 'Phòng Kỹ thuật'),
    person('bich', 'Trần Thị Bích', 'Lập trình viên', 'Phòng Kỹ thuật'),
    person('hoang', 'Lê Minh Hoàng', 'Kiểm thử', 'Phòng Kỹ thuật'),
    person('quynh', 'Phạm Quỳnh Anh', 'Kinh doanh', 'Phòng Kinh doanh'),
    person('tuan', 'Đỗ Anh Tuấn', 'Kinh doanh', 'Phòng Kinh doanh'),
  ];
}

export function demoLeaves(): SdSchedulerEvent<LeaveDto>[] {
  const leave = (id: string, resourceId: string, from: string, to: string, kind: LeaveDto['kind']): SdSchedulerEvent<LeaveDto> => ({
    id,
    title: kind === 'annual' ? 'Nghỉ phép năm' : kind === 'sick' ? 'Nghỉ ốm' : 'Làm từ xa',
    resourceId,
    start: from,
    end: to,
    allDay: true,
    color: kind === 'annual' ? 'primary' : kind === 'sick' ? 'error' : 'info',
    data: { kind },
  });
  return [
    leave('leave-1', 'an', '2026/11/16', '2026/11/18', 'annual'),
    leave('leave-2', 'bich', '2026/11/05', '2026/11/05', 'sick'),
    leave('leave-3', 'bich', '2026/11/23', '2026/11/27', 'annual'),
    leave('leave-4', 'hoang', '2026/11/10', '2026/11/11', 'remote'),
    leave('leave-5', 'quynh', '2026/11/02', '2026/11/06', 'annual'),
    leave('leave-6', 'tuan', '2026/11/19', '2026/11/19', 'sick'),
  ];
}

// ---- timesheet: month view, cell template ----

export interface ShiftDto {
  /** X: worked, P: paid leave, CT: business trip. */
  readonly code: 'X' | 'P' | 'CT';
}

export function demoStaff(): SdSchedulerResource<PersonDto>[] {
  return demoPeople()
    .slice(0, 4)
    .map(person => ({ ...person, group: undefined }));
}

/** One entry per working day of November 2026, a few as leave or business trip. */
export function demoShifts(): SdSchedulerEvent<ShiftDto>[] {
  const shifts: SdSchedulerEvent<ShiftDto>[] = [];
  const special: Record<string, ShiftDto['code']> = {
    'bich/2026/11/05': 'P',
    'quynh/2026/11/03': 'CT',
    'quynh/2026/11/04': 'CT',
    'an/2026/11/16': 'P',
    'an/2026/11/17': 'P',
  };
  for (const person of demoStaff()) {
    for (let date = 2; date <= 30; date++) {
      const day = `2026/11/${String(date).padStart(2, '0')}`;
      const weekday = (date - 2) % 7; // 2026/11/02 is a Monday: 0 Monday … 6 Sunday.
      if (weekday > 4 || day > '2026/11/20') continue;
      const code = special[`${person.id}/${day}`] ?? 'X';
      shifts.push({ id: `${person.id}-${day}`, title: code, resourceId: person.id, start: day, end: day, allDay: true, data: { code } });
    }
  }
  return shifts;
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
