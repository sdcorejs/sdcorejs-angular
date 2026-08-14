import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTimeDifferentPipe } from '@sdcorejs/angular/pipes';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-time-different-demo',
  standalone: true,
  imports: [AsyncPipe, DemoPageComponent, DemoSectionComponent, SdTimeDifferentPipe],
  template: `
    <demo-page
      #demoPage
      title="Time Different Pipe"
      description="sdTimeDifferent trả về một Observable đếm lại mỗi giây khi mốc thời gian còn nằm trong ngưỡng tương đối, rồi tự complete và chuyển sang ngày tuyệt đối.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thoi-gian-tuong-doi') {
        <demo-section
          heading="Thời gian tương đối"
          [props]="[
            { name: 'sdTimeDifferent', value: 'format' },
            { name: 'different', value: 'second / minute / hour / day / month' },
          ]"
          note="Tham số thứ hai là ngưỡng: dưới ngưỡng thì hiện khoảng cách tương đối và tick mỗi giây, chạm ngưỡng thì rơi về format.">
          <div class="value-grid">
            @for (sample of recent; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdTimeDifferent: 'dd/MM/yyyy HH:mm' : 'day' | async }}</code>
              </div>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-qua-nguong-thi-ve-ngay-tuyet-doi') {
        <demo-section
          heading="Quá ngưỡng thì về ngày tuyệt đối"
          [props]="[{ name: 'sdTimeDifferent', value: 'format' }]"
          note="Giá trị đã cũ hơn ngưỡng KHÔNG tạo timer nào — pipe trả về of(...) ngay, nên một danh sách dài không sinh hàng loạt interval thừa.">
          <div class="value-grid">
            @for (sample of old; track sample.label) {
              <div class="value-cell">
                <span class="value-cell__label">{{ sample.label }}</span>
                <code>{{ sample.value | sdTimeDifferent: 'dd/MM/yyyy HH:mm' : 'minute' | async }}</code>
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
export class TimeDifferentDemoComponent {
  readonly #now = Date.now();

  readonly recent = [
    { label: '30 giây trước', value: new Date(this.#now - 30 * 1000) },
    { label: '12 phút trước', value: new Date(this.#now - 12 * 60 * 1000) },
    { label: '5 giờ trước', value: new Date(this.#now - 5 * 60 * 60 * 1000) },
  ];

  readonly old = [
    { label: '3 giờ trước (ngưỡng minute)', value: new Date(this.#now - 3 * 60 * 60 * 1000) },
    { label: '2 năm trước', value: new Date(this.#now - 730 * 24 * 60 * 60 * 1000) },
  ];
}
