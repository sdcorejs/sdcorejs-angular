import type { SdCalendarEvent, SdCalendarHoliday } from '@sdcorejs/angular/components/calendar';

/** DTO of the demo: what a backend would return for a meeting. */
export interface MeetingDto {
  readonly room: string;
  readonly owner: string;
}

export type MeetingEvent = SdCalendarEvent<MeetingDto>;

const meeting = (
  id: string,
  title: string,
  start: string,
  end: string,
  room: string,
  color?: string,
  owner = 'Lan'
): MeetingEvent => ({ id, title, start, end, color, data: { room, owner } });

/** Weekly stand-up on every Monday of October and November 2026, already expanded like a server would. */
const standups = (): MeetingEvent[] =>
  ['2026/10/05', '2026/10/12', '2026/10/19', '2026/10/26', '2026/11/02', '2026/11/09', '2026/11/16', '2026/11/23', '2026/11/30'].map(day => ({
    ...meeting(`standup-${day.replace(/\//g, '')}`, 'Họp giao ban tuần', `${day} 09:00:00`, `${day} 09:30:00`, 'Phòng Sen · Online'),
    occurrence: { seriesId: 'standup', originalStart: `${day} 09:00:00` },
  }));

/** The week of 19–25/10/2026 of the design file, plus a few events around it. */
export function demoEvents(): MeetingEvent[] {
  return [
    ...standups(),
    meeting('budget', 'Review ngân sách Q4', '2026/10/21 14:00:00', '2026/10/21 15:30:00', 'Phòng Lan', 'warning', 'Minh'),
    meeting('client', 'Hẹn khách: Công ty An Phát', '2026/10/22 09:30:00', '2026/10/22 10:30:00', 'Văn phòng khách hàng', 'success'),
    meeting('one-on-one', '1:1 với Minh', '2026/10/22 10:00:00', '2026/10/22 10:30:00', 'Online'),
    meeting('security', 'Đào tạo an toàn thông tin', '2026/10/22 13:30:00', '2026/10/22 15:00:00', 'Hội trường', 'secondary'),
    meeting('design', 'Duyệt thiết kế', '2026/10/20 10:00:00', '2026/10/20 11:30:00', 'Phòng Cúc', 'info'),
    meeting('design-qa', 'Hỏi đáp thiết kế', '2026/10/20 10:30:00', '2026/10/20 11:00:00', 'Phòng Cúc', 'info'),
    meeting('design-sync', 'Đồng bộ front-end', '2026/10/20 10:45:00', '2026/10/20 12:00:00', 'Online', 'primary'),
    meeting('design-note', 'Ghi chú nhanh', '2026/10/20 11:00:00', '2026/10/20 11:15:00', 'Online', 'secondary'),
    meeting('demo', 'Demo sprint 42', '2026/10/23 15:00:00', '2026/10/23 16:30:00', 'Phòng Sen'),
    meeting('board', 'Họp HĐQT', '2026/10/27 14:00:00', '2026/10/27 16:00:00', 'Phòng Lan', 'error', 'Hà'),
    meeting('night', 'Trực đêm', '2026/10/22 22:00:00', '2026/10/23 06:00:00', 'Kho', 'rebeccapurple', 'Tú'),
    meeting('late', 'Kiểm kho cuối ngày', '2026/10/24 22:30:00', '2026/10/25 00:00:00', 'Kho', 'warning', 'Tú'),
    { id: 'leave', title: 'Nghỉ phép · Lan', start: '2026/10/22', end: '2026/10/23', allDay: true, color: 'secondary', data: { room: '', owner: 'Lan' } },
    { id: 'deadline', title: 'Hạn chót báo cáo Q3', start: '2026/10/23', allDay: true, color: 'error', data: { room: '', owner: 'Hà' } },
    { id: 'trip', title: 'Công tác Đà Nẵng', start: '2026/10/24', end: '2026/10/27', allDay: true, color: 'info', data: { room: '', owner: 'Minh' } },
  ];
}

export const DEMO_HOLIDAYS: readonly SdCalendarHoliday[] = [
  { date: '2026/10/20', label: 'Ngày Phụ nữ Việt Nam', type: 'observance' },
  { date: '2026/11/20', label: 'Ngày Nhà giáo Việt Nam', type: 'observance' },
  { date: '2026/09/02', label: 'Quốc khánh', type: 'off' },
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
