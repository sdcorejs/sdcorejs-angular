import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTimeline, type SdTimelineItem, type SdTimelineLoadResult, type SdTimelineOption } from '@sdcorejs/angular/components/timeline';

const HOUR = 3_600_000;
const ACTIONS = ['xác nhận đơn', 'in phiếu giao', 'gán tài xế', 'cập nhật địa chỉ', 'gửi SMS cho khách'];
const PEOPLE = ['Trần Thu Hà', 'Lê Minh', 'Nguyễn Văn Thành', 'Phạm Văn Tú'];
/** 47 events, one every five hours, newest first. */
const ALL: SdTimelineItem[] = Array.from({ length: 47 }, (_, index) => ({
  id: `event-${index}`,
  at: Date.now() - (index * 5 + 1) * HOUR,
  actor: index % 3 === 2 ? undefined : { name: PEOPLE[index % PEOPLE.length] },
  icon: index % 3 === 2 ? 'sync' : undefined,
  source: index % 3 === 2 ? 'API' : 'Web',
  content: { layout: 'event', data: { title: index % 3 === 2 ? 'Hệ thống đồng bộ trạng thái' : ACTIONS[index % ACTIONS.length] } },
}));

const delay = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

@Component({
  selector: 'app-timeline-paged-example',
  standalone: true,
  imports: [SdButton, SdTimeline],
  templateUrl: './timeline-paged.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelinePagedExampleComponent {
  readonly loadMore = signal<'button' | 'auto'>('button');
  readonly failing = signal(false);
  readonly empty = signal(false);
  readonly lastError = signal('');
  readonly timeline = viewChild.required(SdTimeline);

  // A new option object restarts the timeline from the first page.
  readonly option = computed<SdTimelineOption>(() => {
    const empty = this.empty();
    return {
      pageSize: 10,
      loadMore: this.loadMore(),
      dataSource: {
        onLoad: async ({ cursor, pageSize, signal }): Promise<SdTimelineLoadResult> => {
          await delay(800, signal);
          if (this.failing()) throw new Error('Máy chủ không phản hồi');
          const source = empty ? [] : ALL;
          const start = cursor ? Number(cursor) : 0;
          const end = start + pageSize;
          return { items: source.slice(start, end), nextCursor: end < source.length ? String(end) : null };
        },
      },
    };
  });
}
