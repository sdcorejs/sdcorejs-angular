import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { CardCompareExampleComponent } from './examples/card-compare.example';
import { CardMultipleExampleComponent } from './examples/card-multiple.example';
import { CardScoreComparisonExampleComponent } from './examples/card-score-comparison.example';
import { CardScoreCompactExampleComponent } from './examples/card-score-compact.example';
import { CardScoreFilterExampleComponent } from './examples/card-score-filter.example';
import { CardScoreIconFilterExampleComponent } from './examples/card-score-icon-filter.example';
import { CardScoreIconInlineExampleComponent } from './examples/card-score-icon-inline.example';
import { CardScoreIconStatusExampleComponent } from './examples/card-score-icon-status.example';
import { CardScoreIconTileExampleComponent } from './examples/card-score-icon-tile.example';
import { CardScoreMetricExampleComponent } from './examples/card-score-metric.example';
import { CardScoreProgressExampleComponent } from './examples/card-score-progress.example';
import { CardSingleExampleComponent } from './examples/card-single.example';
import { CardStandaloneExampleComponent } from './examples/card-standalone.example';
import { CardStatesExampleComponent } from './examples/card-states.example';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    CardStandaloneExampleComponent,
    CardSingleExampleComponent,
    CardMultipleExampleComponent,
    CardCompareExampleComponent,
    CardStatesExampleComponent,
    CardScoreMetricExampleComponent,
    CardScoreIconInlineExampleComponent,
    CardScoreIconTileExampleComponent,
    CardScoreIconStatusExampleComponent,
    CardScoreIconFilterExampleComponent,
    CardScoreFilterExampleComponent,
    CardScoreProgressExampleComponent,
    CardScoreComparisonExampleComponent,
    CardScoreCompactExampleComponent,
  ],
  template: `<demo-page
    #demoPage
    title="Card"
    description="Selectable shell cho nội dung do consumer sở hữu; dùng độc lập hoặc trong group single/multiple.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-standalone-card') {
      <demo-section
        heading="Standalone card"
        data-example-typescript="./examples/card-standalone.example.ts"
        data-example-template="./examples/card-standalone.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'selected', value: 'readonly Signal<boolean>' },
          { name: 'click', value: 'Event' },
          { name: 'autoId', value: 'stable E2E suffix' },
        ]"
        note="Click card để toggle state; consumer đọc state mới qua #card=sdCard.">
        <app-card-standalone-example></app-card-standalone-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-single-selection') {
      <demo-section
        heading="Single selection"
        data-example-typescript="./examples/card-single.example.ts"
        data-example-template="./examples/card-single.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'model', value: 'two-way' },
          { name: 'sdChange', value: 'user changes only' },
          { name: 'autoId', value: 'group / card' },
        ]"
        note="Click lại card đang chọn để clear model về null.">
        <app-card-single-example></app-card-single-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-selection') {
      <demo-section
        heading="Multiple selection"
        data-example-typescript="./examples/card-multiple.example.ts"
        data-example-template="./examples/card-multiple.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'multiple', value: 'true' },
          { name: 'model', value: 'immutable array' },
          { name: 'autoId', value: 'group / card' },
        ]">
        <app-card-multiple-example></app-card-multiple-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-object-comparewith') {
      <demo-section
        heading="Object compareWith"
        data-example-typescript="./examples/card-compare.example.ts"
        data-example-template="./examples/card-compare.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'compareWith', value: 'business key' },
          { name: 'autoId', value: 'group / card' },
        ]"
        note="Model và option là hai object khác reference nhưng card ACTIVE vẫn selected theo code.">
        <app-card-compare-example></app-card-compare-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-disabled-va-color') {
      <demo-section
        heading="Disabled và color"
        data-example-typescript="./examples/card-states.example.ts"
        data-example-template="./examples/card-states.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'disabled', value: 'card / group' },
          { name: 'color', value: 'group / card override' },
          { name: 'autoId', value: 'group / card' },
        ]"
        note="Gồm selected+disabled, group disabled, inherited color, override color và standalone selected state.">
        <app-card-states-example></app-card-states-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-metric-chi-doc') {
      <demo-section
        heading="Metric chỉ đọc"
        data-example-typescript="./examples/card-score-metric.example.ts"
        data-example-template="./examples/card-score-metric.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[{ name: 'sd-section', value: 'hideHeader' }]"
        note="Có đơn vị và phạm vi; không tạo hover/cursor hành động khi không click được.">
        <app-card-score-metric-example></app-card-score-metric-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-icon-canh-nhan') {
      <demo-section
        heading="Icon cạnh nhãn"
        data-example-typescript="./examples/card-score-icon-inline.example.ts"
        data-example-template="./examples/card-score-icon-inline.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[
          { name: 'sd-icon', value: 'inline' },
          { name: 'sd-section', value: 'hideHeader' },
        ]"
        note="Icon 20–24px cùng hàng nhãn; giá trị vẫn là điểm nhìn chính. Icon không thay tên chỉ số.">
        <app-card-score-icon-inline-example></app-card-score-icon-inline-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-icon-trong-nen-mau') {
      <demo-section
        heading="Icon trong nền màu"
        data-example-typescript="./examples/card-score-icon-tile.example.ts"
        data-example-template="./examples/card-score-icon-tile.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[
          { name: 'sd-icon', value: 'tile 44px' },
          { name: 'bg-*-light', value: 'utility' },
        ]"
        note="Icon 24px trong ô 44px; màu theo vai trò/status, cùng một phong cách icon. Metric chỉ đọc không có hành vi click.">
        <app-card-score-icon-tile-example></app-card-score-icon-tile-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-icon-trang-thai') {
      <demo-section
        heading="Icon trạng thái"
        data-example-typescript="./examples/card-score-icon-status.example.ts"
        data-example-template="./examples/card-score-icon-status.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[{ name: 'sd-icon', value: 'schedule / sync / check_circle' }]"
        note="Clock / đang xử lý / check đi cùng nhãn trạng thái; chữ giải thích ý nghĩa, không chỉ màu.">
        <app-card-score-icon-status-example></app-card-score-icon-status-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-icon-click-de-loc') {
      <demo-section
        heading="Icon + click để lọc"
        data-example-typescript="./examples/card-score-icon-filter.example.ts"
        data-example-template="./examples/card-score-icon-filter.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[
          { name: 'sd-card-group', value: 'single' },
          { name: 'model', value: 'two-way' },
          { name: 'sdChange', value: 'null → Tất cả' },
        ]"
        note="Cả card là một button, icon decorative; aria-pressed và dấu chọn thể hiện selection. Click lại về Tất cả; counts không đổi theo lựa chọn.">
        <app-card-score-icon-filter-example></app-card-score-icon-filter-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-count-card-de-loc') {
      <demo-section
        heading="Count card để lọc"
        data-example-typescript="./examples/card-score-filter.example.ts"
        data-example-template="./examples/card-score-filter.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[
          { name: 'sd-card-group', value: 'single' },
          { name: 'model', value: 'two-way' },
          { name: 'sd-input', value: 'search' },
        ]"
        note="Một card được chọn; aria-pressed, toggle, count toàn bộ dataset, giao tập với search.">
        <app-card-score-filter-example></app-card-score-filter-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tien-do-ty-le') {
      <demo-section
        heading="Tiến độ / tỷ lệ"
        data-example-typescript="./examples/card-score-progress.example.ts"
        data-example-template="./examples/card-score-progress.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[{ name: 'progress', value: 'done / total' }]"
        note="Hiển thị cả tử số/mẫu số; tổng 0 thì 0%, không chia cho 0.">
        <app-card-score-progress-example></app-card-score-progress-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-sanh-hai-ky') {
      <demo-section
        heading="So sánh hai kỳ"
        data-example-typescript="./examples/card-score-comparison.example.ts"
        data-example-template="./examples/card-score-comparison.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[{ name: 'higherIsBetter', value: 'per metric' }]"
        note="Delta ghi đơn vị và kỳ; không mặc định tăng là tốt cho mọi chỉ số.">
        <app-card-score-comparison-example></app-card-score-comparison-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-score-card-gon') {
      <demo-section
        heading="Score card gọn"
        data-example-typescript="./examples/card-score-compact.example.ts"
        data-example-template="./examples/card-score-compact.example.html"
        data-example-style="./examples/card-score-example.scss"
        [props]="[
          { name: 'padding', value: '12px' },
          { name: 'value', value: '22px' },
        ]"
        note="Giảm khoảng trắng, không giảm chữ đến khó đọc.">
        <app-card-score-compact-example></app-card-score-compact-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDemoComponent {}
