import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTimeline, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';

const HOUR = 3_600_000;

@Component({
  selector: 'app-timeline-change-log-example',
  standalone: true,
  imports: [SdTimeline],
  templateUrl: './timeline-change-log.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineChangeLogExampleComponent {
  readonly items: SdTimelineItem[] = [
    {
      id: 'status',
      at: Date.now() - 2 * HOUR,
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
      id: 'sync',
      at: '2026-11-02T02:14:00Z',
      icon: 'sync',
      source: 'API',
      content: { layout: 'event', data: { title: 'Hệ thống đồng bộ từ kênh Đại lý' } },
    },
  ];
}
