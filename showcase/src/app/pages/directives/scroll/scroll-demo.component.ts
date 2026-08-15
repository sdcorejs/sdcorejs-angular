import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdScrollDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-scroll-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdScrollDirective],
  template: `
    <demo-page
      #demoPage
      title="Scroll Directive"
      description="[sdScroll] giữ overflow-y: auto thường trực nhưng chỉ bật overflow-x khi con trỏ nằm trong vùng — thanh cuộn ngang không chiếm chỗ lúc chỉ đọc.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thanh-cuon-ngang-chi-hien-khi-hover') {
        <demo-section
          heading="Thanh cuộn ngang chỉ hiện khi hover"
          [props]="[{ name: '[sdScroll]', value: 'true' }]"
          note="Rê chuột vào khung để thấy thanh cuộn ngang xuất hiện; đưa chuột ra ngoài, overflow-x quay lại hidden. Directive cũng phát scrollTop() để cuộn khung về đầu.">
          <div class="scroll-frame" sdScroll #frame data-scroll-frame>
            <div class="scroll-wide">
              @for (row of rows; track row) {
                <p>{{ row }}</p>
              }
            </div>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .scroll-frame {
      width: 100%;
      max-width: 520px;
      height: 160px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      padding: 12px;
    }

    .scroll-wide {
      width: 900px;
    }

    .scroll-wide p {
      margin: 0 0 8px;
      white-space: nowrap;
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollDemoComponent {
  readonly rows = Array.from(
    { length: 12 },
    (_, index) => `Dòng ${index + 1} — nội dung rất dài để ép khung phải cuộn theo chiều ngang khi hover`
  );
}
