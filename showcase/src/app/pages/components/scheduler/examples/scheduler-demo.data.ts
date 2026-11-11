import type { SdCalendarHoliday } from '@sdcorejs/angular/components/calendar';
import type { SdSchedulerEvent, SdSchedulerResource } from '@sdcorejs/angular/components/scheduler';

// Sample data of the Scheduler page: the rooms, vehicles, people and timesheet of SD Scheduler Design.dc.html
// (today is Monday 09/11/2026, 10:40).

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

const at = (day: string, time: string): string => `${day} ${time}:00`;

// ---- meeting rooms: day view, grouped by floor (design 01) ----

export function demoRooms(): RoomResource[] {
  const room = (id: string, title: string, description: string, seats: number, group: string, icon = 'meeting_room'): RoomResource => ({
    id,
    title,
    description,
    icon,
    group,
    data: { seats },
  });
  return [
    room('hn', 'Phòng Hà Nội', '12 chỗ · màn hình 75 inch', 12, 'Tầng 3'),
    room('hue', 'Phòng Huế', '6 chỗ', 6, 'Tầng 3'),
    room('dn', 'Phòng Đà Nẵng', '8 chỗ', 8, 'Tầng 3'),
    room('sg', 'Phòng Sài Gòn', '20 chỗ · hội trường', 20, 'Tầng 5'),
    room('ct', 'Phòng Cần Thơ', '4 chỗ', 4, 'Tầng 5'),
    room('ol', 'Phòng họp online', 'Google Meet', 100, 'Tầng 5', 'videocam'),
  ];
}

export function demoBookings(day = DEMO_DAY): BookingEvent[] {
  const booking = (
    id: string,
    resourceId: string,
    start: string,
    end: string,
    title: string,
    people: number,
    host: string,
    color?: string
  ): BookingEvent => ({ id, title, resourceId, start: at(day, start), end: at(day, end), color, data: { people, host } });
  return [
    {
      ...booking('weekly', 'hn', '08:30', '09:30', 'Giao ban tuần', 10, 'Lan', 'primary'),
      occurrence: { seriesId: 'weekly-standup', originalStart: at(day, '08:30') },
    },
    booking('budget', 'hn', '10:00', '11:30', 'Review ngân sách Q4', 6, 'Minh', 'warning'),
    booking('interview', 'hn', '14:00', '15:00', 'Phỏng vấn ứng viên kế toán', 3, 'Hà', 'info'),
    booking('one-on-one', 'hue', '09:00', '09:30', '1:1 Hà – Bảo', 2, 'Hà', 'secondary'),
    booking('demo', 'hue', '13:30', '15:30', 'Demo khách Minh Phát', 5, 'Bảo', 'success'),
    booking('training', 'dn', '08:00', '12:00', 'Đào tạo sản phẩm mới', 8, 'Phong', 'info'),
    booking('warehouse', 'dn', '10:30', '11:30', 'Họp nhóm kho', 5, 'Tú', 'error'),
    booking('townhall', 'sg', '15:00', '17:00', 'Townhall tháng 11', 18, 'CEO', 'primary'),
    booking('projector', 'ct', '08:00', '10:00', 'Bảo trì máy chiếu', 1, 'IT', 'secondary'),
    booking('japan', 'ct', '16:00', '17:00', 'Gọi đối tác Nhật', 3, 'Lan', 'info'),
  ];
}

// ---- vehicles: week view, grouped by depot (design 02) ----

export interface VehicleDto {
  readonly driver: string;
}

export interface TripDto {
  readonly stops: number;
}

export function demoVehicles(): SdSchedulerResource<VehicleDto>[] {
  const vehicle = (id: string, title: string, load: string, driver: string, group: string, icon = 'local_shipping'): SdSchedulerResource<VehicleDto> => ({
    id,
    title,
    description: `${load} · ${driver}`,
    icon,
    group,
    data: { driver },
  });
  return [
    vehicle('v123', '51C-123.45', 'Tải 1,5 tấn', 'Nguyễn Văn An', 'Kho Quận 1'),
    vehicle('v678', '51D-678.90', 'Tải 2,5 tấn', 'Lê Văn Bình', 'Kho Quận 1'),
    vehicle('v246', '51C-246.80', 'Tải 1 tấn', 'Phạm Minh Tú', 'Kho Quận 7'),
    vehicle('v135', '59-H1 135.79', 'Xe máy', 'Trần Gia Huy', 'Kho Quận 7', 'two_wheeler'),
  ];
}

export function demoTrips(): SdSchedulerEvent<TripDto>[] {
  const trip = (id: string, resourceId: string, day: string, start: string, end: string, title: string, stops: number, color?: string): SdSchedulerEvent<TripDto> => ({
    id,
    title,
    resourceId,
    start: at(`2026/11/${day}`, start),
    end: at(`2026/11/${day}`, end),
    color,
    data: { stops },
  });
  const days = (id: string, resourceId: string, from: string, to: string, title: string, color: string): SdSchedulerEvent<TripDto> => ({
    id,
    title,
    resourceId,
    start: `2026/11/${from}`,
    end: `2026/11/${to}`,
    allDay: true,
    color,
    data: { stops: 0 },
  });
  return [
    trip('v123-mon', 'v123', '09', '08:00', '12:00', 'Tuyến Q1 – Q3', 12),
    trip('v123-minh-phat', 'v123', '09', '14:00', '16:00', 'Giao Minh Phát', 1, 'success'),
    trip('v123-tue', 'v123', '10', '08:00', '12:00', 'Tuyến Q1 – Q3', 11),
    days('v123-service', 'v123', '11', '12', 'Bảo dưỡng định kỳ', 'secondary'),
    trip('v123-binh-duong', 'v123', '13', '07:30', '17:00', 'Đi Bình Dương', 4, 'warning'),
    trip('v678-port', 'v678', '09', '09:00', '11:00', 'Nhập hàng Tân Cảng', 1, 'info'),
    days('v678-dong-nai', 'v678', '10', '11', 'Tuyến Đồng Nai – Biên Hoà', 'warning'),
    trip('v678-q7', 'v678', '13', '08:00', '12:00', 'Tuyến Q7', 9),
    trip('v246-mon', 'v246', '09', '08:00', '12:00', 'Tuyến Q7 – Nhà Bè', 10),
    trip('v246-returns', 'v246', '09', '13:30', '15:00', 'Nhận hàng đổi trả', 3, 'error'),
    trip('v246-wed', 'v246', '11', '08:00', '12:00', 'Tuyến Q7 – Nhà Bè', 10),
    trip('v246-weekend', 'v246', '14', '08:00', '11:00', 'Giao cuối tuần', 6),
    trip('v135-urgent', 'v135', '10', '10:00', '11:00', 'Giao gấp DH2415', 1, 'error'),
    trip('v135-city', 'v135', '12', '08:30', '11:30', 'Giao nội thành', 8),
  ];
}

// ---- leave: month view, avatars, axis 'time' (design 02) ----

export interface PersonDto {
  readonly role: string;
}

export interface LeaveDto {
  readonly kind: 'trip' | 'annual' | 'sick' | 'maternity';
}

export function demoPeople(): SdSchedulerResource<PersonDto>[] {
  const person = (id: string, title: string, role: string): SdSchedulerResource<PersonDto> => ({
    id,
    title,
    description: role,
    // sd-avatar draws the initials of a name.
    avatar: title,
    group: 'Phòng Kế toán',
    data: { role },
  });
  return [
    person('ha', 'Trần Thu Hà', 'Kế toán trưởng'),
    person('bao', 'Phạm Quốc Bảo', 'Kế toán tổng hợp'),
    person('minh', 'Lê Minh', 'Kế toán công nợ'),
    person('lan', 'Nguyễn Thị Lan', 'Kế toán thuế'),
    person('nam', 'Võ Hoàng Nam', 'Thủ quỹ'),
    person('linh', 'Đặng Mỹ Linh', 'Kế toán kho'),
  ];
}

export function demoLeaves(): SdSchedulerEvent<LeaveDto>[] {
  const leave = (id: string, resourceId: string, from: string, to: string, title: string, kind: LeaveDto['kind'], color?: string): SdSchedulerEvent<LeaveDto> => ({
    id,
    title,
    resourceId,
    start: from,
    end: to,
    allDay: true,
    color,
    data: { kind },
  });
  return [
    leave('ha-trip', 'ha', '2026/11/11', '2026/11/13', 'Công tác Đà Nẵng', 'trip', 'info'),
    leave('bao-annual', 'bao', '2026/11/16', '2026/11/20', 'Nghỉ phép năm', 'annual'),
    leave('minh-sick', 'minh', '2026/11/03', '2026/11/04', 'Nghỉ ốm', 'sick', 'warning'),
    { id: 'minh-afternoon', title: 'Nghỉ phép buổi chiều', resourceId: 'minh', start: '2026/11/25 13:00:00', end: '2026/11/25 17:30:00', data: { kind: 'annual' } },
    leave('lan-annual', 'lan', '2026/11/23', '2026/11/27', 'Nghỉ phép năm', 'annual'),
    leave('linh-maternity', 'linh', '2026/10/16', '2027/02/15', 'Nghỉ thai sản · 16/10/2026 – 15/02/2027', 'maternity', 'secondary'),
  ];
}

// ---- timesheet: month view, cell template (design 05) ----

/** X worked, ½ half a day, P paid leave, Ô sick, KL unpaid, ! a missing clock-in or clock-out. */
export type ShiftCode = 'X' | '½' | 'P' | 'Ô' | 'KL' | '!';

export interface ShiftDto {
  readonly code: ShiftCode;
}

export const SHIFT_LEGEND: readonly { readonly code: ShiftCode; readonly label: string }[] = [
  { code: 'X', label: 'Đủ công' },
  { code: '½', label: 'Nửa công' },
  { code: 'P', label: 'Nghỉ phép' },
  { code: 'Ô', label: 'Nghỉ ốm' },
  { code: 'KL', label: 'Không lương' },
  { code: '!', label: 'Thiếu giờ vào hoặc ra' },
];

export function demoStaff(): SdSchedulerResource<PersonDto>[] {
  return demoPeople()
    .slice(0, 4)
    .map(person => ({ ...person, group: undefined }));
}

/** The first week of November 2026 and the leave registered after today (Bảo, 16–20), as in the design. */
export function demoShifts(): SdSchedulerEvent<ShiftDto>[] {
  const codes: Record<string, Record<number, ShiftCode>> = {
    ha: { 2: 'X', 3: 'X', 4: 'X', 5: 'X', 6: 'X' },
    bao: { 2: 'X', 3: 'X', 4: '½', 5: 'X', 6: 'X', 16: 'P', 17: 'P', 18: 'P', 19: 'P', 20: 'P' },
    minh: { 2: 'X', 3: 'Ô', 4: 'Ô', 5: 'X', 6: '!' },
    lan: { 2: 'X', 3: 'X', 4: 'X', 5: 'KL', 6: 'X' },
  };
  return Object.entries(codes).flatMap(([resourceId, byDay]) =>
    Object.entries(byDay).map(([date, code]) => {
      const day = `2026/11/${date.padStart(2, '0')}`;
      return { id: `${resourceId}-${day}`, title: code, resourceId, start: day, end: day, allDay: true, data: { code } };
    })
  );
}

/** Days worked: X counts 1, ½ counts 0.5. */
export function shiftTotal(shifts: readonly SdSchedulerEvent<ShiftDto>[], resourceId: string): number {
  return shifts
    .filter(shift => shift.resourceId === resourceId)
    .reduce((total, shift) => total + (shift.data?.code === 'X' ? 1 : shift.data?.code === '½' ? 0.5 : 0), 0);
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
