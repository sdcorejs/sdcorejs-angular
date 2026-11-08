import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTimeline, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';

@Component({
  selector: 'app-timeline-approval-example',
  standalone: true,
  imports: [SdTimeline],
  templateUrl: './timeline-approval.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineApprovalExampleComponent {
  // Newest first; groupBy="none" keeps the given order and shows full dates.
  readonly items: SdTimelineItem[] = [
    {
      id: 'approve',
      at: '2025-05-01T07:02:00Z',
      actor: { name: 'Lê Văn Long' },
      source: 'Mobile',
      content: {
        layout: 'event',
        data: {
          title: 'Phê duyệt',
          badge: { title: 'Đã duyệt', color: 'success', icon: 'check' },
          note: 'Đồng ý với điều khoản đã được rà soát. Bổ sung phụ lục thanh toán theo tiến độ trước khi ký, gửi lại cho phòng pháp chế kiểm tra lần cuối.',
        },
      },
    },
    {
      id: 'submit',
      at: '2025-05-01T03:15:00Z',
      actor: { name: 'Trần Trọng Nghĩa' },
      source: 'Web',
      content: { layout: 'event', data: { title: 'Gửi duyệt', badge: { title: 'Chờ duyệt', color: 'warning', icon: 'hourglass_empty' } } },
    },
    {
      id: 'create',
      at: '2025-05-01T02:30:00Z',
      actor: { name: 'Trần Trọng Nghĩa' },
      source: 'Web',
      content: { layout: 'event', data: { title: 'Tạo phiếu' } },
    },
  ];
}
