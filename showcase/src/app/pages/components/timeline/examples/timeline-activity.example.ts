import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTimeline, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';

const MINUTE = 60_000;

/** Activity of one order, newest first: the three layouts, with long text and more than three changes. */
export const TIMELINE_ACTIVITY: SdTimelineItem[] = [
  {
    id: 'comment-1',
    at: Date.now() - 25 * MINUTE,
    actor: { name: 'Lê Minh' },
    source: 'Web',
    content: {
      layout: 'comment',
      data: {
        text:
          'Khách gọi lại lúc 10h, hẹn nhận hàng sau 14h vì buổi sáng không có người ở nhà.\n' +
          'Đã báo bộ phận giao vận đổi khung giờ và ghi chú lên phiếu giao.\n' +
          'Nếu chiều nay vẫn không liên lạc được thì chuyển sang ngày mai, ưu tiên chuyến đầu tiên.\n' +
          'Nhắc tài xế gọi trước 15 phút.',
      },
    },
  },
  {
    id: 'change-1',
    at: Date.now() - 120 * MINUTE,
    actor: { name: 'Trần Thu Hà' },
    source: 'Web',
    content: {
      layout: 'change',
      data: {
        title: 'cập nhật đơn hàng',
        changes: [
          { label: 'Trạng thái', from: { badge: { title: 'Chờ xác nhận', color: 'warning' } }, to: { badge: { title: 'Đang giao', color: 'info' } } },
          { label: 'Kho xuất', from: 'Quận 7', to: 'Quận 1' },
          { label: 'Ghi chú', from: null, to: 'Giao sau 14h' },
          { label: 'Phí giao (₫)', from: 30000, to: 0 },
          { label: 'Người giao', from: null, to: 'Phạm Văn Tú' },
        ],
      },
    },
  },
  {
    id: 'event-1',
    at: '2026-11-02T03:02:00Z',
    icon: 'close',
    color: 'error',
    actor: { name: 'Nguyễn Văn Thành' },
    content: {
      layout: 'event',
      data: { title: 'từ chối', badge: { title: 'Từ chối', color: 'error' }, note: 'Lý do: thiếu chứng từ giao nhận của lô 2.' },
    },
  },
  {
    id: 'event-2',
    at: '2026-11-02T02:14:00Z',
    icon: 'sync',
    source: 'API',
    content: { layout: 'event', data: { title: 'Hệ thống đồng bộ từ kênh Đại lý' } },
  },
];

@Component({
  selector: 'app-timeline-activity-example',
  standalone: true,
  imports: [SdButton, SdTimeline],
  templateUrl: './timeline-activity.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineActivityExampleComponent {
  readonly items = TIMELINE_ACTIVITY;
  readonly size = signal<'md' | 'sm'>('md');
  readonly groupBy = signal<'day' | 'none'>('day');
}
