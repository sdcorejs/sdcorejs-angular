import { Component, computed, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SD_CORE_CONFIGURATION, type ISdCoreConfiguration } from '@sdcorejs/angular/configurations';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTimeline } from './timeline.component';
import type { SdTimelineItem, SdTimelineLoadArgs, SdTimelineLoadResult, SdTimelineOption } from './timeline.model';
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

interface Deferred {
  args: SdTimelineLoadArgs;
  resolve: (result: SdTimelineLoadResult) => void;
  reject: (error: unknown) => void;
}

const page = (prefix: string, count: number, startHour = 9, day = '2026-11-08'): SdTimelineItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}${index}`,
    at: `${day}T${String(Math.max(startHour - index, 0)).padStart(2, '0')}:00:00Z`,
    content: { layout: 'event', data: { title: `${prefix}${index}` } },
  }));

@Component({
  standalone: true,
  imports: [SdTimeline],
  template: `<sd-timeline #timeline data-testid="paged" [option]="option()" (sdLoadError)="errors.push($event)" />`,
})
class PagedTimelineHost {
  readonly calls: Deferred[] = [];
  readonly errors: unknown[] = [];
  readonly loadMore = signal<'button' | 'auto'>('button');
  readonly option = computed<SdTimelineOption>(() => ({
    loadMore: this.loadMore(),
    dataSource: {
      onLoad: args =>
        new Promise<SdTimelineLoadResult>((resolve, reject) => {
          this.calls.push({ args, resolve, reject });
        }),
    },
  }));
  readonly timeline = viewChild.required<SdTimeline>('timeline');
}

describe('SdTimeline with a data source', () => {
  let fixture: ComponentFixture<PagedTimelineHost>;
  let host: PagedTimelineHost;
  const root = (): HTMLElement => fixture.nativeElement.querySelector('[data-testid="paged"]') as HTMLElement;
  const section = (): HTMLElement => root().querySelector('section') as HTMLElement;
  const flush = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const last = (): Deferred => host.calls[host.calls.length - 1];
  const button = (selector: string): HTMLButtonElement => root().querySelector(selector) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagedTimelineHost],
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone: 'Asia/Ho_Chi_Minh' } as ISdCoreConfiguration }],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
  });

  const create = async (): Promise<void> => {
    fixture = TestBed.createComponent(PagedTimelineHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await flush();
  };

  it('shows skeleton rows while the first page loads, then the items and a load-more button', async () => {
    await create();
    expect(host.calls.length).toBe(1);
    expect(host.calls[0].args.cursor).toBeNull();
    expect(host.calls[0].args.pageSize).toBe(20);
    expect(root().querySelectorAll('.sd-timeline__skeleton').length).toBe(3);
    expect(section().getAttribute('aria-busy')).toBe('true');
    host.calls[0].resolve({ items: page('a', 2), nextCursor: 'c2' });
    await flush();
    expect(root().querySelectorAll('.sd-timeline__item').length).toBe(2);
    expect(section().hasAttribute('aria-busy')).toBeFalse();
    expect(button('.sd-timeline__load-more').textContent).toContain('Xem thêm 20 mục');
  });

  it('appends a page that starts on the same day to the last day group', async () => {
    await create();
    host.calls[0].resolve({ items: page('a', 2, 9), nextCursor: 'c2' });
    await flush();
    button('.sd-timeline__load-more').click();
    await flush();
    expect(last().args.cursor).toBe('c2');
    expect(root().textContent).toContain('Đang tải…');
    last().resolve({ items: page('b', 2, 5), nextCursor: null });
    await flush();
    expect(root().querySelectorAll('.sd-timeline__day').length).toBe(1);
    expect(root().querySelectorAll('.sd-timeline__item').length).toBe(4);
    expect(root().querySelector('.sd-timeline__load-more')).toBeNull();
  });

  it('shows the first-load error instead of the empty text and retries from the start', async () => {
    await create();
    host.calls[0].reject(new Error('boom'));
    await flush();
    expect(root().textContent).toContain('Không tải được lịch sử.');
    expect(root().textContent).not.toContain('Chưa có hoạt động.');
    expect(host.errors.length).toBe(1);
    button('.sd-timeline__retry').click();
    await flush();
    expect(host.calls.length).toBe(2);
    expect(last().args.cursor).toBeNull();
  });

  it('keeps the items after a load-more error and retries with the same cursor', async () => {
    await create();
    host.calls[0].resolve({ items: page('a', 2), nextCursor: 'c2' });
    await flush();
    button('.sd-timeline__load-more').click();
    await flush();
    last().reject(new Error('boom'));
    await flush();
    expect(root().querySelectorAll('.sd-timeline__item').length).toBe(2);
    expect(root().textContent).toContain('Không tải thêm được.');
    button('.sd-timeline__more-error .sd-timeline__link-button').click();
    await flush();
    expect(last().args.cursor).toBe('c2');
  });

  it('aborts the running load on reload and ignores its result', async () => {
    await create();
    const first = host.calls[0];
    host.timeline().reload();
    await flush();
    expect(first.args.signal.aborted).toBeTrue();
    first.resolve({ items: page('old', 1), nextCursor: null });
    await flush();
    expect(root().querySelector('[data-item-id="old0"]')).toBeNull();
    last().resolve({ items: page('new', 1), nextCursor: null });
    await flush();
    expect(root().querySelector('[data-item-id="new0"]')).not.toBeNull();
  });

  it('keeps the shown items with a progress bar while reloading', async () => {
    await create();
    host.calls[0].resolve({ items: page('a', 2), nextCursor: null });
    await flush();
    host.timeline().reload();
    await flush();
    expect(root().querySelectorAll('.sd-timeline__item').length).toBe(2);
    expect(root().querySelector('.sd-timeline__progress')).not.toBeNull();
  });

  it('loads the next page when the sentinel intersects in auto mode', async () => {
    let callback: IntersectionObserverCallback | null = null;
    const original = window.IntersectionObserver;
    (window as { IntersectionObserver: unknown }).IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    };
    try {
      fixture = TestBed.createComponent(PagedTimelineHost);
      host = fixture.componentInstance;
      host.loadMore.set('auto');
      fixture.detectChanges();
      await flush();
      host.calls[0].resolve({ items: page('a', 2), nextCursor: 'c2' });
      await flush();
      expect(root().querySelector('.sd-timeline__list')?.getAttribute('role')).toBe('feed');
      expect(root().querySelector('article')?.getAttribute('aria-setsize')).toBe('-1');
      expect(callback).not.toBeNull();
      callback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      await flush();
      expect(last().args.cursor).toBe('c2');
    } finally {
      (window as { IntersectionObserver: unknown }).IntersectionObserver = original;
    }
  });
});

describe('SdTimeline dev checks', () => {
  it('reports a duplicate id once', async () => {
    const errorSpy = spyOn(console, 'error');
    await TestBed.configureTestingModule({ imports: [TimelineHost] }).compileComponents();
    const fixture = TestBed.createComponent(TimelineHost);
    fixture.componentInstance.items.set([...ITEMS, { ...ITEMS[4] }]);
    fixture.detectChanges();
    fixture.componentInstance.items.set([...ITEMS, { ...ITEMS[4] }, { ...ITEMS[4] }]);
    fixture.detectChanges();
    expect(errorSpy.calls.allArgs().filter(args => String(args[0]).includes('duplicate')).length).toBe(1);
  });
});
