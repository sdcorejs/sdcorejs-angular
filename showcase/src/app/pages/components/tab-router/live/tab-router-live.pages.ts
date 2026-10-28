import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Routes } from '@angular/router';
import { SD_TAB, SdTabComponent } from '@sdcorejs/angular/components/tab-router';
import { Color } from '@sdcorejs/utils/models';

/**
 * Phần thân dùng chung của các màn trong demo: tiêu đề + một ô nhập để thấy tab giữ state khi chuyển qua lại, và một ô
 * đánh dấu "chưa lưu" (`SdTabInfo.dirty`, đợt 3 · 3d) gửi qua `tabInfoChanges` của chính tab.
 */
@Component({
  selector: 'app-tab-live-page',
  standalone: true,
  template: `
    <section class="tab-live-page">
      <h2>{{ heading() }}</h2>
      <p>{{ description() }}</p>
      <label>
        <span>Ghi chú của tab này</span>
        <input type="text" placeholder="Gõ gì đó rồi chuyển sang tab khác" />
      </label>
      @if (tab) {
        <label class="tab-live-page__dirty">
          <input type="checkbox" data-tab-live="dirty" [checked]="dirty()" (change)="toggleDirty()" />
          <span>Có thay đổi chưa lưu (chấm trên tab)</span>
        </label>
      }
    </section>
  `,
  styles: [
    `
      .tab-live-page {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 640px;
        padding: 20px 24px;
      }
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        line-height: 28px;
      }
      p {
        margin: 0;
        color: var(--sd-text-secondary);
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: var(--sd-text-secondary);
      }
      .tab-live-page__dirty {
        flex-direction: row;
        align-items: center;
        gap: 8px;
        color: var(--sd-text);
      }
      input[type='text'] {
        height: 36px;
        padding: 0 10px;
        border: 1px solid var(--sd-control-border);
        border-radius: 6px;
        background: var(--sd-surface);
        color: var(--sd-text);
        font: inherit;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLivePageComponent {
  readonly heading = input.required<string>();
  readonly description = input('Nội dung trong tab còn nguyên khi bạn chuyển sang tab khác rồi quay lại.');
  readonly icon = input<string>();
  readonly color = input<Color>();
  readonly tab = inject(SD_TAB, { optional: true });
  readonly dirty = signal(false);

  // why: tab info gửi qua `tabInfoChanges` thay cả bộ thông tin của builder, nên gửi lại tên, icon và màu cùng `dirty`.
  toggleDirty = (): void => {
    this.dirty.update(dirty => !dirty);
    this.tab?.tabInfoChanges.next({ name: this.heading(), icon: this.icon(), color: this.color(), dirty: this.dirty() });
  };
}

@SdTabComponent({ component: TabLiveOverviewComponent, name: 'Tổng quan', icon: 'dashboard' })
@Component({
  selector: 'app-tab-live-overview',
  standalone: true,
  imports: [TabLivePageComponent],
  template: `<app-tab-live-page heading="Tổng quan" icon="dashboard" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLiveOverviewComponent {}

@SdTabComponent({
  component: TabLiveOrderComponent,
  name: ({ params }) => `Đơn hàng #DH-${params.id}`,
  icon: 'receipt_long',
  color: 'success',
})
@Component({
  selector: 'app-tab-live-order',
  standalone: true,
  imports: [TabLivePageComponent],
  template: `<app-tab-live-page [heading]="'Đơn hàng #DH-' + id" icon="receipt_long" color="success" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLiveOrderComponent {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
}

@SdTabComponent({ component: TabLiveCustomersComponent, name: 'Danh sách khách hàng', icon: 'group' })
@Component({
  selector: 'app-tab-live-customers',
  standalone: true,
  imports: [TabLivePageComponent],
  template: `<app-tab-live-page heading="Danh sách khách hàng" icon="group" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLiveCustomersComponent {}

@SdTabComponent({
  component: TabLiveContractComponent,
  name: ({ params }) => `Hợp đồng ${params.id}`,
  icon: 'description',
  color: 'warning',
})
@Component({
  selector: 'app-tab-live-contract',
  standalone: true,
  imports: [TabLivePageComponent],
  template: `<app-tab-live-page [heading]="'Hợp đồng ' + id" icon="description" color="warning" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLiveContractComponent {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
}

// Tên dài, không icon: tên bị cắt nên tooltip lặp lại tên đầy đủ.
@SdTabComponent({ component: TabLiveReportComponent, name: 'Báo cáo doanh thu quý 3 năm 2026 theo từng chi nhánh' })
@Component({
  selector: 'app-tab-live-report',
  standalone: true,
  imports: [TabLivePageComponent],
  template: `<app-tab-live-page heading="Báo cáo doanh thu quý 3 năm 2026 theo từng chi nhánh" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLiveReportComponent {}

/** Route con của `/demo/tab-router`; mỗi màn được `@SdTabComponent` khai tên, icon và màu cho tab. */
export const TAB_ROUTER_LIVE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: TabLiveOverviewComponent },
  { path: 'orders/:id', component: TabLiveOrderComponent },
  { path: 'customers', component: TabLiveCustomersComponent },
  { path: 'contracts/:id', component: TabLiveContractComponent },
  { path: 'reports', component: TabLiveReportComponent },
];
