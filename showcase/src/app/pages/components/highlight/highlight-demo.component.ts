import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdHighlight } from '@sdcorejs/angular/components/highlight';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { sdNormalizeSearchText } from '@sdcorejs/angular/utilities/extensions';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-highlight-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHighlight, SdInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      #demoPage
      title="Highlight"
      description="Tô từ khoá trong văn bản — không phân biệt dấu tiếng Việt (kể cả đ/Đ) và hoa-thường, luôn render dạng text.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tim-kiem-khong-dau') {
        <demo-section
          heading="Tìm kiếm không dấu"
          [props]="[
            { name: 'text', value: 'string' },
            { name: 'term', value: 'string' },
          ]"
          note="Gõ 'duc', 'ha noi' hoặc 'NGUYEN' — kết quả khớp cả chữ có dấu.">
          <div class="d-flex flex-column gap-16 w-full">
            <sd-input label="Từ khoá" [(model)]="keyword" [form]="form" hideInlineError></sd-input>
            <ul class="d-flex flex-column gap-8">
              @for (name of filteredNames(); track name) {
                <li><sd-highlight [text]="name" [term]="keyword()"></sd-highlight></li>
              } @empty {
                <li>Không có kết quả</li>
              }
            </ul>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-du-lieu-chua-markup') {
        <demo-section heading="Dữ liệu chứa markup" note="Markup trong dữ liệu hiện nguyên dạng chữ — component không dùng innerHTML.">
          <sd-highlight [text]="unsafeText" term="duc"></sd-highlight>
        </demo-section>
      }
    </demo-page>
  `,
})
export class HighlightDemoComponent {
  readonly form = new FormGroup({});
  readonly keyword = signal('duc');

  readonly names = ['Nguyễn Văn Đức', 'Trần Thị Hà', 'Lê Minh Đạt', 'Phạm Đức Anh', 'Hoàng Thu Hà Nội', 'Công ty TNHH Đông Dương (ĐD)'];

  readonly unsafeText = '<b>Đức</b> <img src=x onerror="alert(1)"> vẫn là chữ';

  readonly filteredNames = computed(() => {
    const term = sdNormalizeSearchText(this.keyword().trim());
    return term ? this.names.filter(name => sdNormalizeSearchText(name).includes(term)) : this.names;
  });
}
