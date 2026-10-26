import { ButtonActionPopoverExampleComponent } from './examples/button-action-popover.example';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { ButtonAsyncExampleComponent } from './examples/button-async.example';
import { ButtonColorsExampleComponent } from './examples/button-colors.example';
import { ButtonCrudEntityExampleComponent } from './examples/button-crud-entity.example';
import { ButtonCrudExampleComponent } from './examples/button-crud.example';
import { ButtonDangerExampleComponent } from './examples/button-danger.example';
import { ButtonGroupedExampleComponent } from './examples/button-grouped.example';
import { ButtonIconOnlyExampleComponent } from './examples/button-icon-only.example';
import { ButtonIconSetExampleComponent } from './examples/button-icon-set.example';
import { ButtonIndicatorExampleComponent } from './examples/button-indicator.example';
import { ButtonQueryExampleComponent } from './examples/button-query.example';
import { ButtonSecondaryBlackExampleComponent } from './examples/button-secondary-black.example';
import { ButtonSizesExampleComponent } from './examples/button-sizes.example';
import { ButtonStatesExampleComponent } from './examples/button-states.example';
import { ButtonVariantsExampleComponent } from './examples/button-variants.example';
import { ButtonWorkflowExampleComponent } from './examples/button-workflow.example';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    ButtonVariantsExampleComponent,
    ButtonColorsExampleComponent,
    ButtonSecondaryBlackExampleComponent,
    ButtonSizesExampleComponent,
    ButtonIconOnlyExampleComponent,
    ButtonIconSetExampleComponent,
    ButtonStatesExampleComponent,
    ButtonActionPopoverExampleComponent,
    ButtonIndicatorExampleComponent,
    ButtonCrudExampleComponent,
    ButtonCrudEntityExampleComponent,
    ButtonQueryExampleComponent,
    ButtonWorkflowExampleComponent,
    ButtonDangerExampleComponent,
    ButtonGroupedExampleComponent,
    ButtonAsyncExampleComponent,
  ],
  template: `<demo-page
    #demoPage
    title="Button"
    description="Nút thao tác chuẩn: 4 biến thể (fill / light / outline / text), 3 kích thước, hỗ trợ icon và trạng thái loading.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-action-popover') {
      <demo-section
        heading="Action Popover"
        data-example-typescript="./examples/button-action-popover.example.ts"
        data-example-template="./examples/button-action-popover.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[{ name: 'children', value: 'sd-button-item / sd-button-item-divider' }]">
        <app-button-action-popover-example />
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bien-the') {
      <demo-section
        heading="Biến thể"
        data-example-typescript="./examples/button-variants.example.ts"
        data-example-template="./examples/button-variants.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[{ name: 'type', value: 'fill / light / outline / text' }]">
        <app-button-variants-example></app-button-variants-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-mau') {
      <demo-section
        heading="Bảng màu"
        data-example-typescript="./examples/button-colors.example.ts"
        data-example-template="./examples/button-colors.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[{ name: 'color', value: 'primary / secondary / black / success / info / warning / error' }]">
        <app-button-colors-example></app-button-colors-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-secondary-vs-black') {
      <demo-section
        heading="Secondary vs black"
        data-example-typescript="./examples/button-secondary-black.example.ts"
        data-example-template="./examples/button-secondary-black.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[{ name: 'color', value: 'secondary / black' }]">
        <app-button-secondary-black-example></app-button-secondary-black-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section
        heading="Kích thước"
        data-example-typescript="./examples/button-sizes.example.ts"
        data-example-template="./examples/button-sizes.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[{ name: 'size', value: 'sm / md / lg' }]">
        <app-button-sizes-example></app-button-sizes-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-icon') {
      <demo-section
        heading="Chỉ icon"
        data-example-typescript="./examples/button-icon-only.example.ts"
        data-example-template="./examples/button-icon-only.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[{ name: 'prefixIcon', value: 'name' }]">
        <app-button-icon-only-example></app-button-icon-only-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toggle-icon-set-bang-alias') {
      <demo-section
        heading="Toggle icon set bằng alias"
        data-example-typescript="./examples/button-icon-set.example.ts"
        data-example-template="./examples/button-icon-set.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' },
          { name: 'alias', value: 'add -> plus | delete -> trash-2 | visibility -> eye | more_vert -> ellipsis-vertical' },
        ]"
        note="Các button bên dưới vẫn truyền icon name theo Material; khi chuyển sang Lucide, SdIcon tự map qua alias tương ứng.">
        <app-button-icon-set-example></app-button-icon-set-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section
        heading="Trạng thái"
        data-example-typescript="./examples/button-states.example.ts"
        data-example-template="./examples/button-states.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'loading', value: 'true' },
          { name: 'disabled', value: 'true' },
          { name: 'block', value: 'true' },
        ]">
        <app-button-states-example></app-button-states-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-indicator') {
      <demo-section
        heading="Indicator"
        data-example-typescript="./examples/button-indicator.example.ts"
        data-example-template="./examples/button-indicator.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'indicator', value: 'true / number' },
          { name: 'indicatorColor', value: 'error / primary / success / info' },
          { name: 'indicatorMax', value: '9' },
          { name: 'indicatorLabel', value: 'text' },
        ]"
        note="Chấm hoặc số ở góc trên phải, không đổi kích thước nút. Số lớn hơn indicatorMax hiện {max}+; indicatorLabel nối vào aria-describedby.">
        <app-button-indicator-example></app-button-indicator-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-crud-chung-khuyen-khich') {
      <demo-section
        heading="CRUD chung (khuyến khích)"
        data-example-typescript="./examples/button-crud.example.ts"
        data-example-template="./examples/button-crud.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'type', value: 'fill' },
          { name: 'color', value: 'primary / error' },
          { name: 'prefixIcon', value: 'add / edit / save / delete' },
        ]"
        note="Tạo mới (add), Cập nhật (edit), Lưu (save): primary fill. Xoá (delete): error fill. Chi tiết dùng hyperlink mã hoặc tên.">
        <app-button-crud-example></app-button-crud-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-crud-theo-doi-tuong') {
      <demo-section
        heading="CRUD theo đối tượng"
        data-example-typescript="./examples/button-crud-entity.example.ts"
        data-example-template="./examples/button-crud-entity.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'title', value: 'tác vụ + đối tượng' },
          { name: 'prefixIcon', value: 'add / edit / save' },
        ]"
        note="Tạo khách hàng, Cập nhật khách hàng, Lưu khách hàng: primary fill, kèm icon add / edit / save.">
        <app-button-crud-entity-example></app-button-crud-entity-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-search-filter') {
      <demo-section
        heading="Search / filter"
        data-example-typescript="./examples/button-query.example.ts"
        data-example-template="./examples/button-query.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'type', value: 'light' },
          { name: 'color', value: 'primary / info / secondary' },
        ]"
        note="Tìm kiếm, Áp dụng bộ lọc, Xóa bộ lọc; live search không thêm nút Tìm kiếm dư thừa.">
        <app-button-query-example></app-button-query-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tac-vu-nghiep-vu') {
      <demo-section
        heading="Tác vụ nghiệp vụ"
        data-example-typescript="./examples/button-workflow.example.ts"
        data-example-template="./examples/button-workflow.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'type', value: 'light' },
          { name: 'color', value: 'primary / success / error / warning / info / secondary' },
          { name: 'tooltip', value: 'icon-only' },
        ]"
        note="Dùng light, màu theo ý nghĩa nghiệp vụ: primary/info cho gửi và xử lý, success cho duyệt, warning cho tạm dừng, error cho từ chối. Có mẫu kèm icon, không icon và icon-only có tooltip.">
        <app-button-workflow-example></app-button-workflow-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-hanh-dong-nguy-hiem') {
      <demo-section
        heading="Hành động nguy hiểm"
        data-example-typescript="./examples/button-danger.example.ts"
        data-example-template="./examples/button-danger.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'color', value: 'error' },
          { name: 'SdConfirmService', value: 'confirm' },
        ]"
        note="Nút Xoá dùng icon delete, error fill. Ghi rõ đối tượng và hậu quả trong hộp xác nhận; nút thoát là Giữ lại.">
        <app-button-danger-example></app-button-danger-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tac-vu-gop-popover') {
      <demo-section
        heading="Tác vụ gộp · Popover"
        data-example-typescript="./examples/button-grouped.example.ts"
        data-example-template="./examples/button-grouped.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'sd-button-item-divider', value: 'title' },
          { name: 'tooltip', value: 'icon-only' },
        ]"
        note="Dùng SdButton với SdButtonItem và SdButtonItemDivider. Popover hỗ trợ chuột, bàn phím, Escape và tooltip cho nút chỉ có icon.">
        <app-button-grouped-example></app-button-grouped-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dang-luu-loi-thu-lai') {
      <demo-section
        heading="Đang lưu / lỗi / thử lại"
        data-example-typescript="./examples/button-async.example.ts"
        data-example-template="./examples/button-async.example.html"
        data-example-style="./examples/button-example.scss"
        [props]="[
          { name: 'loading', value: 'true' },
          { name: 'disabled', value: 'pending' },
        ]"
        note="Đang lưu… disabled chống gửi lặp; lỗi giữ input và có Thử lại.">
        <app-button-async-example></app-button-async-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {}
