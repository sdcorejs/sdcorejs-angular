import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdViewPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-view-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdViewPipe],
  template: `
    <demo-page
      #demoPage
      title="View Pipe"
      description="sdView là bản chuẩn hoá hiển thị: giá trị rỗng (kể cả NaN và mảng rỗng) thành dấu gạch, mảng có phần tử thành chuỗi ngăn cách bằng dấu phẩy.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuan-hoa-gia-tri-rong') {
        <demo-section
          heading="Chuẩn hoá giá trị rỗng"
          [props]="[{ name: 'sdView', value: 'pipe' }]"
          note="So với sdEmpty, sdView bắt thêm NaN và mảng rỗng — đó là hai giá trị hay lọt lưới nhất khi render dữ liệu API.">
          <div class="value-grid">
            @for (sample of emptySamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdView }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gop-mang-thanh-chuoi') {
        <demo-section
          heading="Gộp mảng thành chuỗi"
          [props]="[{ name: 'sdView', value: 'pipe' }]"
          note="Mỗi phần tử được chuẩn hoá đệ quy trước khi nối, nên phần tử rỗng bên trong mảng cũng thành dấu gạch thay vì biến mất.">
          <div class="value-grid">
            @for (sample of arraySamples; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdView }}</code>
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

    code {
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDemoComponent {
  readonly emptySamples = [
    { label: 'null', value: null },
    { label: "'' (chuỗi rỗng)", value: '' },
    { label: 'Number.NaN', value: Number.NaN },
    { label: '[] (mảng rỗng)', value: [] },
  ];

  readonly arraySamples = [
    { label: "['Kế toán', 'Nhân sự']", value: ['Kế toán', 'Nhân sự'] },
    { label: "['Kế toán', null, 'Nhân sự']", value: ['Kế toán', null, 'Nhân sự'] },
    { label: '[1, 2, 3]', value: [1, 2, 3] },
  ];
}
