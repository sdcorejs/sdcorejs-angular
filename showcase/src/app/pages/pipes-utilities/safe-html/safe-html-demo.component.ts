import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-safe-html-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdSafeHtmlPipe],
  template: `
    <demo-page
      #demoPage
      title="Safe Html Pipe"
      description="sdSafeHtml sanitize theo mặc định; bỏ qua sanitize là một lựa chọn phải khai báo rõ ràng cho từng chỗ dùng.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sanitize-mac-dinh') {
        <demo-section
          heading="Sanitize mặc định"
          [props]="[{ name: 'sdSafeHtml', value: 'pipe' }]"
          note="Thẻ script, thuộc tính on* và url javascript: bị loại bỏ; phần markup lành tính còn lại vẫn render. Đây là nhánh dùng cho mọi dữ liệu đến từ server.">
          <div class="html-pair">
            <div class="html-cell">
              <span class="html-cell__label">Chuỗi gốc</span>
              <code>{{ untrusted }}</code>
            </div>
            <div class="html-cell">
              <span class="html-cell__label">Kết quả render</span>
              <div class="html-cell__output" data-safe-html-sanitized [innerHTML]="untrusted | sdSafeHtml"></div>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tin-cay-co-chu-dich') {
        <demo-section
          heading="Tin cậy có chủ đích"
          [props]="[{ name: 'sdSafeHtml', value: 'trusted' }]"
          note="Tham số true gọi bypassSecurityTrustHtml. Chỉ dùng cho markup do chính app viết ra, ví dụ một sprite SVG nội bộ — không bao giờ cho dữ liệu người dùng nhập.">
          <div class="html-pair">
            <div class="html-cell">
              <span class="html-cell__label">Chuỗi gốc</span>
              <code>{{ appAuthored }}</code>
            </div>
            <div class="html-cell">
              <span class="html-cell__label">Kết quả render</span>
              <div class="html-cell__output" data-safe-html-trusted [innerHTML]="appAuthored | sdSafeHtml: true"></div>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .html-pair {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      width: 100%;
    }

    .html-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1 1 260px;
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .html-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    .html-cell__output {
      min-height: 20px;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SafeHtmlDemoComponent {
  readonly untrusted = '<b>Ghi chú từ khách hàng</b><img src="x" onerror="alert(1)"><script>alert(2)</script>';
  readonly appAuthored = '<span style="color:#1677ff;font-weight:600">Nhãn do app tự dựng</span>';
}
