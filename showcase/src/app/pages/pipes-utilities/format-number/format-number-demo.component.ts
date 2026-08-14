import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-format-number-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormatNumberPipe],
  template: `
    <demo-page
      #demoPage
      title="Format Number Pipe"
      description="sdFormatNumber nhóm hàng nghìn theo kiểu quốc tế hoặc kiểu Việt Nam. Không truyền kiểu thì pipe lấy format.number từ SD_CORE_CONFIGURATION.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-quoc-te') {
        <demo-section
          heading="Chuẩn quốc tế"
          [props]="[{ name: 'sdFormatNumber', value: '1,234,567.89' }]"
          note="Dấu phẩy ngăn hàng nghìn, dấu chấm ngăn thập phân. Đây cũng là mặc định khi app chưa cấu hình format.number.">
          <div class="value-grid">
            @for (sample of amounts; track sample) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample }}</span>
                <code>{{ sample | sdFormatNumber: 2 : '1,234,567.89' }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-viet-nam') {
        <demo-section
          heading="Chuẩn Việt Nam"
          [props]="[{ name: 'sdFormatNumber', value: '1.234.567,89' }]"
          note="Đảo vai trò hai dấu. Đặt một lần ở SD_CORE_CONFIGURATION là mọi pipe và form field trong app đi theo, không cần truyền tham số.">
          <div class="value-grid">
            @for (sample of amounts; track sample) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample }}</span>
                <code>{{ sample | sdFormatNumber: 2 : '1.234.567,89' }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-chu-so-thap-phan') {
        <demo-section
          heading="Số chữ số thập phân"
          [props]="[{ name: 'sdFormatNumber', value: 'digits' }]"
          note="Tham số đầu là số chữ số sau dấu thập phân (mặc định 2). Giá trị không phải số trả về chuỗi rỗng.">
          <div class="value-grid">
            @for (digits of digitOptions; track digits) {
              <div class="value-cell">
                <span class="value-cell__label">digits = {{ digits }}</span>
                <code>{{ 1234567.891 | sdFormatNumber: digits : '1,234,567.89' }}</code>
              </div>
            }
            <div class="value-cell">
              <span class="value-cell__label">'khong-phai-so'</span>
              <code class="value-cell__empty">{{ 'khong-phai-so' | sdFormatNumber }}</code>
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .value-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 180px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    .value-cell__empty {
      min-height: 18px;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatNumberDemoComponent {
  readonly amounts = [1234567.891, 250000, 0.5, -98765.4];
  readonly digitOptions = [0, 2, 4];
}
