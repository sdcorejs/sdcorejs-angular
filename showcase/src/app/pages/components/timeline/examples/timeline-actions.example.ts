import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTimeline, SdTimelineItemActionsDirective, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';

const MINUTE = 60_000;

@Component({
  selector: 'app-timeline-actions-example',
  standalone: true,
  imports: [SdButton, SdTimeline, SdTimelineItemActionsDirective],
  templateUrl: './timeline-actions.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineActionsExampleComponent {
  readonly items = signal<SdTimelineItem[]>([
    { id: 'c1', at: Date.now() - 3 * MINUTE, actor: { name: 'Lê Minh' }, content: { layout: 'comment', data: { text: 'Khách hẹn nhận sau 14h.' } } },
    {
      id: 'c2',
      at: Date.now() - 40 * MINUTE,
      actor: { name: 'Trần Thu Hà' },
      content: { layout: 'comment', data: { text: 'Đã gọi xác nhận địa chỉ, khách đổi sang Quận 1.', edited: true } },
    },
    { id: 'e1', at: Date.now() - 50 * MINUTE, icon: 'local_shipping', content: { layout: 'event', data: { title: 'Hệ thống tạo phiếu giao' } } },
  ]);
  readonly lastAction = signal('Chưa có tác vụ');

  remove(item: SdTimelineItem): void {
    this.items.update(items => items.filter(entry => entry.id !== item.id));
    this.lastAction.set(`Đã xoá ${item.id}`);
  }
}
