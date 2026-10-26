import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdSegmentedComponent, SdSegmentedItem, SdSegmentedModel } from '@sdcorejs/angular/forms/segmented';
import { SdPageComponent, SdPageWidth } from '@sdcorejs/angular/modules/layout';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-page-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdPageComponent, SdButton, SdTabGroup, SdTab, SdSegmentedComponent],
  template: `
    <demo-page #demoPage
      title="Page"
      description="Khung trang trong shell: header có title, nút quay lại và badge, thân cuộn, cùng subheader, cột phụ và footer khi cần.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-header-co-nut-quay-lai-va-badge') {
      <demo-section heading="Header có nút quay lại và badge" [props]="[{ name: 'backLink', value: 'url | commands' }, { name: 'badges', value: 'SdBadgeData[] (tối đa 2)' }]">
        <div class="frame">
          <sd-page title="Đơn hàng ĐH-2400" description="Tạo lúc 08:30 · Nguyễn An" backLink="." [badges]="orderBadges">
            <sd-button headerRight title="Cập nhật" type="fill" color="primary"></sd-button>
            <div class="body">Nội dung chi tiết đơn hàng.</div>
          </sd-page>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-be-rong-cot-noi-dung') {
      <demo-section heading="Bề rộng cột nội dung" [props]="[{ name: 'width', value: 'full | wide | medium | narrow' }]">
        <sd-segmented label="width" [items]="widths" [(model)]="widthChoice" />
        <div class="frame mt-12">
          <sd-page title="Sản phẩm" description="Cột nội dung canh giữa, padding 16px / 24px." [width]="width()">
            <div class="body">Bề rộng tối đa của cột tính cả 24px padding hai bên.</div>
          </sd-page>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-subheader-cot-phu-va-footer') {
      <demo-section heading="Subheader, cột phụ và footer" [props]="[{ name: 'sdSubheader', value: 'sd-tab-group' }, { name: 'sdAside', value: '320px' }, { name: 'sdFooterLeft', value: 'slot' }, { name: 'sdFooterRight', value: 'slot' }]">
        <div class="frame frame-tall">
          <sd-page title="Nhập dữ liệu" backLink="." width="wide">
            <sd-tab-group sdSubheader>
              <sd-tab label="Nguồn"></sd-tab>
              <sd-tab label="Ánh xạ"></sd-tab>
              <sd-tab label="Xác nhận"></sd-tab>
            </sd-tab-group>
            @for (line of lines; track line) {
              <div class="body">Dòng nội dung {{ line }}</div>
            }
            <div sdAside class="aside">Cột phụ 320px, dính khi cuộn. Dưới 1200px viewport nó xuống dưới nội dung.</div>
            <sd-button sdFooterLeft title="Quay lại" type="outline"></sd-button>
            <sd-button sdFooterRight title="Tiếp tục" type="fill" color="primary"></sd-button>
          </sd-page>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-man-cu-chi-dung-title-va-headerright') {
      <demo-section heading="Màn cũ chỉ dùng title và headerRight" [props]="[{ name: 'title', value: 'string' }, { name: 'headerRight', value: 'slot' }]" note="Không dùng input hay slot mới thì header và thân giữ nguyên như trước; title vẫn xuống dòng.">
        <div class="frame">
          <sd-page title="Danh sách khách hàng">
            <sd-button headerRight title="Tạo mới" prefixIcon="add" type="fill" color="primary"></sd-button>
            <div class="body">Nội dung danh sách.</div>
          </sd-page>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .frame {
      width: 100%;
      box-sizing: border-box;
      height: 280px;
      display: flex;
      flex-direction: column;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }
    .frame-tall {
      height: 420px;
    }
    .body {
      padding: 16px;
      margin-bottom: 8px;
      background: #ffffff;
      border-radius: 6px;
    }
    .aside {
      padding: 16px;
      background: #ffffff;
      border-radius: 6px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageDemoComponent {
  readonly orderBadges: readonly SdBadgeData[] = [
    { title: 'Chờ xác nhận', color: 'warning' },
    { type: 'pair', label: 'Kênh', title: 'Online', color: 'info' },
  ];
  readonly widths: readonly SdSegmentedItem<SdPageWidth>[] = [
    { value: 'full', label: 'full' },
    { value: 'wide', label: 'wide' },
    { value: 'medium', label: 'medium' },
    { value: 'narrow', label: 'narrow' },
  ];
  readonly widthChoice = signal<SdSegmentedModel<SdPageWidth>>('medium');
  readonly width = computed(() => {
    const choice = this.widthChoice();
    return typeof choice === 'string' ? choice : null;
  });
  readonly lines = [1, 2, 3, 4, 5, 6, 7, 8];
}
