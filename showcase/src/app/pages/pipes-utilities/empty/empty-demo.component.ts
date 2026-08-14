import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-empty-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdEmptyPipe],
  template: `
    <demo-page
      #demoPage
      title="Empty Pipe"
      description="sdEmpty đổi null / undefined / chuỗi rỗng thành dấu gạch chuẩn (--) để bảng và view không bao giờ có ô trống trắng.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-rong-hien-thi-dau-gach') {
        <demo-section
          heading="Giá trị rỗng hiển thị dấu gạch"
          [props]="[{ name: 'sdEmpty', value: 'pipe' }]"
          note="Chỉ đúng ba trường hợp null, undefined và '' được thay thế. Số 0 và chuỗi '0' KHÔNG bị coi là rỗng.">
          <div class="value-grid">
            @for (sample of emptySamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdEmpty }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-co-noi-dung-giu-nguyen') {
        <demo-section
          heading="Giá trị có nội dung giữ nguyên"
          [props]="[{ name: 'sdEmpty', value: 'pipe' }]"
          note="Pipe trả về nguyên giá trị gốc, không ép kiểu và không format — cần chuẩn hoá mảng thì dùng sdView.">
          <div class="value-grid">
            @for (sample of filledSamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdEmpty }}</code>
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
      min-width: 160px;
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
export class EmptyDemoComponent {
  readonly emptySamples = [
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },
    { label: "'' (chuỗi rỗng)", value: '' },
  ];

  readonly filledSamples = [
    { label: "'Nguyễn Văn A'", value: 'Nguyễn Văn A' },
    { label: '0', value: 0 },
    { label: 'false', value: false },
  ];
}
