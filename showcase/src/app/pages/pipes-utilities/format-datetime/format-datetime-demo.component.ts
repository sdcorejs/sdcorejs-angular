import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-format-datetime-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormatDatetimePipe],
  template: `
    <demo-page
      #demoPage
      title="Format Datetime Pipe"
      description="sdFormatDatetime là bản kèm giờ của sdFormatDate: cùng bộ token, chỉ khác định dạng mặc định dd/MM/yyyy HH:mm:ss.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-mac-dinh') {
        <demo-section
          heading="Định dạng mặc định"
          [props]="[{ name: 'sdFormatDatetime', value: 'dd/MM/yyyy HH:mm:ss' }]"
          note="Dùng cho cột nhật ký, lịch sử thao tác — nơi cần đủ giây để phân biệt hai bản ghi liền nhau.">
          <div class="value-grid">
            @for (sample of sources; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdFormatDatetime }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-lay-phan-gio') {
        <demo-section
          heading="Chỉ lấy phần giờ"
          [props]="[{ name: 'sdFormatDatetime', value: 'format' }]"
          note="Truyền token ngắn hơn khi cột đã có ngày ở chỗ khác; pipe không ép phải hiện đủ ngày + giờ.">
          <div class="value-grid">
            @for (format of formats; track format) {
              <div class="value-cell">
                <span class="value-cell__label">{{ format }}</span>
                <code>{{ isoDatetime | sdFormatDatetime: format }}</code>
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
      min-width: 220px;
      padding: 10px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }

    .value-cell__label {
      font-size: 12px;
      color: #6b6b6b;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatDatetimeDemoComponent {
  readonly isoDatetime = '2026-08-14T09:41:07.000Z';

  readonly sources = [
    { label: 'ISO string', value: '2026-08-14T09:41:07.000Z' },
    { label: 'Date', value: new Date(2026, 7, 14, 16, 41, 7) },
  ];

  readonly formats = ['HH:mm', 'HH:mm:ss', 'dd/MM HH:mm', 'yyyy-MM-dd HH:mm:ss'];
}
