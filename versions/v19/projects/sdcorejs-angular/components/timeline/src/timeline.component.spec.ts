import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SD_CORE_CONFIGURATION, type ISdCoreConfiguration } from '@sdcorejs/angular/configurations';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTimeline } from './timeline.component';
import type { SdTimelineItem } from './timeline.model';
import { SdTimelineEmptyDirective, SdTimelineItemActionsDirective } from './timeline.templates';

const LONG_TEXT = Array.from({ length: 12 }, (_, index) => `Dòng ${index + 1} của một bình luận khá dài để chắc chắn bị cắt.`).join('\n');

const ITEMS: SdTimelineItem<{ ref: string }>[] = [
  {
    id: 'c1',
    at: '2026-11-08T03:00:00Z',
    actor: { name: 'Thu Hà' },
    source: 'Web',
    content: { layout: 'comment', data: { text: 'Khách hẹn giao chiều nay.', edited: true } },
    data: { ref: 'dto-c1' },
  },
  { id: 'c2', at: '2026-11-08T02:00:00Z', actor: { name: 'Minh Anh' }, content: { layout: 'comment', data: { text: LONG_TEXT } } },
  {
    id: 'ch1',
    at: '2026-11-08T01:00:00Z',
    content: {
      layout: 'change',
      data: {
        title: 'cập nhật đơn hàng',
        changes: [
          { label: 'Ghi chú', from: 'Giao sáng', to: 'Giao chiều' },
          { label: 'Mã giảm giá', from: 'SALE10', to: null },
          { label: 'Trạng thái', from: { badge: { title: 'Nháp' } }, to: { badge: { title: 'Chờ duyệt', color: 'warning' } } },
        ],
      },
    },
  },
  {
    id: 'e1',
    at: '2026-11-07T09:00:00Z',
    icon: 'send',
    color: 'primary',
    content: { layout: 'event', data: { title: 'gửi duyệt', note: 'Cần duyệt gấp' } },
  },
  { id: 'e2', at: '2026-11-07T08:00:00Z', content: { layout: 'event', data: { title: 'tạo đơn' } } },
];

@Component({
  standalone: true,
  imports: [SdTimeline, SdTimelineEmptyDirective, SdTimelineItemActionsDirective],
  template: `
    <div style="width: 320px">
      <sd-timeline data-testid="timeline" autoId="activity" [items]="items()" [size]="size()" [groupBy]="groupBy()">
        @if (customEmpty()) {
          <ng-template sdTimelineEmpty><p class="custom-empty">Không có gì</p></ng-template>
        }
        <ng-template sdTimelineItemActions let-item>
          <button type="button" class="item-action" [attr.data-ref]="item.data?.ref ?? item.id">⋯</button>
        </ng-template>
      </sd-timeline>
    </div>
  `,
})
class TimelineHost {
  readonly items = signal<readonly SdTimelineItem<{ ref: string }>[]>(ITEMS);
  readonly size = signal<'md' | 'sm'>('md');
  readonly groupBy = signal<'day' | 'none'>('day');
  readonly customEmpty = signal(false);
}

const frame = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => resolve()));

describe('SdTimeline with items', () => {
  let fixture: ComponentFixture<TimelineHost>;
  let host: TimelineHost;
  const root = (): HTMLElement => fixture.nativeElement.querySelector('[data-testid="timeline"]') as HTMLElement;
  const item = (id: string): HTMLElement => root().querySelector(`[data-item-id="${id}"]`) as HTMLElement;
  const markerIcon = (id: string): string =>
    (fixture.debugElement.query(By.css(`[data-item-id="${id}"] .sd-timeline__marker sd-icon`)).componentInstance as SdIcon).name() ?? '';
  const settle = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    await frame();
    await frame();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineHost],
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone: 'Asia/Ho_Chi_Minh' } as ISdCoreConfiguration }],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    fixture = TestBed.createComponent(TimelineHost);
    host = fixture.componentInstance;
    await settle();
  });

  it('shows the empty text, or the sdTimelineEmpty template', () => {
    host.items.set([]);
    fixture.detectChanges();
    expect(root().textContent).toContain('Chưa có hoạt động.');
    host.customEmpty.set(true);
    fixture.detectChanges();
    expect(root().querySelector('.custom-empty')?.textContent).toContain('Không có gì');
    expect(root().textContent).not.toContain('Chưa có hoạt động.');
  });

  it('uses an avatar for an actor and a layout icon otherwise, which icon overrides', () => {
    expect(item('c1').querySelector('sd-avatar')).not.toBeNull();
    expect(markerIcon('ch1')).toBe('edit');
    expect(markerIcon('e2')).toBe('circle');
    expect(markerIcon('e1')).toBe('send');
    expect(item('e1').querySelector('.sd-timeline__marker')?.classList.contains('sd-timeline__marker--primary')).toBeTrue();
  });

  it('frames a comment and offers "show more" only when the text is clamped', async () => {
    expect(item('c1').querySelector('.sd-timeline__comment')).not.toBeNull();
    expect(item('c1').querySelector('.sd-timeline__toggle')).toBeNull();
    expect(item('c1').textContent).toContain('đã sửa');
    const toggle = item('c2').querySelector('.sd-timeline__toggle') as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await settle();
    expect((item('c2').querySelector('.sd-timeline__toggle') as HTMLButtonElement).getAttribute('aria-expanded')).toBe('true');
  });

  it('renders change values: struck-through old text, a dash for null, badges for badge values', () => {
    const change = item('ch1');
    const from = change.querySelector('.sd-timeline__from') as HTMLElement;
    expect(getComputedStyle(from).textDecorationLine).toContain('line-through');
    expect(change.querySelectorAll('.sd-timeline__empty-value').length).toBe(1);
    expect(change.querySelectorAll('sd-badge').length).toBe(2);
  });

  it('shows an event note without the comment frame', () => {
    expect(item('e1').querySelector('.sd-timeline__note')?.textContent).toContain('Cần duyệt gấp');
    expect(item('e1').querySelector('.sd-timeline__comment')).toBeNull();
  });

  it('groups by day with Vietnamese day headings', () => {
    const headings = Array.from(root().querySelectorAll('.sd-timeline__day')).map(heading => heading.textContent?.trim());
    expect(headings.length).toBe(2);
    expect(headings[1]).toMatch(/07\/11\/2026|Hôm qua|Hôm nay/);
  });

  it('hides the source and uses 24px markers at size sm', () => {
    expect(item('c1').textContent).toContain('Web');
    host.size.set('sm');
    fixture.detectChanges();
    expect(item('c1').textContent).not.toContain('Web');
    expect(item('e2').querySelector('.sd-timeline__marker')?.getBoundingClientRect().width).toBe(24);
    expect(root().querySelector('.sd-timeline')?.classList.contains('sd-timeline--sm')).toBeTrue();
  });

  it('renders sdTimelineItemActions at the end of the first line with the item in context', () => {
    const action = item('c1').querySelector('.sd-timeline__head .sd-timeline__actions .item-action');
    expect(action?.getAttribute('data-ref')).toBe('dto-c1');
    expect(item('e2').querySelector('.item-action')?.getAttribute('data-ref')).toBe('e2');
  });

  it('puts the actor, time and source on a second line without day groups', () => {
    host.groupBy.set('none');
    fixture.detectChanges();
    expect(root().querySelector('.sd-timeline__day')).toBeNull();
    expect(item('c1').querySelector('.sd-timeline__meta')?.textContent).toContain('Thu Hà');
    expect(item('c1').querySelector('time')?.textContent).toMatch(/\d\d:\d\d \d\d\/\d\d\/\d{4}/);
  });
});
