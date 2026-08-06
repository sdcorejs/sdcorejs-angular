import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-quick-action-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQuickAction, SdButton],
  template: `
    <demo-page #demoPage
      title="Quick Action"
      description="Thanh toolbar nổi ở đáy màn hình — thường dùng cho bulk action khi user chọn nhiều dòng trong sd-table.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bulk-action-nhieu-dong') {
      <demo-section heading="Bulk action — nhiều dòng" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdMessage', value: 'template' }, { name: 'sdAction', value: 'template' }]">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <sd-button type="light" color="primary" prefixIcon="add_circle" title="Thêm chọn (+1 dòng)" (click)="addSelection()"></sd-button>
          <sd-button type="light" color="secondary" prefixIcon="remove_circle" title="Bỏ chọn (-1)" (click)="removeSelection()"></sd-button>
          <sd-button type="outline" color="secondary" prefixIcon="clear_all" title="Xóa hết" (click)="clearSelection()"></sd-button>
          <span style="color: #555; font-size: 13px;">Đã chọn: <strong>{{ selectedCount() }}</strong> dòng</span>
        </div>

        <sd-quick-action [opened]="hasSelection()">
          <div sdMessage>Đã chọn <strong>{{ selectedCount() }}</strong> bản ghi</div>
          <div sdAction style="display: flex; gap: 8px;">
            <sd-button type="fill" color="primary" prefixIcon="check" title="Phê duyệt" (click)="bulkApprove()"></sd-button>
            <sd-button type="outline" color="error" prefixIcon="delete" title="Xóa" (click)="bulkDelete()"></sd-button>
            <sd-button type="text" color="secondary" prefixIcon="close" tooltip="Bỏ chọn" (click)="clearSelection()"></sd-button>
          </div>
        </sd-quick-action>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thong-bao-trang-thai') {
      <demo-section heading="Thông báo trạng thái" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdMessage', value: 'template' }]">
        <sd-button type="light" color="primary" prefixIcon="sync" title="Bật / tắt đồng bộ" (click)="toggleSync()"></sd-button>

        <sd-quick-action [opened]="syncing()">
          <span sdMessage>Đang đồng bộ dữ liệu...</span>
        </sd-quick-action>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-undo-toast') {
      <demo-section heading="Undo toast" [props]="[{ name: 'opened', value: 'true' }, { name: 'sdAction', value: 'template' }]">
        <sd-button type="light" color="error" prefixIcon="delete" title="Xóa bản ghi" (click)="simulateDelete()"></sd-button>

        <sd-quick-action [opened]="lastDeleted() !== null">
          <span sdMessage>Đã xóa <strong>{{ lastDeleted() }}</strong>.</span>
          <sd-button sdAction type="text" color="primary" prefixIcon="undo" title="Hoàn tác" (click)="undo()"></sd-button>
        </sd-quick-action>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionDemoComponent {
  readonly selectedCount = signal(0);
  readonly hasSelection = computed(() => this.selectedCount() > 0);

  readonly syncing = signal(false);
  readonly lastDeleted = signal<string | null>(null);

  addSelection() { this.selectedCount.update((v) => v + 1); }
  removeSelection() { this.selectedCount.update((v) => Math.max(0, v - 1)); }
  clearSelection() { this.selectedCount.set(0); }
  bulkApprove() { this.selectedCount.set(0); }
  bulkDelete() { this.selectedCount.set(0); }

  toggleSync() {
    this.syncing.update((v) => !v);
    if (this.syncing()) {
      setTimeout(() => this.syncing.set(false), 3000);
    }
  }

  simulateDelete() {
    this.lastDeleted.set('Khách hàng #' + Math.floor(Math.random() * 1000));
    setTimeout(() => {
      if (this.lastDeleted() !== null) this.lastDeleted.set(null);
    }, 5000);
  }

  undo() { this.lastDeleted.set(null); }
}
