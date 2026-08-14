import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdFormatDatePipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-format-date-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormatDatePipe],
  template: `
    <demo-page
      #demoPage
      title="Format Date Pipe"
      description="sdFormatDate đưa Date, ISO string hoặc timestamp về một chuỗi ngày theo token của DateUtilities; mặc định là dd/MM/yyyy.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-mac-dinh') {
        <demo-section
          heading="Định dạng mặc định"
          [props]="[{ name: 'sdFormatDate', value: 'dd/MM/yyyy' }]"
          note="Không truyền tham số thì pipe dùng dd/MM/yyyy — dạng ngày chuẩn của các form trong pack.">
          <div class="value-grid">
            @for (sample of sources; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdFormatDate }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-tuy-chinh') {
        <demo-section
          heading="Định dạng tuỳ chỉnh"
          [props]="[{ name: 'sdFormatDate', value: 'format' }]"
          note="Tham số đầu tiên là chuỗi token truyền thẳng cho DateUtilities.toFormat.">
          <div class="value-grid">
            @for (format of formats; track format) {
              <div class="value-cell">
                <span class="value-cell__label">{{ format }}</span>
                <code>{{ isoDate | sdFormatDate: format }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-khong-hop-le') {
        <demo-section
          heading="Giá trị không hợp lệ"
          [props]="[{ name: 'sdFormatDate', value: 'dd/MM/yyyy' }]"
          note="Giá trị không parse được trả về null, nên interpolation ra chuỗi rỗng thay vì 'Invalid Date'.">
          <div class="value-grid">
            @for (sample of invalidSources; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code class="value-cell__empty">{{ sample.value | sdFormatDate }}</code>
              </div>
            }
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
      min-width: 200px;
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
export class FormatDateDemoComponent {
  readonly isoDate = '2026-08-14T09:41:00.000Z';

  readonly sources = [
    { label: 'ISO string', value: '2026-08-14T09:41:00.000Z' },
    { label: 'Date', value: new Date(2026, 7, 14) },
    { label: 'timestamp (ms)', value: 1_786_779_660_000 },
  ];

  readonly formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd MMM yyyy', 'MM/yyyy'];

  readonly invalidSources = [
    { label: 'null', value: null },
    { label: "'khong-phai-ngay'", value: 'khong-phai-ngay' },
  ];
}
