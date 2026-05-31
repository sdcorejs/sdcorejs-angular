import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdHistoryItem } from '@sdcorejs/angular/components/history';
import type { SdColor } from '@sdcorejs/angular/utilities';

// SdHistoryItemType chưa được export ở barrel — khai báo lại tại đây để tránh sửa thư viện.
interface SdHistoryItemType {
  title: string;
  status?: { title?: string; color?: SdColor; icon?: string };
  date?: string;
  actor?: string;
  source?: string;
  description?: string;
}

@Component({
  selector: 'app-history-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHistoryItem],
  template: `
    <demo-page
      title="History"
      description="Dòng thời gian dọc hiển thị lịch sử thay đổi / phê duyệt của một bản ghi — kèm trạng thái, thời gian, người thao tác.">

      <demo-section heading="Luồng phê duyệt hợp đồng (đầy đủ)">
        <div class="timeline-box">
          <sd-history [items]="approvalFlow"></sd-history>
        </div>
      </demo-section>

      <demo-section heading="Lịch sử cập nhật ngắn">
        <div class="timeline-box">
          <sd-history [items]="updateLog"></sd-history>
        </div>
      </demo-section>

      <demo-section heading="Timeline rỗng">
        <div class="timeline-box">
          <sd-history [items]="[]"></sd-history>
          <p class="empty-note">Bản ghi chưa có lịch sử thay đổi.</p>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .timeline-box {
      width: 100%;
      max-width: 720px;
    }
    .empty-note {
      color: #6b6b6b;
      font-size: 13px;
      margin: 8px 0 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryDemoComponent {
  readonly approvalFlow: SdHistoryItemType[] = [
    {
      title: 'Tạo phiếu yêu cầu',
      status: { title: 'Khởi tạo', color: 'info', icon: 'add_circle' },
      date: '2025-05-20T08:15:00Z',
      actor: 'an.nv',
      source: 'Web',
      description: 'Khởi tạo phiếu yêu cầu thanh toán cho nhà cung cấp ABC.',
    },
    {
      title: 'Gửi duyệt cấp 1',
      status: { title: 'Chờ duyệt', color: 'warning', icon: 'hourglass_top' },
      date: '2025-05-20T09:30:00Z',
      actor: 'an.nv',
      source: 'Web',
    },
    {
      title: 'Phê duyệt cấp 1',
      status: { title: 'Đã duyệt', color: 'success', icon: 'check_circle' },
      date: '2025-05-21T10:05:00Z',
      actor: 'binh.tp',
      source: 'Mobile',
      description: 'Đồng ý theo đề nghị, chuyển sang cấp 2.',
    },
    {
      title: 'Từ chối cấp 2',
      status: { title: 'Từ chối', color: 'error', icon: 'cancel' },
      date: '2025-05-22T14:18:00Z',
      actor: 'cuong.lh',
      source: 'Web',
      description: 'Đề nghị bổ sung hóa đơn gốc và biên bản nghiệm thu trước khi duyệt lại.',
    },
  ];

  readonly updateLog: SdHistoryItemType[] = [
    {
      title: 'Cập nhật thông tin khách hàng',
      date: '2025-05-15T11:20:00Z',
      actor: 'hoa.lt',
      source: 'API',
    },
    {
      title: 'Đồng bộ lại từ CRM',
      date: '2025-05-10T07:00:00Z',
      actor: 'system',
      source: 'Job',
    },
  ];
}

