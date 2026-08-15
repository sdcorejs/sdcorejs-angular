import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdHoverCopyDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-hover-copy-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHoverCopyDirective],
  template: `
    <demo-page
      #demoPage
      title="Hover Copy Directive"
      description="[sdHoverCopy] gắn một nút sao chép vào bất kỳ phần tử nào; nút chỉ hiện khi hover và tự đổi tooltip thành thông báo đã sao chép.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nut-sao-chep-hien-khi-hover') {
        <demo-section
          heading="Nút sao chép hiện khi hover"
          [props]="[{ name: '[sdHoverCopy]', value: 'text' }]"
          note="Rê chuột vào ô bên dưới rồi bấm nút — giá trị vào clipboard và tooltip đổi sang 'Đã sao chép' trong 1 giây.">
          <div class="copy-row">
            <span class="copy-cell" [sdHoverCopy]="orderCode" data-copy-order>{{ orderCode }}</span>
            <span class="copy-cell" [sdHoverCopy]="taxCode" data-copy-tax>{{ taxCode }}</span>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tat-nut-sao-chep') {
        <demo-section
          heading="Tắt nút sao chép"
          [props]="[
            { name: '[sdHoverCopy]', value: 'text' },
            { name: '[sdHoverCopyDisabled]', value: 'true' },
          ]"
          note="Khi disabled, nút bị GỠ khỏi DOM chứ không chỉ ẩn bằng opacity — không còn cách nào bấm trúng nó.">
          <div class="copy-row">
            <span class="copy-cell" [sdHoverCopy]="lockedValue" [sdHoverCopyDisabled]="true" data-copy-disabled>{{ lockedValue }}</span>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .copy-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .copy-cell {
      display: inline-block;
      min-width: 220px;
      padding: 10px 40px 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoverCopyDemoComponent {
  readonly orderCode = 'DH-2026-000184';
  readonly taxCode = '0312345678-001';
  // why: KHÔNG đặt tên field là `secret` — git-secrets của org quét theo tên định danh, nên một
  // hằng demo vô hại cũng chặn commit, và nó chặn ở bundle đã build (published-pages) chứ không
  // phải ở file này, nên thủ phạm rất khó lần ra.
  readonly lockedValue = 'Không cho sao chép';
}
