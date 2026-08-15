import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-tooltip-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTooltipDirective],
  template: `
    <demo-page
      #demoPage
      title="Tooltip Directive"
      description="[sdTooltip] dựng tooltip qua CDK Overlay: nhận chuỗi hoặc TemplateRef, đổi được vị trí, màu và độ trễ; nội dung tooltip vẫn chọn/copy được.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tooltip-van-ban') {
        <demo-section
          heading="Tooltip văn bản"
          [props]="[{ name: '[sdTooltip]', value: 'text' }]"
          note="Rê chuột vào nút để tooltip hiện bên dưới — vị trí mặc định là bottom.">
          <button type="button" class="demo-target" [sdTooltip]="'Số dư khả dụng sau khi trừ phong toả'" data-tooltip-basic>
            Số dư khả dụng
          </button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vi-tri-mau-va-do-tre') {
        <demo-section
          heading="Vị trí, màu và độ trễ"
          [props]="[
            { name: 'sdTooltipPosition', value: 'top / bottom / left / right' },
            { name: 'sdTooltipColor', value: '#hex' },
            { name: 'sdTooltipDelay', value: 'ms' },
          ]"
          note="Delay tính bằng mili-giây trước khi overlay mở; màu áp thẳng vào nền hộp tooltip.">
          <button type="button" class="demo-target" [sdTooltip]="'Hiện phía trên'" sdTooltipPosition="top" data-tooltip-top>Top</button>
          <button type="button" class="demo-target" [sdTooltip]="'Hiện bên trái'" sdTooltipPosition="left" data-tooltip-left>Left</button>
          <button
            type="button"
            class="demo-target"
            [sdTooltip]="'Đỏ cảnh báo, chờ 600ms'"
            sdTooltipPosition="right"
            sdTooltipColor="#d92d20"
            [sdTooltipDelay]="600"
            data-tooltip-delay>
            Right + delay
          </button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-noi-dung-dang-template') {
        <demo-section
          heading="Nội dung dạng template"
          [props]="[{ name: '[sdTooltip]', value: 'template' }]"
          note="Truyền TemplateRef để tooltip mang markup thật (danh sách, nhãn, liên kết) thay vì một dòng chữ.">
          <button type="button" class="demo-target" [sdTooltip]="richTooltip" data-tooltip-template>Chi tiết phí</button>
          <ng-template #richTooltip>
            <div class="rich-tooltip">
              <strong>Phí giao dịch</strong>
              <span>Phí cố định: 11.000 đ</span>
              <span>Phí theo giá trị: 0,02%</span>
            </div>
          </ng-template>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .demo-target {
      padding: 10px 14px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      cursor: pointer;
      font: inherit;
    }

    .rich-tooltip {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDemoComponent {}
